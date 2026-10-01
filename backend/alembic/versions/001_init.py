"""init"""

from alembic import op
import sqlalchemy as sa

revision = "001_init"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("phone", sa.String(32), nullable=False),
        sa.Column("login", sa.String(64), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("role", sa.String(32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_users_login", "users", ["login"], unique=True)
    op.create_table(
        "product_types",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(80), nullable=False),
    )
    op.create_index("ix_product_types_name", "product_types", ["name"], unique=True)
    op.create_table(
        "products",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("type_id", sa.Integer(), sa.ForeignKey("product_types.id"), nullable=False),
        sa.Column("name", sa.String(160), nullable=False),
        sa.Column("address", sa.String(300), nullable=False),
        sa.Column("color", sa.String(80), nullable=False),
        sa.Column("price", sa.Integer(), nullable=False),
        sa.Column("delivery_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_by_name", sa.String(120), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_table(
        "sales",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("product_name", sa.String(160), nullable=False),
        sa.Column("type_name", sa.String(80), nullable=False),
        sa.Column("address", sa.String(300), nullable=False),
        sa.Column("color", sa.String(80), nullable=False),
        sa.Column("price", sa.Integer(), nullable=False),
        sa.Column("delivery_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("payment_kind", sa.String(16), nullable=False),
        sa.Column("paid_amount", sa.Integer(), nullable=False),
        sa.Column("debt_amount", sa.Integer(), nullable=False),
        sa.Column("sold_by_name", sa.String(120), nullable=False),
        sa.Column("sold_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("sales")
    op.drop_table("products")
    op.drop_index("ix_product_types_name", table_name="product_types")
    op.drop_table("product_types")
    op.drop_index("ix_users_login", table_name="users")
    op.drop_table("users")
