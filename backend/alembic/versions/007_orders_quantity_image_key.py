"""orders, quantity, image key"""

from alembic import op
import sqlalchemy as sa

revision = "007_orders_quantity_image_key"
down_revision = "006_cancel_return_archive"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "orders",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("client_name", sa.String(120), nullable=False),
        sa.Column("created_by_id", sa.Integer(), nullable=True),
        sa.Column("created_by_name", sa.String(120), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.add_column("products", sa.Column("quantity", sa.Integer(), nullable=False, server_default="1"))
    op.add_column(
        "products",
        sa.Column("order_id", sa.Integer(), sa.ForeignKey("orders.id", ondelete="SET NULL"), nullable=True),
    )
    op.create_index("ix_products_order_id", "products", ["order_id"])
    op.add_column("products", sa.Column("image_key", sa.String(32), nullable=True))
    op.execute("UPDATE products SET image_key = substr(md5(image), 1, 12) WHERE image IS NOT NULL")
    op.alter_column("products", "color", server_default="")
    op.add_column("sales", sa.Column("quantity", sa.Integer(), nullable=False, server_default="1"))
    op.alter_column("sales", "color", server_default="")


def downgrade() -> None:
    op.alter_column("sales", "color", server_default=None)
    op.drop_column("sales", "quantity")
    op.alter_column("products", "color", server_default=None)
    op.drop_column("products", "image_key")
    op.drop_index("ix_products_order_id", table_name="products")
    op.drop_column("products", "order_id")
    op.drop_column("products", "quantity")
    op.drop_table("orders")
