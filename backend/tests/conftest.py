import os
import uuid

import pytest
import sqlalchemy
from fastapi.testclient import TestClient
from geoalchemy2.elements import WKTElement
from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import Session, sessionmaker

os.environ.setdefault(
    "APP_DATABASE_URL", "postgresql+psycopg://inflow:inflow@127.0.0.1:5555/inflow"
)


def _test_database_url() -> str:
    """Derive a dedicated `<db>_test` database from APP_DATABASE_URL, creating
    it if needed, so the test suite never runs against (or pollutes) the
    seeded development database."""
    base_url = sqlalchemy.engine.make_url(os.environ["APP_DATABASE_URL"])
    test_url = base_url.set(database=f"{base_url.database}_test")

    admin_engine = create_engine(base_url, isolation_level="AUTOCOMMIT", future=True)
    with admin_engine.connect() as conn:
        exists = conn.execute(
            text("SELECT 1 FROM pg_database WHERE datname = :name"), {"name": test_url.database}
        ).scalar_one_or_none()
        if not exists:
            conn.execute(text(f'CREATE DATABASE "{test_url.database}"'))
    admin_engine.dispose()

    test_engine = create_engine(test_url, isolation_level="AUTOCOMMIT", future=True)
    with test_engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis"))
    test_engine.dispose()

    return test_url.render_as_string(hide_password=False)


from app.db.base import Base  # noqa: E402
from app.db.session import get_db  # noqa: E402
from app.domain.locations.models import Place  # noqa: E402
from app.domain.tenancy.models import Tenant  # noqa: E402
from app.main import app  # noqa: E402

TEST_DATABASE_URL = _test_database_url()

engine = create_engine(TEST_DATABASE_URL, future=True)
TestSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


@pytest.fixture(scope="session", autouse=True)
def _create_schema():
    Base.metadata.create_all(engine)
    yield


@pytest.fixture()
def db() -> Session:
    """A session bound to a SAVEPOINT-nested transaction that is always rolled
    back, so each test (and any `db.commit()` calls inside application code
    under test) leaves no trace, even though the router endpoints commit."""
    connection = engine.connect()
    outer_transaction = connection.begin()
    session = TestSessionLocal(bind=connection)
    session.begin_nested()

    @event.listens_for(session, "after_transaction_end")
    def _restart_savepoint(session, transaction):
        if transaction.nested and not transaction._parent.nested:
            session.begin_nested()

    try:
        yield session
    finally:
        session.close()
        outer_transaction.rollback()
        connection.close()


@pytest.fixture()
def client(db: Session) -> TestClient:
    def _override_get_db():
        yield db

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def make_place(
    db: Session,
    name: str,
    lon: float,
    lat: float,
    *,
    place_type: str = "municipality",
    region: str = "Werdenfelser Land",
    aliases: list[str] | None = None,
) -> Place:
    place = Place(
        id=uuid.uuid4(),
        name=name,
        place_type=place_type,
        municipality=name,
        district=region,
        region=region,
        country="DE",
        geometry=WKTElement(f"POINT({lon} {lat})", srid=4326),
        aliases=aliases or [],
    )
    db.add(place)
    db.flush()
    return place


def make_tenant(db: Session, slug: str, name: str | None = None) -> Tenant:
    tenant = Tenant(id=uuid.uuid4(), name=name or slug, slug=slug)
    db.add(tenant)
    db.flush()
    return tenant


@pytest.fixture()
def bavarian_places(db: Session) -> dict[str, Place]:
    return {
        "Zugspitze": make_place(db, "Zugspitze", 10.9852, 47.4210, place_type="mountain", aliases=["zugspitz"]),
        "Eibsee": make_place(db, "Eibsee", 10.9986, 47.4636, place_type="lake", aliases=["eib see"]),
        "Garmisch-Partenkirchen": make_place(db, "Garmisch-Partenkirchen", 11.0956, 47.4917),
        "Tegernsee": make_place(
            db, "Tegernsee", 11.7500, 47.7167, place_type="lake", region="Oberland", aliases=["tegern see"]
        ),
    }
