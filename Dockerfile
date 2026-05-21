# Stage 1: Build Next.js static export
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: FastAPI backend
FROM python:3.12-slim
WORKDIR /app

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Install backend and its dependencies
COPY backend/ ./backend/
WORKDIR /app/backend
RUN uv pip install --system .

# Copy built frontend and templates
COPY --from=frontend-builder /app/frontend/out /app/frontend/out
COPY templates/ /app/templates/

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
