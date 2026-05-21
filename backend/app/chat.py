import json
import logging
import os
from typing import Any, Literal, Optional

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from litellm import acompletion
from pydantic import BaseModel

logger = logging.getLogger(__name__)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
if not OPENROUTER_API_KEY:
    raise RuntimeError("OPENROUTER_API_KEY is not set")

router = APIRouter()

MODEL = "openrouter/openai/gpt-oss-120b"
EXTRA_BODY = {"provider": {"order": ["cerebras"]}}

SYSTEM_PROMPT = """You are a friendly legal assistant helping users draft a Mutual Non-Disclosure Agreement (MNDA) based on the Common Paper Mutual NDA Standard Terms v1.0.

Your goal is to collect the following information through natural conversation:
- Party 1: full name (printName), title, company name, notice address (email or postal)
- Party 2: full name (printName), title, company name, notice address (email or postal)
- Purpose: how the confidential information may be used
- Effective date (YYYY-MM-DD format)
- MNDA term: either expires after N years ("expires" + mndaTermYears) or continues until terminated ("until_terminated")
- Term of confidentiality: either N years ("years" + confidentialityTermYears) or in perpetuity ("perpetuity")
- Governing law state (e.g. "Delaware")
- Jurisdiction city and state (e.g. "Wilmington", "DE")
- Modifications: any changes to the standard terms (optional — most skip this)

Current document state:
{current_fields}

Guidelines:
- If the conversation is just starting, greet the user warmly and ask about the two parties first
- Ask about 1-2 missing fields at a time
- Be concise and professional
- Briefly confirm what you heard before moving on
- If all key fields are filled, tell the user the document looks complete and they can download it"""

EXTRACTION_SYSTEM = """Extract NDA field values explicitly stated in this conversation. Return only values clearly provided by the user.

Fields:
- purpose: how confidential information may be used (string)
- effectiveDate: date in YYYY-MM-DD format only (string)
- mndaTermType: "expires" or "until_terminated" (string)
- mndaTermYears: integer years, only if mndaTermType is "expires"
- confidentialityTermType: "years" or "perpetuity" (string)
- confidentialityTermYears: integer years, only if confidentialityTermType is "years"
- governingLawState: full state name e.g. "Delaware" (string)
- jurisdictionCity: city or county name (string)
- jurisdictionState: state abbreviation e.g. "DE" (string)
- modifications: modifications to standard terms, empty string if none explicitly stated (string)
- party1 / party2: printName (full name), title, company, noticeAddress

Leave all unmentioned fields as null."""


class PartyUpdate(BaseModel):
    printName: Optional[str] = None
    title: Optional[str] = None
    company: Optional[str] = None
    noticeAddress: Optional[str] = None


class NDAFieldsUpdate(BaseModel):
    purpose: Optional[str] = None
    effectiveDate: Optional[str] = None
    mndaTermType: Optional[Literal["expires", "until_terminated"]] = None
    mndaTermYears: Optional[int] = None
    confidentialityTermType: Optional[Literal["years", "perpetuity"]] = None
    confidentialityTermYears: Optional[int] = None
    governingLawState: Optional[str] = None
    jurisdictionCity: Optional[str] = None
    jurisdictionState: Optional[str] = None
    modifications: Optional[str] = None
    party1: Optional[PartyUpdate] = None
    party2: Optional[PartyUpdate] = None


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    current_fields: dict[str, Any]


@router.post("/api/chat")
async def chat(request: ChatRequest):
    messages_dicts = [{"role": m.role, "content": m.content} for m in request.messages]

    if not messages_dicts:
        messages_dicts = [{"role": "user", "content": "Hello"}]

    system_content = SYSTEM_PROMPT.format(
        current_fields=json.dumps(request.current_fields, indent=2)
    )

    async def generate():
        full_message = ""

        try:
            stream = await acompletion(
                model=MODEL,
                messages=[{"role": "system", "content": system_content}] + messages_dicts,
                extra_body=EXTRA_BODY,
                stream=True,
                api_key=OPENROUTER_API_KEY,
            )
            async for chunk in stream:
                token = chunk.choices[0].delta.content or ""
                if token:
                    full_message += token
                    yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"
        except Exception as e:
            logger.error("LLM stream error: %s", e)
            yield f"data: {json.dumps({'type': 'error', 'content': 'An error occurred. Please try again.'})}\n\n"
            yield "data: [DONE]\n\n"
            return

        try:
            extraction_messages = [
                {"role": "system", "content": EXTRACTION_SYSTEM},
                *messages_dicts,
                {"role": "assistant", "content": full_message},
            ]
            fields_response = await acompletion(
                model=MODEL,
                messages=extraction_messages,
                response_format={
                    "type": "json_schema",
                    "json_schema": {
                        "name": "NDAFieldsUpdate",
                        "schema": NDAFieldsUpdate.model_json_schema(),
                        "strict": True,
                    },
                },
                extra_body=EXTRA_BODY,
                api_key=OPENROUTER_API_KEY,
            )
            content = fields_response.choices[0].message.content
            fields = NDAFieldsUpdate.model_validate_json(content)
            non_null = fields.model_dump(exclude_none=True)
            if non_null:
                yield f"data: {json.dumps({'type': 'fields', 'fields': non_null})}\n\n"
        except Exception as e:
            logger.error("Field extraction error: %s", e)

        yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
