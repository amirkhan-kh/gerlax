import base64
import hashlib
from datetime import datetime
from zoneinfo import ZoneInfo

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.products.models import Cancellation, Order, Product, ProductType, Sale
from app.modules.products.repository import ProductRepository
from app.modules.products.schemas import (
    ArchivedOut,
    CancelIn,
    OrderCreate,
    ProductOut,
    ProductUpdate,
    ReturnIn,
    SaleOut,
    SellIn,
    SummaryOut,
    TypeCreate,
    TypeOut,
)
from app.modules.users.models import User

repo = ProductRepository()
PAYMENTS = ("full", "partial", "cash")
CANCEL_ACTIONS = ("stock", "archive")
CONDITIONS = ("ok", "defect")
TASHKENT = ZoneInfo("Asia/Tashkent")


def _check_owner(user: User, owner_id: int | None) -> None:
    if user.role != "admin" and owner_id != user.id:
        raise HTTPException(status_code=403, detail="Faqat o'zingiz ishlagan tovar bilan amal qila olasiz")


def _decode_image(data_url: str) -> tuple[str, bytes]:
    if not data_url.startswith("data:image/") or ";base64," not in data_url:
        raise HTTPException(status_code=400, detail="Rasm noto'g'ri")
    head, b64 = data_url.split(";base64,", 1)
    try:
        raw = base64.b64decode(b64, validate=True)
    except ValueError:
        raise HTTPException(status_code=400, detail="Rasm noto'g'ri") from None
    return head.removeprefix("data:"), raw


def save_image(data_url: str) -> str:
    _, raw = _decode_image(data_url)
    if not raw or len(raw) > 2_500_000:
        raise HTTPException(status_code=400, detail="Rasm juda katta")
    return data_url


def image_key(data_url: str) -> str:
    return hashlib.md5(data_url.encode()).hexdigest()[:12]


def to_product(product: Product) -> ProductOut:
    return ProductOut(
        id=product.id,
        type_id=product.type_id,
        type_name=product.type.name,
        order_id=product.order_id,
        name=product.name,
        address=product.address,
        image_key=product.image_key,
        client_name=product.client_name,
        price=product.price,
        quantity=product.quantity,
        delivery_at=product.delivery_at,
        created_by_name=product.created_by_name,
        created_by_id=product.created_by_id,
        created_at=product.created_at,
    )


def to_archived(product: Product, sale: Sale | None = None) -> ArchivedOut:
    return ArchivedOut(
        **to_product(product).model_dump(),
        status=product.status,
        sold_at=sale.sold_at if sale else None,
        sold_by_name=sale.sold_by_name if sale else None,
        paid_amount=sale.paid_amount if sale else None,
        archive_kind=product.archive_kind,
        archive_reason=product.archive_reason,
        archived_by_name=product.archived_by_name,
        archived_at=product.archived_at,
        refund_amount=product.refund_amount,
    )


def to_sale(sale: Sale) -> SaleOut:
    return SaleOut(
        id=sale.id,
        product_name=sale.product_name,
        type_name=sale.type_name,
        address=sale.address,
        price=sale.price,
        quantity=sale.quantity,
        delivery_at=sale.delivery_at,
        payment_kind=sale.payment_kind,
        paid_amount=sale.paid_amount,
        debt_amount=sale.debt_amount,
        sold_by_name=sale.sold_by_name,
        sold_by_id=sale.sold_by_id,
        sold_at=sale.sold_at,
        status=sale.status,
        returned_at=sale.returned_at,
        returned_by_name=sale.returned_by_name,
        return_reason=sale.return_reason,
        return_condition=sale.return_condition,
        refund_amount=sale.refund_amount,
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

    async def image(self, db: AsyncSession, product_id: int) -> tuple[str, bytes]:
        data_url = await repo.get_image(db, product_id)
        if not data_url:
            raise HTTPException(status_code=404, detail="Rasm topilmadi")
        return _decode_image(data_url)

    async def create_order(self, db: AsyncSession, user: User, data: OrderCreate) -> list[ProductOut]:
        client = (data.client_name or "").strip() or None
        if client is None and user.role != "admin":
            raise HTTPException(status_code=400, detail="Klient ismini kiriting")
        types = {item.id: item for item in await repo.list_types(db)}
        if any(item.type_id not in types for item in data.items):
            raise HTTPException(status_code=400, detail="Tovar turi topilmadi")
        order = None
        if client is not None:
            order = Order(client_name=client, created_by_id=user.id, created_by_name=user.name)
            repo.add_order(db, order)
            await db.flush()
        products = []
        for item in data.items:
            image = save_image(item.image) if item.image else None
            product = Product(
                type_id=item.type_id,
                order_id=order.id if order else None,
                name=item.name.strip(),
                address=data.address.strip(),
                image=image,
                image_key=image_key(image) if image else None,
                client_name=client,
                price=item.price,
                quantity=item.quantity,
                delivery_at=data.delivery_at,
                created_by_name=user.name,
                created_by_id=user.id,
            )
            repo.add_product(db, product)
            products.append(product)
        await db.flush()
        for product in products:
            product.type = types[product.type_id]
        return [to_product(product) for product in products]

    async def update_product(self, db: AsyncSession, user: User, product_id: int, data: ProductUpdate) -> ProductOut:
        product = await repo.get_product(db, product_id)
        if product is None or product.status != "active":
            raise HTTPException(status_code=404, detail="Tovar topilmadi")
        _check_owner(user, product.created_by_id)
        kind = await repo.get_type(db, data.type_id)
        if kind is None:
            raise HTTPException(status_code=400, detail="Tovar turi topilmadi")
        client = (data.client_name or "").strip() or None
        if client is None and user.role != "admin":
            raise HTTPException(status_code=400, detail="Klient ismini kiriting")
        address = data.address.strip()
        product.type = kind
        product.name = data.name.strip()
        product.price = data.price
        product.quantity = data.quantity
        if data.image:
            product.image = save_image(data.image)
            product.image_key = image_key(data.image)
        elif data.remove_image:
            product.image = None
            product.image_key = None
        if client is None:
            product.order_id = None
        elif product.order_id is not None:
            for sibling in await repo.list_order_products(db, product.order_id):
                sibling.client_name = client
                sibling.address = address
                sibling.delivery_at = data.delivery_at
            order = await repo.get_order(db, product.order_id)
            if order is not None:
                order.client_name = client
        product.client_name = client
        product.address = address
        product.delivery_at = data.delivery_at
        await db.flush()
        return to_product(product)

    async def sell(self, db: AsyncSession, user: User, product_id: int, data: SellIn) -> SaleOut:
        if data.payment_kind not in PAYMENTS:
            raise HTTPException(status_code=400, detail="To'lov turi noto'g'ri")
        product = await repo.get_product(db, product_id)
        if product is None or product.status != "active":
            raise HTTPException(status_code=404, detail="Tovar topilmadi")
        quantity = data.quantity or product.quantity
        if quantity > product.quantity:
            raise HTTPException(status_code=400, detail=f"Faqat {product.quantity} dona bor")
        total = product.price * quantity
        if data.payment_kind == "partial":
            if data.paid_amount is None:
                raise HTTPException(status_code=400, detail="To'langan summani kiriting")
            if data.paid_amount < 0 or data.paid_amount >= total:
                raise HTTPException(status_code=400, detail="Qisman to'lov jami summadan kichik bo'lishi kerak")
            paid = data.paid_amount
            debt = total - paid
        else:
            paid = total
            debt = 0
        if quantity < product.quantity:
            sold = await self._split(db, product, quantity)
            product.quantity -= quantity
        else:
            sold = product
        sold.status = "sold"
        sale = Sale(
            product_name=product.name,
            type_name=product.type.name,
            address=product.address,
            price=total,
            quantity=quantity,
            delivery_at=product.delivery_at,
            payment_kind=data.payment_kind,
            paid_amount=paid,
            debt_amount=debt,
            sold_by_name=user.name,
            sold_by_id=user.id,
            product_id=sold.id,
        )
        repo.add_sale(db, sale)
        await db.flush()
        return to_sale(sale)

    async def list_sales(self, db: AsyncSession) -> list[SaleOut]:
        rows = await repo.list_sales(db)
        return [to_sale(row) for row in rows]

    async def list_archive(self, db: AsyncSession) -> list[ArchivedOut]:
        rows = await repo.list_archive(db)
        return [to_archived(product, sale) for product, sale in rows]

    async def cancel(self, db: AsyncSession, user: User, product_id: int, data: CancelIn) -> None:
        if data.action not in CANCEL_ACTIONS:
            raise HTTPException(status_code=400, detail="Amal noto'g'ri")
        product = await repo.get_product(db, product_id)
        if product is None or product.status != "active":
            raise HTTPException(status_code=404, detail="Tovar topilmadi")
        _check_owner(user, product.created_by_id)
        if data.action == "stock" and product.client_name is None:
            raise HTTPException(status_code=400, detail="Tovar allaqachon omborda")
        total = product.price * product.quantity
        if data.refund_amount > total:
            raise HTTPException(status_code=400, detail="Qaytarilgan summa jami summadan oshmasin")
        reason = data.reason.strip()
        repo.add_cancellation(
            db,
            Cancellation(
                product_id=product.id,
                product_name=product.name,
                client_name=product.client_name,
                price=total,
                action=data.action,
                reason=reason,
                refund_amount=data.refund_amount,
                cancelled_by_id=user.id,
                cancelled_by_name=user.name,
            ),
        )
        if data.action == "stock":
            product.client_name = None
            product.order_id = None
        else:
            self._archive(product, user, "cancelled", reason, data.refund_amount)
        await db.flush()

    async def return_sale(self, db: AsyncSession, user: User, sale_id: int, data: ReturnIn) -> SaleOut:
        if data.condition not in CONDITIONS:
            raise HTTPException(status_code=400, detail="Tovar holati noto'g'ri")
        sale = await repo.get_sale(db, sale_id)
        if sale is None:
            raise HTTPException(status_code=404, detail="Sotuv topilmadi")
        if sale.status == "returned":
            raise HTTPException(status_code=400, detail="Bu sotuv allaqachon qaytarilgan")
        _check_owner(user, sale.sold_by_id)
        product = await repo.get_product(db, sale.product_id) if sale.product_id else None
        if product is None or product.status != "sold":
            product = await self._restore(db, sale)
        reason = data.reason.strip()
        if data.condition == "ok":
            product.status = "active"
            product.client_name = None
            product.order_id = None
        else:
            self._archive(product, user, "defect", reason, sale.paid_amount)
        sale.status = "returned"
        sale.refund_amount = sale.paid_amount
        sale.debt_amount = 0
        sale.returned_at = datetime.now(TASHKENT)
        sale.returned_by_id = user.id
        sale.returned_by_name = user.name
        sale.return_reason = reason
        sale.return_condition = data.condition
        sale.product_id = product.id
        await db.flush()
        return to_sale(sale)

    async def summary(self, db: AsyncSession) -> SummaryOut:
        start = datetime.now(TASHKENT).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        returns, refund, cancellations, archived = await repo.month_summary(db, start)
        return SummaryOut(
            month_returns=returns,
            month_refund=refund,
            month_cancellations=cancellations,
            month_archived=archived,
        )

    @staticmethod
    def _archive(product: Product, user: User, kind: str, reason: str, refund: int) -> None:
        product.status = "archived"
        product.archive_kind = kind
        product.archive_reason = reason
        product.archived_by_name = user.name
        product.archived_at = datetime.now(TASHKENT)
        product.refund_amount = refund

    @staticmethod
    async def _split(db: AsyncSession, product: Product, quantity: int) -> Product:
        image = await repo.get_image(db, product.id)
        part = Product(
            type_id=product.type_id,
            order_id=product.order_id,
            name=product.name,
            address=product.address,
            image=image,
            image_key=product.image_key,
            client_name=product.client_name,
            color=product.color,
            price=product.price,
            quantity=quantity,
            delivery_at=product.delivery_at,
            created_by_name=product.created_by_name,
            created_by_id=product.created_by_id,
        )
        repo.add_product(db, part)
        await db.flush()
        part.type = product.type
        return part

    @staticmethod
    async def _restore(db: AsyncSession, sale: Sale) -> Product:
        kind = await repo.get_type_by_name(db, sale.type_name)
        if kind is None:
            kind = ProductType(name=sale.type_name)
            repo.add_type(db, kind)
            await db.flush()
        product = Product(
            type_id=kind.id,
            name=sale.product_name,
            address=sale.address,
            color=sale.color,
            price=sale.price // max(sale.quantity, 1),
            quantity=sale.quantity,
            delivery_at=sale.delivery_at,
            created_by_name=sale.sold_by_name,
            created_by_id=sale.sold_by_id,
            status="active",
        )
        repo.add_product(db, product)
        await db.flush()
        product.type = kind
        return product
