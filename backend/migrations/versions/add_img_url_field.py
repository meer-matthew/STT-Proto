"""Add img_url field to users table

Revision ID: add_img_url_001
Revises:
Create Date: 2025-11-09

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_img_url_001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Add img_url column - nullable since it will be auto-generated if not provided
    with op.batch_alter_table('users') as batch_op:
        batch_op.add_column(
            sa.Column('img_url', sa.String(length=500), nullable=True)
        )


def downgrade():
    # Remove img_url column
    with op.batch_alter_table('users') as batch_op:
        batch_op.drop_column('img_url')
