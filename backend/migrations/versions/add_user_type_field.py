"""Add user_type field to users table

Revision ID: add_user_type_001
Revises:
Create Date: 2025-10-13

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_user_type_001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Add user_type column with default value 'user'
    with op.batch_alter_table('users') as batch_op:
        batch_op.add_column(
            sa.Column('user_type', sa.String(length=20), nullable=False, server_default='user')
        )


def downgrade():
    # Remove user_type column
    with op.batch_alter_table('users') as batch_op:
        batch_op.drop_column('user_type')
