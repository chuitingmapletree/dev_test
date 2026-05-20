from pathlib import Path

from sqlalchemy import Column, Integer, String, create_engine, text
from sqlalchemy.orm import declarative_base

DB_PATH = Path(__file__).parent.parent / "prelegal.db"
engine = create_engine(
    f"sqlite:///{DB_PATH}",
    connect_args={"check_same_thread": False},
)
Base = declarative_base()


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(
        String,
        nullable=False,
        server_default=text("(strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))"),
    )


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
