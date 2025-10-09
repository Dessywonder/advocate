import pytest
from fastapi.testclient import TestClient
from datetime import date

from ..main import app, require_roles, User, UserRole

# --- Mock User Data ---
mock_assessor_user = User(user_id=2, email="assessor@test.com", full_name="Test Assessor", is_active=True, role=UserRole.ASSESSOR)
mock_manager_user = User(user_id=1, email="manager@test.com", full_name="Test Manager", is_active=True, role=UserRole.MANAGER)


# --- Mock Dependencies ---
def get_mock_assessor():
    return mock_assessor_user

def get_mock_manager():
    return mock_manager_user


def test_create_care_plan(test_client: TestClient):
    """
    Integration test for the care plan creation endpoint.
    Verifies that an assessor can successfully create a new care plan with actions.
    """
    # Override the security dependency
    app.dependency_overrides[require_roles([UserRole.ASSESSOR])] = get_mock_assessor

    care_plan_data = {
        "start_date": "2024-01-01",
        "status": "Active",
        "actions": [
            {"goal_description": "First goal"},
            {"goal_description": "Second goal"},
        ]
    }

    # Assuming client with ID 101 exists for this test
    response = test_client.post("/api/v1/clients/101/careplans", json=care_plan_data)

    # Assertions
    assert response.status_code == 201
    response_data = response.json()
    assert response_data["client_id"] == 101
    assert response_data["status"] == "Active"
    assert len(response_data["actions"]) == 2
    assert response_data["actions"][0]["goal_description"] == "First goal"

    # Clean up the override
    app.dependency_overrides = {}


def test_assign_provider_to_care_plan(test_client: TestClient):
    """
    Integration test for assigning a provider to a care plan.
    Verifies that a manager can successfully assign a provider.
    """
    # Override the security dependency to simulate a logged-in manager
    app.dependency_overrides[require_roles([UserRole.MANAGER, UserRole.ADMIN])] = get_mock_manager

    # Assuming care plan with ID 1 and provider with ID 1 exist for this test
    care_plan_id_to_update = 1
    provider_id_to_assign = 1

    response = test_client.put(
        f"/api/v1/careplans/{care_plan_id_to_update}/assign-provider",
        json={"provider_id": provider_id_to_assign}
    )

    # Assertions
    assert response.status_code == 200
    response_data = response.json()
    assert response_data["care_plan_id"] == care_plan_id_to_update
    assert response_data["assigned_provider_id"] == provider_id_to_assign

    # Clean up the override
    app.dependency_overrides = {}