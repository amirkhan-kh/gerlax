from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.products.models import Product, ProductType, Sale


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

    async def list_products(self, db: AsyncSession) -> list[Product]:
        result = await db.scalars(
            select(Product).options(selectinload(Product.type)).order_by(Product.created_at.desc())
        )
        return list(result.all())

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
