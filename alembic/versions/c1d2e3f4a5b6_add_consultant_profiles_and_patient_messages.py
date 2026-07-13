"""add consultant profiles and patient messages

Revision ID: c1d2e3f4a5b6
Revises: b7c8d9e0f1a2
Create Date: 2026-07-09 11:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c1d2e3f4a5b6"
down_revision: Union[str, None] = "b7c8d9e0f1a2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "consultant_profiles",
        sa.Column("id", sa.UUID(as_uuid=False), nullable=False),
        sa.Column("user_id", sa.UUID(as_uuid=False), nullable=False),
        sa.Column("phone", sa.String(length=30), nullable=True),
        sa.Column("organization_name", sa.String(length=200), nullable=True),
        sa.Column("specialization", sa.String(length=150), nullable=True),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("website", sa.String(length=500), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
    )
    op.create_table(
        "patient_messages",
        sa.Column("id", sa.UUID(as_uuid=False), nullable=False),
        sa.Column("dermatologist_user_id", sa.UUID(as_uuid=False), nullable=False),
        sa.Column("patient_user_id", sa.UUID(as_uuid=False), nullable=False),
        sa.Column("sender_user_id", sa.UUID(as_uuid=False), nullable=False),
        sa.Column("recipient_user_id", sa.UUID(as_uuid=False), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["dermatologist_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["patient_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["recipient_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["sender_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_patient_messages_dermatologist_user_id", "patient_messages", ["dermatologist_user_id"])
    op.create_index("ix_patient_messages_patient_user_id", "patient_messages", ["patient_user_id"])
    op.create_index("ix_patient_messages_created_at", "patient_messages", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_patient_messages_created_at", table_name="patient_messages")
    op.drop_index("ix_patient_messages_patient_user_id", table_name="patient_messages")
    op.drop_index("ix_patient_messages_dermatologist_user_id", table_name="patient_messages")
    op.drop_table("patient_messages")
    op.drop_table("consultant_profiles")
