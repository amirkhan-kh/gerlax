"""product image as data url"""

from alembic import op
import sqlalchemy as sa

revision = "003_product_image_text"
down_revision = "002_product_image"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column("products", "image", type_=sa.Text(), existing_type=sa.String(200), existing_nullable=True)


def downgrade() -> None:
    op.alter_column("products", "image", type_=sa.String(200), existing_type=sa.Text(), existing_nullable=True)
