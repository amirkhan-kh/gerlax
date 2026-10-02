"""product image"""

from alembic import op
import sqlalchemy as sa

revision = "002_product_image"
down_revision = "001_init"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("products", sa.Column("image", sa.String(200), nullable=True))


def downgrade() -> None:
    op.drop_column("products", "image")
