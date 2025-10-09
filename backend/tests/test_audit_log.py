import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock

from ..main import app, require_roles, User, UserRole

# --- Mock User Data ---
mock_assessor_user = User(user_id=99, email="audit.assessor@test.com", full_name="Audit Assessor", is_active=True, role=UserRole.ASSESSOR)

# --- Mock Dependency ---
def get_mock_assessor():
    return mock_assessor_user


def test_create_client_triggers_audit_log(test_client: TestClient, mocker):
    """
    Tests that creating a client correctly triggers an audit log event.
    """
    # Override the security dependency
    app.dependency_overrides[require_roles([UserRole.ASSESSOR])] = get_mock_assessor

    # Mock the log_audit_event function so we can check if it's called
    # We use an AsyncMock because the function we are mocking is async
    mock_log_audit = mocker.patch('..main.log_audit_event', new_callable=AsyncMock)

    client_data = {
        "initials": "AL",
        "dob": "1980-05-10",
        "gender": "Female",
        "address": "456 Audit Lane",
        "la_area": "Logsville"
    }

    # Make the API call
    response = test_client.post("/api/v1/clients", json=client_data)

    # Assertions
    assert response.status_code == 200

    # Check that our mock was called exactly once
    mock_log_audit.assert_called_once()

    # Check that it was called with the correct arguments
    call_args = mock_log_audit.call_args[0]
    # call_args[0] is the pool, so we check from index 1 onwards
    assert call_args[1] == mock_assessor_user.user_id  # user_id
    assert call_args[2] == "create_client"             # action
    assert call_args[3] == "client"                    # object_type
    # We don't know the exact object_id, but we can check it's an int
    assert isinstance(call_args[4], int)               # object_id
    assert call_args[5] == client_data                 # details

    # Clean up overrides
    app.dependency_overrides = {}