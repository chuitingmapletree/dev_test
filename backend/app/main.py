from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException

load_dotenv(Path(__file__).parent.parent.parent / ".env")
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, PlainTextResponse

from .chat import router as chat_router
from .database import init_db

STATIC_DIR = Path(__file__).parent.parent.parent / "frontend" / "out"
TEMPLATES_DIR = Path(__file__).parent.parent.parent / "templates"


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/templates/{filename}")
def get_template(filename: str):
    # Prevent path traversal
    if "/" in filename or "\\" in filename or ".." in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
    path = TEMPLATES_DIR / filename
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Template not found")
    return PlainTextResponse(path.read_text(encoding="utf-8"))


@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    if not full_path:
        return FileResponse(STATIC_DIR / "index.html")

    file_path = STATIC_DIR / full_path
    if file_path.is_file():
        return FileResponse(file_path)

    dir_index = file_path / "index.html"
    if dir_index.is_file():
        return FileResponse(dir_index)

    html_path = STATIC_DIR / f"{full_path}.html"
    if html_path.is_file():
        return FileResponse(html_path)

    root_index = STATIC_DIR / "index.html"
    if root_index.is_file():
        return FileResponse(root_index)

    return JSONResponse({"error": "Not found"}, status_code=404)
