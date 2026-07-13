"""add professional messages table

Revision ID: d4e5f6a7b8c9
Revises: c1d2e3f4a5b6
Create Date: 2026-07-13 18:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d4e5f6a7b8c9"
down_revision: Union[str, None] = "c1d2e3f4a5b6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "professional_messages",
        sa.Column("id", sa.UUID(as_uuid=False), nullable=False),
        sa.Column("consultant_id", sa.UUID(as_uuid=False), nullable=False),
        sa.Column("dermatologist_id", sa.UUID(as_uuid=False), nullable=False),
        sa.Column("sender_user_id", sa.UUID(as_uuid=False), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["consultant_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["dermatologist_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["sender_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_professional_messages_consultant_id", "professional_messages", ["consultant_id"])
    op.create_index("ix_professional_messages_dermatologist_id", "professional_messages", ["dermatologist_id"])
    op.create_index("ix_professional_messages_created_at", "professional_messages", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_professional_messages_created_at", table_name="professional_messages")
    op.drop_index("ix_professional_messages_dermatologist_id", table_name="professional_messages")
    op.drop_index("ix_professional_messages_consultant_id", table_name="professional_messages")
    op.drop_table("professional_messages")
