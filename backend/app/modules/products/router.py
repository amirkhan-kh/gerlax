from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_admin
from app.modules.products.schemas import (
    ArchivedOut,
    CancelIn,
    ProductCreate,
    ProductOut,
    ReturnIn,
    SaleOut,
    SellIn,
    SummaryOut,
    TypeCreate,
    TypeOut,
)
from app.modules.products.service import ProductService
from app.modules.users.models import User

router = APIRouter(prefix="/products", tags=["products"])
sales_router = APIRouter(prefix="/sales", tags=["sales"])
service = ProductService()


@router.get("/types", response_model=list[TypeOut])
async def list_types(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[TypeOut]:
    return await service.list_types(db)


@router.post("/types", response_model=TypeOut)
async def create_type(
    data: TypeCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> TypeOut:
    return await service.create_type(db, data)


@router.get("", response_model=list[ProductOut])
async def list_products(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[ProductOut]:
    return await service.list_products(db)


@router.get("/archive", response_model=list[ArchivedOut])
async def list_archive(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[ArchivedOut]:
    return await service.list_archive(db)


@router.post("/{product_id}/cancel", status_code=204)
async def cancel_product(
    product_id: int,
    data: CancelIn,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> None:
    await service.cancel(db, user, product_id, data)


@router.post("", response_model=ProductOut)
async def create_product(
    data: ProductCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ProductOut:
    return await service.create_product(db, user, data)


@router.post("/{product_id}/sell", response_model=SaleOut)
async def sell_product(
    product_id: int,
    data: SellIn,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> SaleOut:
    return await service.sell(db, user, product_id, data)


@sales_router.get("", response_model=list[SaleOut])
async def list_sales(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[SaleOut]:
    return await service.list_sales(db)


@sales_router.get("/summary", response_model=SummaryOut)
async def sales_summary(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> SummaryOut:
    return await service.summary(db)


@sales_router.post("/{sale_id}/return", response_model=SaleOut)
async def return_sale(
    sale_id: int,
    data: ReturnIn,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> SaleOut:
    return await service.return_sale(db, user, sale_id, data)
