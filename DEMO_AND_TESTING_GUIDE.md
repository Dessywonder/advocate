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