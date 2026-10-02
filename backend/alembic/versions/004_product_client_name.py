"""product client name"""

from alembic import op
import sqlalchemy as sa

revision = "004_product_client_name"
down_revision = "003_product_image_text"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("products", sa.Column("client_name", sa.String(120), nullable=True))


def downgrade() -> None:
    op.drop_column("products", "client_name")
