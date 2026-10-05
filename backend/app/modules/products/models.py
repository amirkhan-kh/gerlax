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
    client_name: Mapped[str | None] = mapped_column(String(120))
    color: Mapped[str] = mapped_column(String(80))
    price: Mapped[int] = mapped_column(Integer)
    delivery_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    created_by_name: Mapped[str] = mapped_column(String(120))
    created_by_id: Mapped[int | None] = mapped_column(Integer, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    status: Mapped[str] = mapped_column(String(16), server_default="active", index=True)
    archive_kind: Mapped[str | None] = mapped_column(String(16))
    archive_reason: Mapped[str | None] = mapped_column(String(300))
    archived_by_name: Mapped[str | None] = mapped_column(String(120))
    archived_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    refund_amount: Mapped[int] = mapped_column(Integer, server_default="0")
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
    sold_by_id: Mapped[int | None] = mapped_column(Integer, index=True)
    sold_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    product_id: Mapped[int | None] = mapped_column(ForeignKey("products.id", ondelete="SET NULL"))
    status: Mapped[str] = mapped_column(String(16), server_default="sold")
    returned_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    returned_by_id: Mapped[int | None] = mapped_column(Integer)
    returned_by_name: Mapped[str | None] = mapped_column(String(120))
    return_reason: Mapped[str | None] = mapped_column(String(300))
    return_condition: Mapped[str | None] = mapped_column(String(16))
    refund_amount: Mapped[int] = mapped_column(Integer, server_default="0")


class Cancellation(Base):
    __tablename__ = "cancellations"

    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int | None] = mapped_column(ForeignKey("products.id", ondelete="SET NULL"))
    product_name: Mapped[str] = mapped_column(String(160))
    client_name: Mapped[str | None] = mapped_column(String(120))
    price: Mapped[int] = mapped_column(Integer)
    action: Mapped[str] = mapped_column(String(16))
    reason: Mapped[str] = mapped_column(String(300))
    refund_amount: Mapped[int] = mapped_column(Integer, server_default="0")
    cancelled_by_id: Mapped[int] = mapped_column(Integer, index=True)
    cancelled_by_name: Mapped[str] = mapped_column(String(120))
    cancelled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
