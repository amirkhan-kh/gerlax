from sqlalchemy import select

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.modules.products.models import ProductType
from app.modules.users.models import User

TYPES = ("Zaryadchik", "Naushnik", "USB kabel", "Ochiq kabel", "Chexol", "Powerbank")


async def seed() -> None:
    async with SessionLocal() as db:
        admin = await db.scalar(select(User).where(User.login == "admin"))
        if admin is None:
            db.add(
                User(
                    name="Admin",
                    phone="+998900000000",
                    login="admin",
                    password_hash=hash_password("admin123"),
                    role="admin",
                )
            )
        for name in TYPES:
            found = await db.scalar(select(ProductType).where(ProductType.name == name))
            if found is None:
                db.add(ProductType(name=name))
        await db.commit()
