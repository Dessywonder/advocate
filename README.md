# UK Care Management Platform - Proof of Concept

This repository contains the source code for a comprehensive, UK-ready care management platform designed for adult social care. This proof-of-concept (POC) application demonstrates a range of critical features, from offline mobile data capture to predictive analytics, built on a modern, scalable technology stack.

## Key Features

*   **Offline-First Mobile App:** A React Native (Expo) application for assessors to capture assessment data in the field, even without an internet connection. Data is stored locally in SQLite and synced to the backend when a connection is available.
*   **Role-Based Access Control (RBAC):** A secure authentication system with distinct user roles (e.g., Assessor, Manager, Coordinator, Admin). The UI and API endpoints are protected, ensuring users can only access data and features relevant to their role.
*   **Advanced Case Management:** A complete workflow for creating and managing client care plans, assigning them to care providers, and tracking the outcomes of specific interventions.
*   **Assistive Technology Workflow:** End-to-end management of assistive technology referrals, from creation and triage to status updates.
*   **Predictive Analytics:** A data science pipeline using Python and the Prophet library to forecast care demand. A manager-level dashboard visualizes these predictions.
*   **Interoperability (FHIR):** The platform can expose client data in the standardized FHIR format and includes a stub for consuming data from external systems like GP Connect.
*   **Comprehensive Audit Trail:** All data modification actions are logged, and authorized users can view the history of key records directly in the UI.
*   **Automated Backend Testing:** A foundational test suite using `pytest` verifies the correctness of critical components, especially the security middleware.

## Technology Stack

*   **Backend:** Python, FastAPI, Pydantic, PostgreSQL
*   **Frontend (Web):** React, React Router, Recharts
*   **Frontend (Mobile):** React Native, Expo, SQLite
*   **Data Science:** Pandas, Prophet, Scikit-learn
*   **Infrastructure:** Docker, Docker Compose
*   **Testing:** Pytest, Pytest-Asyncio, Pytest-Mock

## Getting Started

### Prerequisites

*   Docker and Docker Compose
*   Python 3.9+ and `pip`
*   Node.js and `npm`

### 1. Configuration

The backend application is configured using environment variables. A template is provided in `.env.example`.

1.  Copy the example file to a new `.env` file at the project root:
    ```bash
    cp .env.example .env
    ```
2.  (Optional) Modify the values in the `.env` file if you are not using the default Docker Compose setup.

### 2. Running the Application

The entire backend infrastructure (FastAPI server and PostgreSQL database) is containerized and can be started with a single command from the project root:

```bash
docker compose up --build -d
```

This will build the necessary Docker images and start the services in the background. You can view the running services with `docker compose ps`.

To run the web and mobile frontends, you will need to install their dependencies and start their development servers. (Instructions can be found in the `DEMO_AND_TESTING_GUIDE.md`).

### 3. Running the Backend Tests

A suite of automated tests has been created for the backend. To run them, first ensure you have installed the Python dependencies:

```bash
pip install -r backend/requirements.txt
```

Then, run the test suite from the project root:

```bash
pytest backend/
```

## Detailed Testing and Demo Walkthrough

For a comprehensive, step-by-step guide on how to test every feature of this application, from mobile data capture to viewing the audit trail, please see the **[DEMO_AND_TESTING_GUIDE.md](DEMO_AND_TESTING_GUIDE.md)**.