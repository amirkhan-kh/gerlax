from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.users.models import User


class UserRepository:
    async def get(self, db: AsyncSession, user_id: int) -> User | None:
        return await db.get(User, user_id)

    async def get_by_login(self, db: AsyncSession, login: str) -> User | None:
        result = await db.scalars(select(User).where(User.login == login))
        return result.first()

    async def list_all(self, db: AsyncSession) -> list[User]:
        result = await db.scalars(select(User).order_by(User.id))
        return list(result.all())

    async def count_admins(self, db: AsyncSession) -> int:
        result = await db.scalars(select(User).where(User.role == "admin"))
        return len(result.all())

    def add(self, db: AsyncSession, user: User) -> None:
        db.add(user)

    async def delete(self, db: AsyncSession, user: User) -> None:
        await db.delete(user)
