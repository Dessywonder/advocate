import pytest
from fastapi.testclient import TestClient
from datetime import date

from ..main import app, require_roles, User, UserRole

# --- Mock User Data ---
mock_assessor_user = User(user_id=2, email="assessor@test.com", full_name="Test Assessor", is_active=True, role=UserRole.ASSESSOR)

# --- Mock Dependency ---
def get_mock_assessor():
    return mock_assessor_user


def test_create_client_as_assessor(test_client: TestClient):
    """
    Integration test for the client creation endpoint.
    It verifies that an assessor can successfully create a new client.
    """
    # Override the security dependency to simulate a logged-in assessor
    app.dependency_overrides[require_roles([UserRole.ASSESSOR])] = get_mock_assessor

    client_data = {
        "initials": "TT",
        "dob": "1970-01-01",
        "gender": "Other",
        "address": "123 Test Street",
        "la_area": "Testville"
    }

    response = test_client.post("/api/v1/clients", json=client_data)

    # Assertions
    assert response.status_code == 200
    response_data = response.json()
    assert "client_id" in response_data
    assert isinstance(response_data["client_id"], int)

    # Clean up the override
    app.dependency_overrides = {}