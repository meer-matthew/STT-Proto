"""Add password and last_login fields to users table

Revision ID: add_password_fields
Revises:
Create Date: 2025-01-15

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_password_fields'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Add password_hash column
    op.add_column('users', sa.Column('password_hash', sa.String(length=255), nullable=True))

    # Add last_login column
    op.add_column('users', sa.Column('last_login', sa.DateTime(), nullable=True))


def downgrade():
    # Remove columns
    op.drop_column('users', 'last_login')
    op.drop_column('users', 'password_hash')
