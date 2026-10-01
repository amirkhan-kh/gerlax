from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_admin
from app.modules.products.schemas import ProductCreate, ProductOut, SaleOut, SellIn, TypeCreate, TypeOut
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
