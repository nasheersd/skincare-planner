"""add appointments table

Revision ID: b7c8d9e0f1a2
Revises: a2b3c4d5e6f7
Create Date: 2026-07-09 10:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b7c8d9e0f1a2"
down_revision: Union[str, None] = "a2b3c4d5e6f7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


appointment_status_enum = sa.Enum("pending", "accepted", "declined", name="appointmentstatusenum")


def upgrade() -> None:
    appointment_status_enum.create(op.get_bind(), checkfirst=True)
    op.create_table(
        "appointments",
        sa.Column("id", sa.UUID(as_uuid=False), nullable=False),
        sa.Column("patient_user_id", sa.UUID(as_uuid=False), nullable=False),
        sa.Column("dermatologist_user_id", sa.UUID(as_uuid=False), nullable=False),
        sa.Column("status", appointment_status_enum, nullable=False, server_default="pending"),
        sa.Column("request_message", sa.Text(), nullable=True),
        sa.Column("response_message", sa.Text(), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["dermatologist_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["patient_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_appointments_patient_user_id", "appointments", ["patient_user_id"])
    op.create_index("ix_appointments_dermatologist_user_id", "appointments", ["dermatologist_user_id"])
    op.create_index("ix_appointments_status", "appointments", ["status"])


def downgrade() -> None:
    op.drop_index("ix_appointments_status", table_name="appointments")
    op.drop_index("ix_appointments_dermatologist_user_id", table_name="appointments")
    op.drop_index("ix_appointments_patient_user_id", table_name="appointments")
    op.drop_table("appointments")
    appointment_status_enum.drop(op.get_bind(), checkfirst=True)
