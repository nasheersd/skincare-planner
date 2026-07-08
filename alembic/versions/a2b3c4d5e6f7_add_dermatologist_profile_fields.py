"""add address website accepting_new_patients to dermatologist_profiles

Revision ID: a2b3c4d5e6f7
Revises: 751dd71eca37
Create Date: 2026-07-08 18:55:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a2b3c4d5e6f7"
down_revision: Union[str, None] = "751dd71eca37"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("dermatologist_profiles", sa.Column("address", sa.String(length=500), nullable=True))
    op.add_column("dermatologist_profiles", sa.Column("website", sa.String(length=500), nullable=True))
    op.add_column(
        "dermatologist_profiles",
        sa.Column("accepting_new_patients", sa.Boolean(), server_default=sa.text("true"), nullable=False),
    )


def downgrade() -> None:
    op.drop_column("dermatologist_profiles", "accepting_new_patients")
    op.drop_column("dermatologist_profiles", "website")
    op.drop_column("dermatologist_profiles", "address")
