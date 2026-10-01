from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import decode_token
from app.modules.users.models import User
from app.modules.users.repository import UserRepository

bearer = HTTPBearer(auto_error=False)
users = UserRepository()


async def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: AsyncSession = Depends(get_db),
) -> User:
    if creds is None:
        raise HTTPException(status_code=401, detail="Kirish talab qilinadi")
    try:
        payload = decode_token(creds.credentials)
    except JWTError:
        raise HTTPException(status_code=401, detail="Sessiya tugagan")
    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Sessiya tugagan")
    user = await users.get(db, int(payload["sub"]))
    if user is None:
        raise HTTPException(status_code=401, detail="Foydalanuvchi topilmadi")
    return user


async def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Faqat admin")
    return user
