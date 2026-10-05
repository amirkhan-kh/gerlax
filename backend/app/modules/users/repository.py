from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.products.models import Sale
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

    async def sales_since(self, db: AsyncSession, since: datetime) -> dict[int, tuple[int, int]]:
        result = await db.execute(
            select(Sale.sold_by_id, func.count(Sale.id), func.coalesce(func.sum(Sale.price), 0))
            .where(Sale.sold_by_id.is_not(None), Sale.sold_at >= since, Sale.status != "returned")
            .group_by(Sale.sold_by_id)
        )
        return {row[0]: (row[1], row[2]) for row in result.all()}

    def add(self, db: AsyncSession, user: User) -> None:
        db.add(user)

    async def delete(self, db: AsyncSession, user: User) -> None:
        await db.delete(user)
