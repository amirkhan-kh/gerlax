from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.modules.auth.router import router as auth_router
from app.modules.products.router import router as products_router
from app.modules.products.router import sales_router
from app.modules.users.router import router as users_router
from app.seed import seed


@asynccontextmanager
async def lifespan(_: FastAPI):
    await seed()
    yield


app = FastAPI(title="Gerlax", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")
app.include_router(products_router, prefix="/api/v1")
app.include_router(sales_router, prefix="/api/v1")
uploads = Path(__file__).resolve().parents[1] / "uploads"
uploads.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads), name="uploads")


@app.get("/api/v1/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
