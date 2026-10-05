from datetime import datetime
from zoneinfo import ZoneInfo

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.modules.products.service import save_image
from app.modules.users.models import ROLES, User
from app.modules.users.repository import UserRepository
from app.modules.users.schemas import ProfileUpdate, UserCreate, UserStatOut, UserUpdate

repo = UserRepository()
TASHKENT = ZoneInfo("Asia/Tashkent")


def _check_role(role: str) -> None:
    if role not in ROLES:
        raise HTTPException(status_code=400, detail="Rol noto'g'ri")


class UserService:
    async def list_all(self, db: AsyncSession) -> list[User]:
        return await repo.list_all(db)

    async def stats(self, db: AsyncSession) -> list[UserStatOut]:
        now = datetime.now(TASHKENT)
        month = now.strftime("%Y-%m")
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        sales = await repo.sales_since(db, start)
        return [
            UserStatOut(
                user_id=user.id,
                last_seen_at=user.last_seen_at,
                active_seconds=user.active_seconds if user.active_month == month else 0,
                sales_count=sales.get(user.id, (0, 0))[0],
                sales_sum=sales.get(user.id, (0, 0))[1],
            )
            for user in await repo.list_all(db)
        ]

    async def update_profile(self, db: AsyncSession, user: User, data: ProfileUpdate) -> User:
        user.name = data.name.strip()
        user.phone = data.phone.strip()
        if data.avatar is not None:
            user.avatar = save_image(data.avatar) if data.avatar else None
        await db.flush()
        return user

    async def create(self, db: AsyncSession, data: UserCreate) -> User:
        _check_role(data.role)
        login = data.login.strip()
        if await repo.get_by_login(db, login):
            raise HTTPException(status_code=400, detail="Bu login band")
        user = User(
            name=data.name.strip(),
            phone=data.phone.strip(),
            login=login,
            password_hash=hash_password(data.password),
            role=data.role,
        )
        repo.add(db, user)
        await db.flush()
        return user

    async def update(self, db: AsyncSession, actor: User, user_id: int, data: UserUpdate) -> User:
        _check_role(data.role)
        user = await repo.get(db, user_id)
        if user is None:
            raise HTTPException(status_code=404, detail="Xodim topilmadi")
        login = data.login.strip()
        other = await repo.get_by_login(db, login)
        if other is not None and other.id != user.id:
            raise HTTPException(status_code=400, detail="Bu login band")
        if user.role == "admin" and data.role != "admin":
            if await repo.count_admins(db) <= 1:
                raise HTTPException(status_code=400, detail="Oxirgi admin rolini o'zgartirib bo'lmaydi")
        user.name = data.name.strip()
        user.phone = data.phone.strip()
        user.login = login
        user.role = data.role
        if data.password:
            if len(data.password) < 4:
                raise HTTPException(status_code=400, detail="Parol kamida 4 ta belgi")
            user.password_hash = hash_password(data.password)
        await db.flush()
        return user

    async def delete(self, db: AsyncSession, actor: User, user_id: int) -> None:
        user = await repo.get(db, user_id)
        if user is None:
            raise HTTPException(status_code=404, detail="Xodim topilmadi")
        if user.id == actor.id:
            raise HTTPException(status_code=400, detail="O'zingizni o'chira olmaysiz")
        if user.role == "admin" and await repo.count_admins(db) <= 1:
            raise HTTPException(status_code=400, detail="Oxirgi adminni o'chirib bo'lmaydi")
        await repo.delete(db, user)
