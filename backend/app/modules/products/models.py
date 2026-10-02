from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.base import Base


class ProductType(Base):
    __tablename__ = "product_types"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(80), unique=True)


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True)
    type_id: Mapped[int] = mapped_column(ForeignKey("product_types.id"))
    name: Mapped[str] = mapped_column(String(160))
    address: Mapped[str] = mapped_column(String(300))
    image: Mapped[str | None] = mapped_column(Text)
    color: Mapped[str] = mapped_column(String(80))
    price: Mapped[int] = mapped_column(Integer)
    delivery_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    created_by_name: Mapped[str] = mapped_column(String(120))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    type: Mapped[ProductType] = relationship()


class Sale(Base):
    __tablename__ = "sales"

    id: Mapped[int] = mapped_column(primary_key=True)
    product_name: Mapped[str] = mapped_column(String(160))
    type_name: Mapped[str] = mapped_column(String(80))
    address: Mapped[str] = mapped_column(String(300))
    color: Mapped[str] = mapped_column(String(80))
    price: Mapped[int] = mapped_column(Integer)
    delivery_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    payment_kind: Mapped[str] = mapped_column(String(16))
    paid_amount: Mapped[int] = mapped_column(Integer)
    debt_amount: Mapped[int] = mapped_column(Integer)
    sold_by_name: Mapped[str] = mapped_column(String(120))
    sold_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
