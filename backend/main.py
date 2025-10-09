from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import date, datetime
import asyncpg
from enum import Enum
import pickle
from pathlib import Path

app = FastAPI()

# Database connection settings
DATABASE_URL = "postgresql://user:password@db/mydatabase"

@app.on_event("startup")
async def startup():
    app.state.pool = await asyncpg.create_pool(DATABASE_URL)

@app.on_event("shutdown")
async def shutdown():
    await app.state.pool.close()

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
async def get_assessments():
    async with app.state.pool.acquire() as connection:
        rows = await connection.fetch("SELECT assessment_id, client_id, assessor_id, date, location, form_version, answers_json, attachments FROM assessments ORDER BY date DESC")
        return [dict(row) for row in rows]

@app.post("/api/v1/assessments")
async def create_assessment(assessment: Assessment):
    async with app.state.pool.acquire() as connection:
        try:
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
            return {"status": "success"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/clients")
async def create_client(client: Client):
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
            return {"client_id": client_id}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))


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
async def create_assistive_device_referral(device: AssistiveDevice):
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
            return dict(row)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/assistive-devices", response_model=List[AssistiveDeviceInDB])
async def get_assistive_devices():
    async with app.state.pool.acquire() as connection:
        rows = await connection.fetch("SELECT * FROM assistive_devices ORDER BY created_at DESC")
        return [dict(row) for row in rows]

@app.put("/api/v1/assistive-devices/{device_id}/status", response_model=AssistiveDeviceInDB)
async def update_assistive_device_status(device_id: int, status_update: StatusUpdate):
    async with app.state.pool.acquire() as connection:
        try:
            row = await connection.fetchrow(
                """
                UPDATE assistive_devices SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE device_id = $2 RETURNING *
                """,
                status_update.status, device_id
            )
            if not row:
                raise HTTPException(status_code=404, detail=f"Device with id {device_id} not found")
            return dict(row)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))


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
async def get_predictions():
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