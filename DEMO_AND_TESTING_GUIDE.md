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
    *   In your browser, go to `http://localhost:3000`. The Dashboard should be visible.

2.  **Navigate to Assistive Tech:**
    *   In the header, click the **"Assistive Tech"** link.
    *   The URL should change to `http://localhost:3000/assistive-tech` and the "Assistive Technology Referrals" page will be displayed. The table will initially be empty.

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
    *   In your browser, navigate to `http://localhost:3000`.
    *   The application should load the "Dashboard" view by default at the root URL.

3.  **Verify the Forecast:**
    *   The page should display a line chart titled "12-Week Assessment Forecast".
    *   The chart will show the predicted number of assessments over the next 12 weeks.
    *   A shaded area around the line indicates the confidence interval of the forecast.
    *   The model version and a summary of its features should be displayed above the chart.

---

## Part 5: Case Management & Care Plan Test

This test verifies the creation and display of client-specific care plans. It assumes you have already completed Part 1 and the applications are running.

### Step 1: Navigate to a Client's Detail Page

1.  **Go to the Assessments View:**
    *   In the web app, navigate to `http://localhost:3000/assessments` or click the **"Assessments"** link in the header.
    *   You should see the list of synced assessments from Part 2.

2.  **Select a Client:**
    *   In the "Client ID" column, click on the ID of a client (e.g., `101`).
    *   The URL will change to `http://localhost:3000/client/101`, and you will be on the "Client Details" page for that client.
    *   Verify that the page now shows lists of "Assessments" and "Assistive Devices" for Client 101, replacing the old placeholder text.

### Step 2: Create a New Care Plan

1.  **Locate the Care Plan Section:**
    *   On the Client Details page, scroll down to the "Create New Care Plan" form.

2.  **Fill Out the Form:**
    *   **Start Date:** Leave as the default (today's date).
    *   **Status:** Leave as "Draft".
    *   **Goals/Actions:**
        *   In the first input box, type: `Improve mobility within the home.`
        *   Click the **"Add Action"** button.
        *   In the second input box that appears, type: `Schedule weekly physical therapy sessions.`
        *   Click **"Add Action"** again.
        *   In the third input box, type: `Install grab bars in the bathroom.`

3.  **Save the Care Plan:**
    *   Click the **"Save Care Plan"** button.

### Step 3: Verify the Care Plan and Audit Trail

1.  **Check the Display:**
    *   The form should clear, and the "Existing Care Plans" section above it should now display the new care plan.
    *   You should see the Plan ID, Status, and Start Date.
    *   Below that, you should see the three goals/actions you entered, listed as bullet points.

2.  **View the Audit Trail:**
    *   Log out and log back in as the manager (`manager@care.com`).
    *   Navigate back to the same client's detail page.
    *   Next to the new care plan you created, click the **"Show History"** button.
    *   An audit trail table should appear, showing an event for the "create_care_plan" action, including the user who performed it and the data that was saved.

This completes the test of the care plan functionality, demonstrating the ability to create and view a multi-action care plan for a specific client.

---

## Part 6: Authentication and RBAC Test

This test verifies that users can log in and that their access to different parts of the application is correctly restricted based on their role.

### Step 1: Access the Login Page

1.  **Navigate to the Root URL:**
    *   In a fresh browser session (or after logging out), navigate to `http://localhost:3000`.
    *   Because you are not authenticated, you should be automatically redirected to the login page at `http://localhost:3000/login`.

### Step 2: Test the Manager Role

1.  **Log in as a Manager:**
    *   On the login page, enter the following credentials:
        *   Email: `manager@care.com`
        *   Password: `password` (any password will work)
    *   Click **"Login"**.

2.  **Verify Manager Access:**
    *   You should be redirected to the Dashboard.
    *   In the header, you should see your role ("Welcome, manager!") and links to **Dashboard**, **Assessments**, and **Assistive Tech**.
    *   Verify that you can navigate to and view all three of these pages.

3.  **Log Out:**
    *   Click the **"Logout"** button in the header. You should be returned to the login page.

### Step 3: Test the Assessor Role

1.  **Log in as an Assessor:**
    *   On the login page, enter the following credentials:
        *   Email: `assessor@care.com`
        *   Password: `password`
    *   Click **"Login"**.

2.  **Verify Assessor Access:**
    *   You should be redirected to the main page.
    *   In the header, you should see your role ("Welcome, assessor!").
    *   Crucially, you should **only** see a navigation link for **Assessments**. The links for Dashboard and Assistive Tech should not be visible.
    *   Verify that you can access the Assessments page.

3.  **Test URL Protection:**
    *   Manually change the URL in your browser's address bar to `http://localhost:3000/`.
    *   Because the assessor role is not permitted to view the dashboard, you should be redirected back to your default view. This confirms the route-level protection is working.

4.  **Log Out:**
    *   Click the **"Logout"** button.

This completes the test of the authentication and role-based access control systems.

---

## Part 7: Advanced Case Management Test (Providers & Outcomes)

This test verifies the provider management and outcome tracking functionalities. It assumes you are logged in as a manager (`manager@care.com`).

### Step 1: Manage Providers

1.  **Navigate to the Providers Page:**
    *   In the header, click the **"Providers"** link.
    *   You should see the "Provider Management" page with a list of the sample providers.

2.  **Add a New Provider:**
    *   In the "Add New Provider" form, enter:
        *   Provider Name: `Wellness Solutions Ltd.`
        *   Services Offered: `Mental Health Support, Counseling`
    *   Click **"Add Provider"**.
    *   The new provider should appear in the list below.

### Step 2: Assign a Provider to a Care Plan

1.  **Navigate to a Client's Page:**
    *   Go to the **"Assessments"** page and click on a client ID (e.g., `101`) to go to their details page.

2.  **Assign the Provider:**
    *   Find a care plan that is "Not Assigned".
    *   In the dropdown menu, select the new provider: `Wellness Solutions Ltd.`.
    *   Click the **"Assign Provider"** button.
    *   The care plan's provider status should update to show the new provider's name.

### Step 3: Record an Outcome

1.  **Log in as an Assessor:**
    *   Log out from the manager account and log back in as an assessor (`assessor@care.com`).

2.  **Navigate to the Same Client Page:**
    *   Go to the **"Assessments"** page and click on the same client ID (`101`).

3.  **Record an Outcome:**
    *   Find a specific goal/action in the care plan (e.g., `Improve mobility within the home.`).
    *   Click the **"Record Outcome"** button next to it. A text box will appear.
    *   In the text box, type: `Client reports feeling more confident moving around the house after first PT session.`
    *   Click **"Save Outcome"**.
    *   The new outcome should appear directly below the goal.

This completes the test of the advanced case management features.

---

## Part 8: Interoperability and FHIR Test

This test verifies the system's ability to expose its own data in the FHIR format and to consume data from an external FHIR-compliant source (simulated). It assumes you are logged in as a manager (`manager@care.com`).

### Step 1: Test Exposing Data as FHIR

1.  **Get a Client's FHIR Representation:**
    *   Using a tool like Postman, Insomnia, or `curl`, make a `GET` request to the following URL. You will need to include the authentication token for the manager user, which can be found in your browser's local storage after logging in.
    *   **URL:** `http://localhost:8000/api/v1/clients/101/fhir`
    *   **Headers:** `Authorization: Bearer <your_auth_token>`

2.  **Verify the FHIR Output:**
    *   The response should be a JSON object that conforms to the FHIR `Patient` resource standard.
    *   It should contain fields like `resourceType: "Patient"`, `id: "101"`, and an `identifier` that includes the client's internal ID.

### Step 2: Test Consuming Data from GP Connect (Simulated)

1.  **Navigate to a Client's Page:**
    *   In the web app, go to the **"Assessments"** page and click on a client ID (e.g., `101`) to go to their details page.

2.  **Fetch the GP Summary:**
    *   On the Client Details page, find the "GP Connect Summary" section.
    *   Click the **"Fetch GP Summary"** button.

3.  **Verify the Displayed Data:**
    *   The section should update to display the patient information from our GP Connect stub.
    *   You should see the name "John Jonathan Smith", the date of birth "1955-01-01", and the address from the sample data.

This completes the test of the interoperability features, demonstrating that the platform can both share and consume data using the FHIR standard.

### Step 4: Verify Stricter Permissions

1.  **Log in as an Assessor:**
    *   Use the credentials `assessor@care.com` / `password`.

2.  **Attempt to View Devices:**
    *   Manually change the URL in your browser's address bar to `http://localhost:3000/assistive-tech`.
    *   The page should redirect you away, and if you check the browser's developer tools, you will see a `403 Forbidden` error for the API request to `/api/v1/assistive-devices`. This confirms the backend RBAC is working correctly.

3.  **Log Out.**