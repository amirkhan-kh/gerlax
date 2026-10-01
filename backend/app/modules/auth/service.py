from fastapi import HTTPException
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import create_token, decode_token, verify_password
from app.modules.auth.schemas import TokenOut
from app.modules.users.repository import UserRepository

users = UserRepository()


def _tokens(user_id: int, role: str) -> TokenOut:
    return TokenOut(
        access_token=create_token(user_id, role, "access", settings.access_token_minutes),
        refresh_token=create_token(user_id, role, "refresh", settings.refresh_token_minutes),
    )


class AuthService:
    async def login(self, db: AsyncSession, login: str, password: str) -> TokenOut:
        user = await users.get_by_login(db, login.strip())
        if user is None or not verify_password(password, user.password_hash):
            raise HTTPException(status_code=401, detail="Login yoki parol noto'g'ri")
        return _tokens(user.id, user.role)

    async def refresh(self, db: AsyncSession, refresh_token: str) -> TokenOut:
        try:
            payload = decode_token(refresh_token)
        except JWTError:
            raise HTTPException(status_code=401, detail="Sessiya tugagan")
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Sessiya tugagan")
        user = await users.get(db, int(payload["sub"]))
        if user is None:
            raise HTTPException(status_code=401, detail="Foydalanuvchi topilmadi")
        return _tokens(user.id, user.role)
