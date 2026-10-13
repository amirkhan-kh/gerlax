from datetime import datetime

from pydantic import BaseModel, Field


class TypeOut(BaseModel):
    id: int
    name: str


class TypeCreate(BaseModel):
    name: str = Field(min_length=1, max_length=80)


class ProductOut(BaseModel):
    id: int
    type_id: int
    type_name: str
    order_id: int | None = None
    name: str
    address: str
    image_key: str | None = None
    client_name: str | None = None
    price: int
    quantity: int
    delivery_at: datetime
    created_by_name: str
    created_by_id: int | None = None
    created_at: datetime


class ArchivedOut(ProductOut):
    status: str
    sold_at: datetime | None = None
    sold_by_name: str | None = None
    paid_amount: int | None = None
    archive_kind: str | None
    archive_reason: str | None
    archived_by_name: str | None
    archived_at: datetime | None
    refund_amount: int


class CancelIn(BaseModel):
    action: str
    reason: str = Field(min_length=1, max_length=300)
    refund_amount: int = Field(default=0, ge=0)


class ReturnIn(BaseModel):
    reason: str = Field(min_length=1, max_length=300)
    condition: str


class SummaryOut(BaseModel):
    month_returns: int
    month_refund: int
    month_cancellations: int
    month_archived: int


class ItemIn(BaseModel):
    type_id: int
    name: str = Field(min_length=1, max_length=160)
    image: str | None = None
    price: int = Field(gt=0)
    quantity: int = Field(default=1, ge=1, le=100_000)


class OrderCreate(BaseModel):
    client_name: str | None = Field(default=None, max_length=120)
    address: str = Field(min_length=1, max_length=300)
    delivery_at: datetime
    items: list[ItemIn] = Field(min_length=1, max_length=30)


class ProductUpdate(BaseModel):
    type_id: int
    name: str = Field(min_length=1, max_length=160)
    image: str | None = None
    remove_image: bool = False
    price: int = Field(gt=0)
    quantity: int = Field(ge=1, le=100_000)
    client_name: str | None = Field(default=None, max_length=120)
    address: str = Field(min_length=1, max_length=300)
    delivery_at: datetime


class SellIn(BaseModel):
    payment_kind: str
    paid_amount: int | None = None
    quantity: int | None = Field(default=None, ge=1)


class SaleOut(BaseModel):
    id: int
    product_name: str
    type_name: str
    address: str
    price: int
    quantity: int
    delivery_at: datetime
    payment_kind: str
    paid_amount: int
    debt_amount: int
    sold_by_name: str
    sold_by_id: int | None = None
    sold_at: datetime
    status: str
    returned_at: datetime | None = None
    returned_by_name: str | None = None
    return_reason: str | None = None
    return_condition: str | None = None
    refund_amount: int = 0
