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
    name: str
    address: str
    image: str | None = None
    client_name: str | None = None
    color: str
    price: int
    delivery_at: datetime
    created_by_name: str
    created_at: datetime


class ProductCreate(BaseModel):
    type_id: int
    name: str = Field(min_length=1, max_length=160)
    address: str = Field(min_length=1, max_length=300)
    image: str | None = None
    client_name: str | None = Field(default=None, max_length=120)
    color: str = Field(min_length=1, max_length=80)
    price: int = Field(gt=0)
    delivery_at: datetime


class SellIn(BaseModel):
    payment_kind: str
    paid_amount: int | None = None


class SaleOut(BaseModel):
    id: int
    product_name: str
    type_name: str
    address: str
    color: str
    price: int
    delivery_at: datetime
    payment_kind: str
    paid_amount: int
    debt_amount: int
    sold_by_name: str
    sold_at: datetime
