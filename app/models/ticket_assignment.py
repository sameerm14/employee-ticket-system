from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Text
)
from sqlalchemy.sql import func

from app.core.database import Base


class TicketAssignment(Base):
    __tablename__ = "ticket_assignments"

    id = Column(Integer, primary_key=True, index=True)

    ticket_id = Column(
        Integer,
        ForeignKey("tickets.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    team_id = Column(
        Integer,
        ForeignKey("teams.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    assigned_by = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )

    assigned_at = Column(
        DateTime,
        server_default=func.now(),
        nullable=False
    )

    unassigned_at = Column(
        DateTime,
        nullable=True
    )

    reason = Column(
        Text,
        nullable=True
    )