import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from backend.database import Base, get_db
from backend.main import app

# Use in-memory SQLite for tests
SQLALCHEMY_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

engine = create_async_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False}
)

TestingSessionLocal = sessionmaker(
    autocommit=False, autoflush=False, bind=engine, class_=AsyncSession, expire_on_commit=False
)

@pytest_asyncio.fixture
async def test_db():
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        await db.close()

@pytest_asyncio.fixture
async def client(test_db):
    # Override dependency
    async def override_get_db():
        try:
            yield test_db
        finally:
            pass
            
    app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(base_url="http://test") as ac:
        yield ac
    
    app.dependency_overrides.clear()
