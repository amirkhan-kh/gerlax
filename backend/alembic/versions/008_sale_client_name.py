"""sale client name"""

from alembic import op
import sqlalchemy as sa

revision = "008_sale_client_name"
down_revision = "007_orders_quantity_image_key"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("sales", sa.Column("client_name", sa.String(120), nullable=True))
    op.execute(
        "UPDATE sales SET client_name = products.client_name FROM products WHERE products.id = sales.product_id"
    )


def downgrade() -> None:
    op.drop_column("sales", "client_name")
