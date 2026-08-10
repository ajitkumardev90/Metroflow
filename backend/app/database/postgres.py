import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    DATABASE_URL = (
        f"postgresql://{os.getenv('PG_USER')}:"
        f"{os.getenv('PG_PASSWORD')}@"
        f"{os.getenv('PG_HOST')}:"
        f"{os.getenv('PG_PORT')}/"
        f"{os.getenv('PG_DATABASE')}"
    )

engine = create_engine(DATABASE_URL, echo=True)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()