import pytest
from fastapi import FastAPI, Depends, HTTPException
from fastapi.testclient import TestClient

from ..main import require_roles, User, UserRole, app

# --- Mock User Data ---
mock_manager_user = User(user_id=1, email="manager@test.com", full_name="Test Manager", is_active=True, role=UserRole.MANAGER)
mock_assessor_user = User(user_id=2, email="assessor@test.com", full_name="Test Assessor", is_active=True, role=UserRole.ASSESSOR)

# --- Mock Dependencies ---
def get_mock_manager():
    return mock_manager_user

def get_mock_assessor():
    return mock_assessor_user

# --- Test Endpoint ---
# We create a temporary endpoint on the app just for this test
@app.get("/test-secure-route")
async def secure_route(current_user: User = Depends(require_roles([UserRole.MANAGER, UserRole.ADMIN]))):
    return {"message": "Welcome, privileged user!"}


def test_require_role_success(test_client: TestClient):
    """
    Tests that a user with the required role can access the endpoint.
    """
    # Override the dependency for this specific test
    app.dependency_overrides[require_roles([UserRole.MANAGER, UserRole.ADMIN])] = get_mock_manager

    response = test_client.get("/test-secure-route")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome, privileged user!"}

    # Clean up the override after the test
    app.dependency_overrides = {}


def test_require_role_failure(test_client: TestClient):
    """
    Tests that a user without the required role is denied access.
    """
    # Override the dependency to simulate a user with the wrong role
    app.dependency_overrides[require_roles([UserRole.MANAGER, UserRole.ADMIN])] = get_mock_assessor

    response = test_client.get("/test-secure-route")
    assert response.status_code == 403
    assert "Operation not permitted" in response.json()["detail"]

    # Clean up the override
    app.dependency_overrides = {}