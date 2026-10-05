from datetime import datetime
from zoneinfo import ZoneInfo

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import SessionLocal, get_db
from app.core.security import decode_token
from app.modules.users.models import User
from app.modules.users.repository import UserRepository

bearer = HTTPBearer(auto_error=False)
users = UserRepository()
TASHKENT = ZoneInfo("Asia/Tashkent")
IDLE_GAP_SECONDS = 120

TRACK_SQL = text(
    """
    UPDATE users SET
      active_seconds = CASE WHEN active_month = :month THEN active_seconds ELSE 0 END
        + CASE
            WHEN active_month = :month
              AND last_seen_at > CAST(:now AS timestamptz) - make_interval(secs => CAST(:gap AS int))
            THEN GREATEST(0, ROUND(EXTRACT(EPOCH FROM (CAST(:now AS timestamptz) - last_seen_at))))::int
            ELSE 0
          END,
      active_month = :month,
      last_seen_at = CAST(:now AS timestamptz)
    WHERE id = :id
    """
)


async def track_activity(user_id: int) -> None:
    now = datetime.now(TASHKENT)
    # Separate short transaction so the row lock is not held for the whole request.
    async with SessionLocal() as session:
        await session.execute(
            TRACK_SQL,
            {"id": user_id, "now": now, "month": now.strftime("%Y-%m"), "gap": IDLE_GAP_SECONDS},
        )
        await session.commit()


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
    await track_activity(user.id)
    return user


async def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Faqat admin")
    return user
