import pytest
from fastapi.testclient import TestClient
from ..main import app

@pytest.fixture(scope="module")
def test_client():
    """
    Creates a TestClient for the FastAPI application.
    This client can be used to make requests to the API in tests.
    """
    client = TestClient(app)
    yield client