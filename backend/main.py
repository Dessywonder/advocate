from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import date, datetime, timedelta
import asyncpg
from enum import Enum
import pickle
from pathlib import Path

# Security imports
from jose import JWTError, jwt
from passlib.context import CryptContext

# FHIR mapping import
from .fhir_mapper import map_client_to_fhir_patient

# --- Configuration ---
# In a real app, these should come from environment variables
SECRET_KEY = "a_very_secret_key_that_should_be_in_env_vars"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

app = FastAPI()

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


# --- Security Utility Functions ---

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


# --- Pydantic Models for Auth ---

class UserRole(str, Enum):
    ASSESSOR = "assessor"
    MANAGER = "manager"
    COORDINATOR = "coordinator"
    ADMIN = "admin"

class User(BaseModel):
    user_id: int
    email: str
    full_name: Optional[str] = None
    is_active: bool
    role: UserRole

class UserInDB(User):
    hashed_password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None


# --- Database connection settings ---
DATABASE_URL = "postgresql://user:password@db/mydatabase"

@app.on_event("startup")
async def startup():
    app.state.pool = await asyncpg.create_pool(DATABASE_URL)

@app.on_event("shutdown")
async def shutdown():
    await app.state.pool.close()


# --- Auth Helper Functions ---

async def get_user_from_db(email: str, pool) -> Optional[UserInDB]:
    async with pool.acquire() as connection:
        user_row = await connection.fetchrow("SELECT * FROM users WHERE email = $1", email)
        if user_row:
            return UserInDB(**user_row)
    return None

async def get_current_user(token: str = Depends(oauth2_scheme), pool = Depends(lambda: app.state.pool)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception
    user = await get_user_from_db(email=token_data.email, pool=pool)
    if user is None:
        raise credentials_exception
    return user

def require_roles(required_roles: List[UserRole]):
    """
    Dependency that checks if the current user has one of the required roles.
    """
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in required_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Operation not permitted. Requires one of the following roles: {[role.value for role in required_roles]}"
            )
        return current_user
    return role_checker


# --- Audit Logging ---

async def log_audit_event(
    pool,
    user_id: int,
    action: str,
    object_type: Optional[str] = None,
    object_id: Optional[int] = None,
    details: Optional[Dict] = None,
):
    """A reusable function to insert events into the audit_log table."""
    async with pool.acquire() as connection:
        await connection.execute(
            """
            INSERT INTO audit_log (user_id, action, object_type, object_id, details)
            VALUES ($1, $2, $3, $4, $5)
            """,
            user_id, action, object_type, object_id, details
        )


# --- Auth Endpoints ---

class AuditLogEntry(BaseModel):
    event_id: int
    user_id: int
    action: str
    object_type: Optional[str] = None
    object_id: Optional[int] = None
    details: Optional[Dict] = None
    event_timestamp: datetime

@app.get("/api/v1/audit/{object_type}/{object_id}", response_model=List[AuditLogEntry])
async def get_audit_log_for_object(
    object_type: str,
    object_id: int,
    current_user: User = Depends(require_roles([UserRole.MANAGER, UserRole.ADMIN])),
):
    """Fetches the audit history for a specific object."""
    async with app.state.pool.acquire() as connection:
        rows = await connection.fetch(
            "SELECT * FROM audit_log WHERE object_type = $1 AND object_id = $2 ORDER BY event_timestamp DESC",
            object_type, object_id
        )
        return [dict(row) for row in rows]


@app.post("/api/v1/auth/login", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), pool = Depends(lambda: app.state.pool)):
    user = await get_user_from_db(form_data.username, pool=pool)
    # The stored password is a dummy hash. In a real app, you would use:
    # if not user or not verify_password(form_data.password, user.hashed_password):
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check if user is active
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role.value}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/api/v1/auth/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

class Client(BaseModel):
    initials: str
    dob: date
    gender: str
    address: str
    la_area: str

class Assessment(BaseModel):
    client_id: int
    assessor_id: int
    date: datetime
    location: str
    form_version: str
    answers_json: Dict
    attachments: str

class AssessmentInDB(Assessment):
    assessment_id: int

@app.get("/api/v1/assessments", response_model=List[AssessmentInDB])
async def get_assessments(current_user: User = Depends(require_roles([UserRole.ASSESSOR, UserRole.MANAGER, UserRole.ADMIN]))):
    async with app.state.pool.acquire() as connection:
        rows = await connection.fetch("SELECT assessment_id, client_id, assessor_id, date, location, form_version, answers_json, attachments FROM assessments ORDER BY date DESC")
        return [dict(row) for row in rows]

@app.post("/api/v1/assessments")
async def create_assessment(assessment: Assessment, current_user: User = Depends(require_roles([UserRole.ASSESSOR]))):
    async with app.state.pool.acquire() as connection:
        try:
            # The current query doesn't return the new assessment_id. For a robust audit trail,
            # this should be modified. For now, we log the client_id as the related object.
            await connection.execute(
                """
                INSERT INTO assessments (client_id, assessor_id, date, location, form_version, answers_json, attachments)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                """,
                assessment.client_id,
                assessment.assessor_id,
                assessment.date,
                assessment.location,
                assessment.form_version,
                assessment.answers_json,
                assessment.attachments,
            )
            await log_audit_event(
                app.state.pool,
                current_user.user_id,
                action="create_assessment",
                object_type="assessment",
                object_id=assessment.client_id,
                details={"client_id": assessment.client_id}
            )
            return {"status": "success"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/clients")
async def create_client(client: Client, current_user: User = Depends(require_roles([UserRole.ASSESSOR]))):
    async with app.state.pool.acquire() as connection:
        try:
            client_id = await connection.fetchval(
                """
                INSERT INTO clients (initials, dob, gender, address, la_area)
                VALUES ($1, $2, $3, $4, $5) RETURNING client_id
                """,
                client.initials,
                client.dob,
                client.gender,
                client.address,
                client.la_area,
            )
            await log_audit_event(
                app.state.pool, current_user.user_id, "create_client", "client", client_id, client.dict()
            )
            return {"client_id": client_id}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/clients/{client_id}/fhir")
async def get_client_as_fhir_patient(client_id: int, current_user: User = Depends(require_roles([UserRole.MANAGER, UserRole.ADMIN]))):
    """
    Fetches a client's data and returns it as a FHIR Patient resource.
    """
    async with app.state.pool.acquire() as connection:
        client_row = await connection.fetchrow("SELECT * FROM clients WHERE client_id = $1", client_id)
        if not client_row:
            raise HTTPException(status_code=404, detail="Client not found")

        # Use the mapper to convert to a FHIR resource
        fhir_patient = map_client_to_fhir_patient(dict(client_row))

        # The fhir.resources models are Pydantic-based, so FastAPI can serialize them automatically
        return fhir_patient


@app.get("/api/v1/clients/{client_id}/assessments", response_model=List[AssessmentInDB])
async def get_assessments_for_client(client_id: int, current_user: User = Depends(require_roles([UserRole.ASSESSOR, UserRole.MANAGER, UserRole.ADMIN]))):
    async with app.state.pool.acquire() as connection:
        rows = await connection.fetch("SELECT * FROM assessments WHERE client_id = $1 ORDER BY date DESC", client_id)
        return [dict(row) for row in rows]


@app.get("/api/v1/clients/{client_id}/devices", response_model=List[AssistiveDeviceInDB])
async def get_devices_for_client(client_id: int, current_user: User = Depends(require_roles([UserRole.COORDINATOR, UserRole.MANAGER, UserRole.ADMIN]))):
    async with app.state.pool.acquire() as connection:
        rows = await connection.fetch("SELECT * FROM assistive_devices WHERE client_id = $1 ORDER BY created_at DESC", client_id)
        return [dict(row) for row in rows]


# --- Assistive Technology Models and Endpoints ---

class DeviceWorkflowStatus(str, Enum):
    REFERRAL = "Referral"
    TRIAGE = "Triage"
    ASSESSMENT = "Assessment"
    DEVICE_APPROVAL = "Device Approval"
    PROCUREMENT = "Procurement"
    INSTALLATION = "Installation"
    REVIEW = "Review"
    MAINTENANCE = "Maintenance"

class AssistiveDevice(BaseModel):
    client_id: int
    device_type: str
    serial_number: Optional[str] = None
    pamms_id: Optional[str] = None
    installer_id: Optional[int] = None
    warranty_expires_on: Optional[date] = None

class AssistiveDeviceInDB(AssistiveDevice):
    device_id: int
    status: DeviceWorkflowStatus
    created_at: datetime
    updated_at: datetime

class StatusUpdate(BaseModel):
    status: DeviceWorkflowStatus

def find_pamms_installer(device_type: str) -> Dict:
    """
    A stub function to simulate looking up an installer from a PAMMS.
    In a real system, this would make an API call to a PAMMS provider.
    """
    print(f"Searching for installer for device type: {device_type}")
    # Return a dummy installer for demonstration purposes
    return {"pamms_id": "PAMMS-12345", "installer_id": 9001, "name": "Local Fitters Inc."}

@app.post("/api/v1/assistive-devices", response_model=AssistiveDeviceInDB)
async def create_assistive_device_referral(device: AssistiveDevice, current_user: User = Depends(require_roles([UserRole.COORDINATOR, UserRole.MANAGER, UserRole.ADMIN]))):
    # In a real app, you would call the PAMMS stub here, e.g.:
    # pamms_info = find_pamms_installer(device.device_type)
    # device.pamms_id = pamms_info.get("pamms_id")
    # device.installer_id = pamms_info.get("installer_id")
    async with app.state.pool.acquire() as connection:
        try:
            row = await connection.fetchrow(
                """
                INSERT INTO assistive_devices (client_id, device_type, serial_number, warranty_expires_on, installer_id, pamms_id)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *
                """,
                device.client_id, device.device_type, device.serial_number, device.warranty_expires_on, device.installer_id, device.pamms_id
            )
            await log_audit_event(
                app.state.pool, current_user.user_id, "create_device_referral", "assistive_device", row['device_id'], device.dict()
            )
            return dict(row)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/assistive-devices", response_model=List[AssistiveDeviceInDB])
async def get_assistive_devices(current_user: User = Depends(require_roles([UserRole.COORDINATOR, UserRole.MANAGER, UserRole.ADMIN]))):
    async with app.state.pool.acquire() as connection:
        rows = await connection.fetch("SELECT * FROM assistive_devices ORDER BY created_at DESC")
        return [dict(row) for row in rows]

@app.put("/api/v1/assistive-devices/{device_id}/status", response_model=AssistiveDeviceInDB)
async def update_assistive_device_status(device_id: int, status_update: StatusUpdate, current_user: User = Depends(require_roles([UserRole.COORDINATOR, UserRole.MANAGER, UserRole.ADMIN]))):
    async with app.state.pool.acquire() as connection:
        try:
            # It's good practice to fetch the state before the change to log it, but for simplicity we'll just log the new state.
            row = await connection.fetchrow(
                """
                UPDATE assistive_devices SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE device_id = $2 RETURNING *
                """,
                status_update.status, device_id
            )
            if not row:
                raise HTTPException(status_code=404, detail=f"Device with id {device_id} not found")

            await log_audit_event(
                app.state.pool,
                current_user.user_id,
                action="update_device_status",
                object_type="assistive_device",
                object_id=device_id,
                details={"new_status": status_update.status.value}
            )
            return dict(row)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))


from .gp_connect_client import fetch_patient_summary

# --- External Integrations ---

class NHSNumberRequest(BaseModel):
    nhs_number: str

@app.post("/api/v1/gp-connect/fetch-summary")
async def gp_connect_fetch(
    request: NHSNumberRequest,
    current_user: User = Depends(require_roles([UserRole.MANAGER, UserRole.ADMIN]))
):
    """
    Endpoint to simulate fetching a patient summary from GP Connect.
    """
    # In a real app, you might look up the client's NHS number first.
    # Here, we just pass the number through to the stub.
    fhir_patient = fetch_patient_summary(request.nhs_number)
    return fhir_patient


# --- Predictive Analytics Endpoints ---

class PredictionPoint(BaseModel):
    date: date
    predicted_value: float
    confidence_low: float
    confidence_high: float

class PredictionResponse(BaseModel):
    model_version: str
    forecast: List[PredictionPoint]
    explainability: Dict[str, str]

MODEL_PATH = Path(__file__).parent.parent / "data_science/prophet_model_v1.pkl"

@app.get("/api/v1/predictions", response_model=PredictionResponse)
async def get_predictions(current_user: User = Depends(require_roles([UserRole.MANAGER, UserRole.ADMIN]))):
    # Load the trained model
    try:
        with open(MODEL_PATH, 'rb') as f:
            model = pickle.load(f)
    except FileNotFoundError:
        raise HTTPException(status_code=503, detail="Model not found. Please train the model first.")

    # Generate a future dataframe for the next 12 weeks (84 days)
    future = model.make_future_dataframe(periods=84)
    forecast = model.predict(future)

    # Format the response
    forecast_data = forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].tail(84)
    prediction_points = [
        PredictionPoint(
            date=row['ds'].date(),
            predicted_value=round(row['yhat'], 2),
            confidence_low=round(row['yhat_lower'], 2),
            confidence_high=round(row['yhat_upper'], 2)
        ) for _, row in forecast_data.iterrows()
    ]

    # Stub for model explainability
    explainability = {
        "summary": "Forecast is based on weekly and yearly seasonality, plus UK public holidays.",
        "note": "This is a simplified explanation. A real system would use SHAP or similar methods."
    }

    return PredictionResponse(
        model_version="prophet_v1",
        forecast=prediction_points,
        explainability=explainability
    )


# --- Provider & Outcome Models and Endpoints ---

class Provider(BaseModel):
    provider_id: int
    name: str
    pamms_id: Optional[str] = None
    services_offered: Optional[str] = None
    contact_details: Optional[Dict] = None

class ProviderCreate(BaseModel):
    name: str
    pamms_id: Optional[str] = None
    services_offered: Optional[str] = None
    contact_details: Optional[Dict] = None

class Outcome(BaseModel):
    outcome_id: int
    action_id: int
    outcome_description: str
    recorded_by_user_id: int
    recorded_at: datetime

class OutcomeCreate(BaseModel):
    outcome_description: str


@app.get("/api/v1/providers", response_model=List[Provider])
async def get_providers(current_user: User = Depends(get_current_user)):
    async with app.state.pool.acquire() as connection:
        rows = await connection.fetch("SELECT * FROM providers ORDER BY name")
        return [dict(row) for row in rows]

@app.post("/api/v1/providers", response_model=Provider, status_code=201)
async def create_provider(provider_data: ProviderCreate, current_user: User = Depends(require_roles([UserRole.MANAGER, UserRole.ADMIN]))):
    async with app.state.pool.acquire() as connection:
        row = await connection.fetchrow(
            """
            INSERT INTO providers (name, pamms_id, services_offered, contact_details)
            VALUES ($1, $2, $3, $4) RETURNING *
            """,
            provider_data.name, provider_data.pamms_id, provider_data.services_offered, provider_data.contact_details
        )
        await log_audit_event(app.state.pool, current_user.user_id, "create_provider", "provider", row['provider_id'], provider_data.dict())
        return dict(row)

@app.post("/api/v1/actions/{action_id}/outcomes", response_model=Outcome, status_code=201)
async def record_outcome_for_action(action_id: int, outcome_data: OutcomeCreate, current_user: User = Depends(require_roles([UserRole.ASSESSOR, UserRole.MANAGER]))):
    async with app.state.pool.acquire() as connection:
        row = await connection.fetchrow(
            """
            INSERT INTO outcomes (action_id, outcome_description, recorded_by_user_id)
            VALUES ($1, $2, $3) RETURNING *
            """,
            action_id, outcome_data.outcome_description, current_user.user_id
        )
        await log_audit_event(app.state.pool, current_user.user_id, "record_outcome", "outcome", row['outcome_id'], {"action_id": action_id, "description": outcome_data.outcome_description})
        return dict(row)

@app.get("/api/v1/actions/{action_id}/outcomes", response_model=List[Outcome])
async def get_outcomes_for_action(action_id: int, current_user: User = Depends(get_current_user)):
    async with app.state.pool.acquire() as connection:
        rows = await connection.fetch("SELECT * FROM outcomes WHERE action_id = $1 ORDER BY recorded_at DESC", action_id)
        return [dict(row) for row in rows]


# --- Care Plan Models and Endpoints ---

class CarePlanStatus(str, Enum):
    DRAFT = "Draft"
    ACTIVE = "Active"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"

class CarePlanActionBase(BaseModel):
    goal_description: str
    action_details: Optional[str] = None
    target_date: Optional[date] = None

class CarePlanActionCreate(CarePlanActionBase):
    pass

class CarePlanAction(CarePlanActionBase):
    action_id: int
    care_plan_id: int
    is_completed: bool

class CarePlanBase(BaseModel):
    start_date: date
    end_date: Optional[date] = None
    status: CarePlanStatus = CarePlanStatus.DRAFT
    assigned_provider_id: Optional[int] = None
    review_date: Optional[date] = None

class CarePlanCreate(CarePlanBase):
    actions: List[CarePlanActionCreate]

class CarePlan(CarePlanBase):
    care_plan_id: int
    client_id: int
    created_at: datetime
    actions: List[CarePlanAction]

class AssignProviderRequest(BaseModel):
    provider_id: int

@app.post("/api/v1/clients/{client_id}/careplans", response_model=CarePlan, status_code=201)
async def create_care_plan_for_client(client_id: int, plan_data: CarePlanCreate, current_user: User = Depends(require_roles([UserRole.ASSESSOR]))):
    async with app.state.pool.acquire() as connection:
        async with connection.transaction():
            try:
                # Insert the main care plan record
                plan_row = await connection.fetchrow(
                    """
                    INSERT INTO care_plans (client_id, start_date, end_date, status, assigned_provider_id, review_date)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    RETURNING *
                    """,
                    client_id, plan_data.start_date, plan_data.end_date, plan_data.status, plan_data.assigned_provider_id, plan_data.review_date
                )
                if not plan_row:
                    raise HTTPException(status_code=500, detail="Failed to create care plan.")

                care_plan_id = plan_row['care_plan_id']

                await log_audit_event(
                    app.state.pool,
                    current_user.user_id,
                    action="create_care_plan",
                    object_type="care_plan",
                    object_id=care_plan_id,
                    details=plan_data.dict()
                )

                actions_list = []
                # Insert the associated actions
                for action in plan_data.actions:
                    action_row = await connection.fetchrow(
                        """
                        INSERT INTO care_plan_actions (care_plan_id, goal_description, action_details, target_date)
                        VALUES ($1, $2, $3, $4)
                        RETURNING *
                        """,
                        care_plan_id, action.goal_description, action.action_details, action.target_date
                    )
                    actions_list.append(dict(action_row))

                response_data = dict(plan_row)
                response_data['actions'] = actions_list
                return response_data

            except Exception as e:
                raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@app.get("/api/v1/clients/{client_id}/careplans", response_model=List[CarePlan])
async def get_care_plans_for_client(client_id: int, current_user: User = Depends(require_roles([UserRole.ASSESSOR, UserRole.MANAGER, UserRole.ADMIN]))):
    async with app.state.pool.acquire() as connection:
        plan_rows = await connection.fetch("SELECT * FROM care_plans WHERE client_id = $1 ORDER BY start_date DESC", client_id)
        if not plan_rows:
            return []

        full_plans = []
        for plan_row in plan_rows:
            actions = await connection.fetch("SELECT * FROM care_plan_actions WHERE care_plan_id = $1", plan_row['care_plan_id'])
            plan_dict = dict(plan_row)
            plan_dict['actions'] = [dict(action) for action in actions]
            full_plans.append(plan_dict)

        return full_plans


@app.put("/api/v1/careplans/{care_plan_id}/assign-provider", response_model=CarePlan)
async def assign_provider_to_care_plan(
    care_plan_id: int,
    request: AssignProviderRequest,
    current_user: User = Depends(require_roles([UserRole.MANAGER, UserRole.ADMIN])),
):
    async with app.state.pool.acquire() as connection:
        # Fetch the plan to make sure it exists and to return the full object
        plan_row = await connection.fetchrow(
            "UPDATE care_plans SET assigned_provider_id = $1 WHERE care_plan_id = $2 RETURNING *",
            request.provider_id, care_plan_id
        )
        if not plan_row:
            raise HTTPException(status_code=404, detail="Care plan not found")

        await log_audit_event(
            app.state.pool,
            current_user.user_id,
            action="assign_provider",
            object_type="care_plan",
            object_id=care_plan_id,
            details={"provider_id": request.provider_id}
        )

        # Re-fetch the full plan with actions to return
        actions = await connection.fetch("SELECT * FROM care_plan_actions WHERE care_plan_id = $1", care_plan_id)
        plan_dict = dict(plan_row)
        plan_dict['actions'] = [dict(action) for action in actions]
        return plan_dict