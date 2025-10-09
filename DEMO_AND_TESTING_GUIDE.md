# Prototype Demo & Manual Testing Guide

This document provides instructions for demonstrating the prototype's functionality and for manually testing the end-to-end workflow.

**Prerequisites:**
*   A working local environment with Docker, Node.js, and `npm` installed.
*   The execution environment must be able to correctly handle `npm install` and `docker compose up`.

---

## Part 1: Setting Up the Environment

1.  **Start the Backend Services:**
    *   From the root of the project, run the following command to build and start the backend API and PostgreSQL database:
        ```bash
        docker compose up --build -d
        ```
    *   Verify that both containers are running and healthy:
        ```bash
        docker compose ps
        ```
    *   You should see the `backend` and `db` services running.

2.  **Install Web App Dependencies:**
    *   Navigate to the `web` directory and install the required npm packages:
        ```bash
        cd web
        npm install
        ```

3.  **Install Mobile App Dependencies:**
    *   Navigate to the `mobile` directory and install the required npm packages:
        ```bash
        cd mobile
        npm install
        ```

---

## Part 2: End-to-End Workflow Test

This test simulates the core user journey: an assessor captures data offline, syncs it to the server, and a manager views the data on a web dashboard.

### Step 1: Run the Applications

1.  **Run the Web Viewer:**
    *   In the `web` directory, start the React development server:
        ```bash
        npm start
        ```
    *   Open a web browser and navigate to `http://localhost:3000`.
    *   You should see the "Synced Assessments Viewer" dashboard. Initially, it will show "No assessments found."

2.  **Run the Mobile App:**
    *   In the `mobile` directory, start the Expo development server:
        ```bash
        npm start
        ```
    *   This will open the Expo developer tools. Use the Expo Go app on a physical device (or an emulator) to open the mobile application.

### Step 2: Capture an Assessment (Offline)

1.  **Simulate Offline Mode:**
    *   On the mobile device running the app, **disable Wi-Fi and cellular data**. This is critical to test the offline capabilities.

2.  **Enter Assessment Data:**
    *   In the app, you will see the "Offline Assessment" form.
    *   Fill in the fields:
        *   Client ID: `101`
        *   Assessor ID: `505`
        *   Location: `Client's Home, Rural Area`
        *   Assessment Notes: `Client seems to be in good spirits but requires assistance with mobility.`
    *   Press the **"Save Assessment Offline"** button.
    *   A status message "Assessment saved successfully" should appear. The form will clear.

3.  **Capture a Second Assessment:**
    *   Enter another set of data:
        *   Client ID: `102`
        *   Assessor ID: `505`
        *   Location: `Community Center`
        *   Assessment Notes: `Follow-up visit. Client is using the new equipment as instructed.`
    *   Press **"Save Assessment Offline"**.

### Step 3: Synchronize Data (Online)

1.  **Simulate Going Online:**
    *   On the mobile device, **re-enable Wi-Fi or cellular data**.

2.  **Trigger Sync:**
    *   In the app, press the **"Sync Data to Server"** button.
    *   A status message will appear: "Starting sync...".
    *   After a moment, the message should change to: "Sync complete. 2 assessments synced."

### Step 4: Verify Data in Web Viewer

1.  **Refresh the Web Dashboard:**
    *   Go back to the web browser showing the "Synced Assessments Viewer" at `http://localhost:3000`.
    *   Press the **"Refresh Data"** button.

2.  **Confirm Data:**
    *   The table should now display the two assessments you created on the mobile app.
    *   Verify that the Client ID, Assessor ID, Location, and Notes match the data you entered.

---

This completes the end-to-end test. It successfully demonstrates the core functionality of offline data capture and synchronization.

---

## Part 3: Assistive Technology Workflow Test

This test verifies the functionality of the assistive technology referral and workflow management system. It assumes you have already completed Part 1 and the applications are running.

### Step 1: Navigate to the Assistive Tech Page

1.  **Open the Web Viewer:**
    *   In your browser, ensure the Care Management Platform is open at `http://localhost:3000`.

2.  **Switch Views:**
    *   In the header, click the **"Assistive Tech"** button.
    *   The view should change to the "Assistive Technology Referrals" page. The table will initially be empty.

### Step 2: Create a New Device Referral

1.  **Enter Referral Data:**
    *   In the "Create New Referral" form, enter the following details:
        *   Client ID: `101` (This should correspond to a client created in Part 2).
        *   Device Type: `Stairlift`
    *   Click the **"Create Referral"** button.

2.  **Verify Creation:**
    *   The table should automatically refresh and display the new referral for the stairlift.
    *   Its initial status will be "Referral".

3.  **Create a Second Referral:**
    *   Enter another referral:
        *   Client ID: `102`
        *   Device Type: `Emergency Pendant Alarm`
    *   Click **"Create Referral"**. The list should now show two devices.

### Step 3: Update the Workflow Status

1.  **Update the Stairlift Status:**
    *   Find the "Stairlift" referral in the table.
    *   In the "Actions" column for that row, click the dropdown menu and select **"Assessment"**.
    *   The status for the stairlift should immediately update in the table to "Assessment" without a page reload.

2.  **Update the Alarm Status:**
    *   Find the "Emergency Pendant Alarm" referral.
    *   In its "Actions" dropdown, select **"Triage"**.
    *   The status should update to "Triage".

This completes the test of the assistive technology workflow, demonstrating the ability to create and manage referrals through their lifecycle.

---

## Part 4: Predictive Analytics and Dashboard Test

This test verifies the data pipeline, model training, and forecasting dashboard. It assumes you have a Python environment with the dependencies from `data_science/requirements.txt` installed.

### Step 1: Prepare the Data and Model

1.  **Install Python Dependencies:**
    *   From the root of the project, install the required packages:
        ```bash
        pip install -r data_science/requirements.txt
        ```

2.  **Generate Synthetic Data:**
    *   Run the data generation script:
        ```bash
        python data_science/generate_synthetic_data.py
        ```
    *   This will create a `synthetic_assessments.csv` file in the `data_science` directory.

3.  **Run the ETL Process:**
    *   Run the ETL script to clean and prepare the data for the model:
        ```bash
        python data_science/etl.py
        ```
    *   This will create a `cleaned_for_prophet.csv` file.

4.  **Train the Forecasting Model:**
    *   Run the training script:
        ```bash
        python data_science/train.py
        ```
    *   This will create the `prophet_model_v1.pkl` file, which the backend API uses to serve predictions.

### Step 2: View the Forecast on the Dashboard

1.  **Start the Backend and Web App:**
    *   Ensure the backend and web application are running as described in Part 1.

2.  **Navigate to the Dashboard:**
    *   In your browser, go to `http://localhost:3000`.
    *   The application should now default to the "Dashboard" view. If not, click the **"Dashboard"** button in the header.

3.  **Verify the Forecast:**
    *   The page should display a line chart titled "12-Week Assessment Forecast".
    *   The chart will show the predicted number of assessments over the next 12 weeks.
    *   A shaded area around the line indicates the confidence interval of the forecast.
    *   The model version and a summary of its features should be displayed above the chart.