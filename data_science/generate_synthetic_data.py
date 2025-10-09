import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# --- Configuration ---
NUM_RECORDS = 1000
START_DATE = datetime.now() - timedelta(days=365 * 2)
END_DATE = datetime.now()
OUTPUT_FILE = 'data_science/synthetic_assessments.csv'

# Possible values for categorical data
LA_AREAS = ['North', 'South', 'East', 'West', 'Central']
GENDERS = ['Male', 'Female', 'Other']
CONDITIONS = ['Mobility', 'Dementia', 'Frailty', 'Reablement', 'Other']

def generate_synthetic_data():
    """Generates a synthetic dataset of assessment records and saves it to a CSV file."""

    print(f"Generating {NUM_RECORDS} synthetic assessment records...")

    data = {
        'assessment_id': range(1, NUM_RECORDS + 1),
        'client_id': np.random.randint(1000, 2000, size=NUM_RECORDS),
        'assessor_id': np.random.randint(10, 20, size=NUM_RECORDS),
        'assessment_date': [START_DATE + timedelta(seconds=np.random.randint(0, int((END_DATE - START_DATE).total_seconds()))) for _ in range(NUM_RECORDS)],
        'la_area': np.random.choice(LA_AREAS, size=NUM_RECORDS, p=[0.2, 0.2, 0.2, 0.2, 0.2]),
        'primary_condition': np.random.choice(CONDITIONS, size=NUM_RECORDS, p=[0.3, 0.2, 0.3, 0.1, 0.1]),
        'dob': [datetime(1920, 1, 1) + timedelta(days=np.random.randint(0, 30000)) for _ in range(NUM_RECORDS)],
        'gender': np.random.choice(GENDERS, size=NUM_RECORDS, p=[0.48, 0.48, 0.04])
    }

    df = pd.DataFrame(data)

    # Introduce some seasonality - more assessments in winter
    df['month'] = df['assessment_date'].dt.month
    winter_months = [1, 2, 11, 12]
    # Double the number of assessments in winter months by duplicating some rows
    winter_assessments = df[df['month'].isin(winter_months)]
    df = pd.concat([df, winter_assessments], ignore_index=True)

    df = df.sort_values(by='assessment_date').reset_index(drop=True)
    df = df.drop(columns=['month'])

    print(f"Saving data to {OUTPUT_FILE}...")
    df.to_csv(OUTPUT_FILE, index=False)
    print("Synthetic data generation complete.")

if __name__ == '__main__':
    generate_synthetic_data()