"""user profile and activity"""

from alembic import op
import sqlalchemy as sa

revision = "005_user_profile_activity"
down_revision = "004_product_client_name"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("avatar", sa.Text(), nullable=True))
    op.add_column("users", sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("users", sa.Column("active_month", sa.String(7), nullable=True))
    op.add_column("users", sa.Column("active_seconds", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("sales", sa.Column("sold_by_id", sa.Integer(), nullable=True))
    op.create_index("ix_sales_sold_by_id", "sales", ["sold_by_id"])
    op.execute("UPDATE sales SET sold_by_id = users.id FROM users WHERE users.name = sales.sold_by_name")


def downgrade() -> None:
    op.drop_index("ix_sales_sold_by_id", "sales")
    op.drop_column("sales", "sold_by_id")
    op.drop_column("users", "active_seconds")
    op.drop_column("users", "active_month")
    op.drop_column("users", "last_seen_at")
    op.drop_column("users", "avatar")
