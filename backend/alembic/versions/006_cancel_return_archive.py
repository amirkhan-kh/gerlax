"""cancel, return and archive"""

from alembic import op
import sqlalchemy as sa

revision = "006_cancel_return_archive"
down_revision = "005_user_profile_activity"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("products", sa.Column("created_by_id", sa.Integer(), nullable=True))
    op.create_index("ix_products_created_by_id", "products", ["created_by_id"])
    op.add_column("products", sa.Column("status", sa.String(16), nullable=False, server_default="active"))
    op.create_index("ix_products_status", "products", ["status"])
    op.add_column("products", sa.Column("archive_kind", sa.String(16), nullable=True))
    op.add_column("products", sa.Column("archive_reason", sa.String(300), nullable=True))
    op.add_column("products", sa.Column("archived_by_name", sa.String(120), nullable=True))
    op.add_column("products", sa.Column("archived_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("products", sa.Column("refund_amount", sa.Integer(), nullable=False, server_default="0"))
    op.execute("UPDATE products SET created_by_id = users.id FROM users WHERE users.name = products.created_by_name")

    op.add_column(
        "sales",
        sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.id", ondelete="SET NULL"), nullable=True),
    )
    op.add_column("sales", sa.Column("status", sa.String(16), nullable=False, server_default="sold"))
    op.add_column("sales", sa.Column("returned_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("sales", sa.Column("returned_by_id", sa.Integer(), nullable=True))
    op.add_column("sales", sa.Column("returned_by_name", sa.String(120), nullable=True))
    op.add_column("sales", sa.Column("return_reason", sa.String(300), nullable=True))
    op.add_column("sales", sa.Column("return_condition", sa.String(16), nullable=True))
    op.add_column("sales", sa.Column("refund_amount", sa.Integer(), nullable=False, server_default="0"))

    op.create_table(
        "cancellations",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.id", ondelete="SET NULL"), nullable=True),
        sa.Column("product_name", sa.String(160), nullable=False),
        sa.Column("client_name", sa.String(120), nullable=True),
        sa.Column("price", sa.Integer(), nullable=False),
        sa.Column("action", sa.String(16), nullable=False),
        sa.Column("reason", sa.String(300), nullable=False),
        sa.Column("refund_amount", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("cancelled_by_id", sa.Integer(), nullable=False),
        sa.Column("cancelled_by_name", sa.String(120), nullable=False),
        sa.Column("cancelled_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_cancellations_cancelled_by_id", "cancellations", ["cancelled_by_id"])


def downgrade() -> None:
    op.drop_index("ix_cancellations_cancelled_by_id", "cancellations")
    op.drop_table("cancellations")
    for column in (
        "refund_amount",
        "return_condition",
        "return_reason",
        "returned_by_name",
        "returned_by_id",
        "returned_at",
        "status",
        "product_id",
    ):
        op.drop_column("sales", column)
    op.drop_index("ix_products_status", "products")
    op.drop_index("ix_products_created_by_id", "products")
    for column in (
        "refund_amount",
        "archived_at",
        "archived_by_name",
        "archive_reason",
        "archive_kind",
        "status",
        "created_by_id",
    ):
        op.drop_column("products", column)
