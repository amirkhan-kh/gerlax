from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.modules.auth.schemas import LoginIn, RefreshIn, TokenOut
from app.modules.auth.service import AuthService
from app.modules.users.models import User
from app.modules.users.schemas import UserOut

router = APIRouter(prefix="/auth", tags=["auth"])
service = AuthService()


@router.post("/login", response_model=TokenOut)
async def login(data: LoginIn, db: AsyncSession = Depends(get_db)) -> TokenOut:
    return await service.login(db, data.login, data.password)


@router.post("/refresh", response_model=TokenOut)
async def refresh(data: RefreshIn, db: AsyncSession = Depends(get_db)) -> TokenOut:
    return await service.refresh(db, data.refresh_token)


@router.get("/me", response_model=UserOut)
async def me(user: User = Depends(get_current_user)) -> User:
    return user
