import pandas as pd

# --- Configuration ---
INPUT_FILE = 'data_science/synthetic_assessments.csv'
OUTPUT_FILE = 'data_science/cleaned_for_prophet.csv'

def run_etl():
    """
    Reads the raw synthetic data, cleans it, and prepares it for the Prophet model.
    The Prophet model requires a dataframe with two columns: 'ds' (datestamp) and 'y' (the value to forecast).
    """
    print("Starting ETL process...")

    # EXTRACT: Read the raw data
    try:
        df = pd.read_csv(INPUT_FILE, parse_dates=['assessment_date'])
        print(f"Successfully loaded {len(df)} records from {INPUT_FILE}")
    except FileNotFoundError:
        print(f"Error: Input file not found at {INPUT_FILE}. Please run generate_synthetic_data.py first.")
        return

    # TRANSFORM:
    # 1. We only need the date for our time-series forecast.
    # 2. We want to forecast the number of assessments per day.
    print("Transforming data...")
    df['ds'] = df['assessment_date'].dt.date

    # 3. Aggregate by day to get the count of assessments ('y').
    daily_assessments = df.groupby('ds').size().reset_index(name='y')

    # Ensure the ds column is in datetime format for Prophet
    daily_assessments['ds'] = pd.to_datetime(daily_assessments['ds'])

    print(f"Data aggregated into {len(daily_assessments)} daily records.")

    # LOAD: Save the cleaned data to a new CSV
    print(f"Saving cleaned data to {OUTPUT_FILE}...")
    daily_assessments.to_csv(OUTPUT_FILE, index=False)
    print("ETL process complete.")

if __name__ == '__main__':
    run_etl()