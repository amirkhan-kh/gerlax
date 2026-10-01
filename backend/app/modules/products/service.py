from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.products.models import Product, ProductType, Sale
from app.modules.products.repository import ProductRepository
from app.modules.products.schemas import ProductCreate, ProductOut, SaleOut, SellIn, TypeCreate, TypeOut
from app.modules.users.models import User

repo = ProductRepository()
PAYMENTS = ("full", "partial", "cash")


def to_product(product: Product) -> ProductOut:
    return ProductOut(
        id=product.id,
        type_id=product.type_id,
        type_name=product.type.name,
        name=product.name,
        address=product.address,
        color=product.color,
        price=product.price,
        delivery_at=product.delivery_at,
        created_by_name=product.created_by_name,
        created_at=product.created_at,
    )


def to_sale(sale: Sale) -> SaleOut:
    return SaleOut(
        id=sale.id,
        product_name=sale.product_name,
        type_name=sale.type_name,
        address=sale.address,
        color=sale.color,
        price=sale.price,
        delivery_at=sale.delivery_at,
        payment_kind=sale.payment_kind,
        paid_amount=sale.paid_amount,
        debt_amount=sale.debt_amount,
        sold_by_name=sale.sold_by_name,
        sold_at=sale.sold_at,
    )


class ProductService:
    async def list_types(self, db: AsyncSession) -> list[TypeOut]:
        rows = await repo.list_types(db)
        return [TypeOut(id=row.id, name=row.name) for row in rows]

    async def create_type(self, db: AsyncSession, data: TypeCreate) -> TypeOut:
        name = data.name.strip()
        if await repo.get_type_by_name(db, name):
            raise HTTPException(status_code=400, detail="Bu tur allaqachon bor")
        item = ProductType(name=name)
        repo.add_type(db, item)
        await db.flush()
        return TypeOut(id=item.id, name=item.name)

    async def list_products(self, db: AsyncSession) -> list[ProductOut]:
        rows = await repo.list_products(db)
        return [to_product(row) for row in rows]

    async def create_product(self, db: AsyncSession, user: User, data: ProductCreate) -> ProductOut:
        kind = await repo.get_type(db, data.type_id)
        if kind is None:
            raise HTTPException(status_code=400, detail="Tovar turi topilmadi")
        product = Product(
            type_id=kind.id,
            name=data.name.strip(),
            address=data.address.strip(),
            color=data.color.strip(),
            price=data.price,
            delivery_at=data.delivery_at,
            created_by_name=user.name,
        )
        repo.add_product(db, product)
        await db.flush()
        product.type = kind
        return to_product(product)

    async def sell(self, db: AsyncSession, user: User, product_id: int, data: SellIn) -> SaleOut:
        if data.payment_kind not in PAYMENTS:
            raise HTTPException(status_code=400, detail="To'lov turi noto'g'ri")
        product = await repo.get_product(db, product_id)
        if product is None:
            raise HTTPException(status_code=404, detail="Tovar topilmadi")
        if data.payment_kind == "partial":
            if data.paid_amount is None:
                raise HTTPException(status_code=400, detail="To'langan summani kiriting")
            if data.paid_amount < 0 or data.paid_amount >= product.price:
                raise HTTPException(status_code=400, detail="Qisman to'lov narxdan kichik bo'lishi kerak")
            paid = data.paid_amount
            debt = product.price - paid
        else:
            paid = product.price
            debt = 0
        sale = Sale(
            product_name=product.name,
            type_name=product.type.name,
            address=product.address,
            color=product.color,
            price=product.price,
            delivery_at=product.delivery_at,
            payment_kind=data.payment_kind,
            paid_amount=paid,
            debt_amount=debt,
            sold_by_name=user.name,
        )
        repo.add_sale(db, sale)
        await repo.delete_product(db, product)
        await db.flush()
        return to_sale(sale)

    async def list_sales(self, db: AsyncSession) -> list[SaleOut]:
        rows = await repo.list_sales(db)
        return [to_sale(row) for row in rows]
