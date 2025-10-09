from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict
from datetime import date, datetime
import asyncpg

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