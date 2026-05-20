from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

from .database import init_db

STATIC_DIR = Path(__file__).parent.parent.parent / "frontend" / "out"


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


@app.get("/api/health")
def health():
    return {"status": "ok"}


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
