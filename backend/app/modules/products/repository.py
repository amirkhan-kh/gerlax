from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.products.models import Cancellation, Product, ProductType, Sale


class ProductRepository:
    async def list_types(self, db: AsyncSession) -> list[ProductType]:
        result = await db.scalars(select(ProductType).order_by(ProductType.name))
        return list(result.all())

    async def get_type(self, db: AsyncSession, type_id: int) -> ProductType | None:
        return await db.get(ProductType, type_id)

    async def get_type_by_name(self, db: AsyncSession, name: str) -> ProductType | None:
        result = await db.scalars(select(ProductType).where(ProductType.name == name))
        return result.first()

    def add_type(self, db: AsyncSession, item: ProductType) -> None:
        db.add(item)

    async def list_products(self, db: AsyncSession, status: str = "active") -> list[Product]:
        order = Product.archived_at.desc() if status == "archived" else Product.created_at.desc()
        result = await db.scalars(
            select(Product).options(selectinload(Product.type)).where(Product.status == status).order_by(order)
        )
        return list(result.all())

    async def list_archive(self, db: AsyncSession) -> list[tuple[Product, Sale | None]]:
        result = await db.execute(
            select(Product, Sale)
            .options(selectinload(Product.type))
            .outerjoin(Sale, (Sale.product_id == Product.id) & (Sale.status == "sold"))
            .where(Product.status.in_(("archived", "sold")))
            .order_by(func.coalesce(Product.archived_at, Sale.sold_at).desc())
        )
        return [(row[0], row[1]) for row in result.all()]

    async def get_sale(self, db: AsyncSession, sale_id: int) -> Sale | None:
        return await db.get(Sale, sale_id)

    def add_cancellation(self, db: AsyncSession, item: Cancellation) -> None:
        db.add(item)

    async def month_summary(self, db: AsyncSession, since: datetime) -> tuple[int, int, int, int]:
        returns = (
            await db.execute(
                select(func.count(Sale.id), func.coalesce(func.sum(Sale.refund_amount), 0)).where(
                    Sale.status == "returned", Sale.returned_at >= since
                )
            )
        ).one()
        cancellations = await db.scalar(select(func.count(Cancellation.id)).where(Cancellation.cancelled_at >= since))
        archived = await db.scalar(
            select(func.count(Cancellation.id)).where(
                Cancellation.action == "archive", Cancellation.cancelled_at >= since
            )
        )
        return returns[0], returns[1], cancellations or 0, archived or 0

    async def get_product(self, db: AsyncSession, product_id: int) -> Product | None:
        result = await db.scalars(
            select(Product).options(selectinload(Product.type)).where(Product.id == product_id)
        )
        return result.first()

    def add_product(self, db: AsyncSession, product: Product) -> None:
        db.add(product)

    async def delete_product(self, db: AsyncSession, product: Product) -> None:
        await db.delete(product)

    async def list_sales(self, db: AsyncSession) -> list[Sale]:
        result = await db.scalars(select(Sale).order_by(Sale.sold_at.desc()).limit(200))
        return list(result.all())

    def add_sale(self, db: AsyncSession, sale: Sale) -> None:
        db.add(sale)
