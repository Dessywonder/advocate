import pandas as pd
from prophet import Prophet
import pickle

# --- Configuration ---
INPUT_FILE = 'data_science/cleaned_for_prophet.csv'
MODEL_OUTPUT_FILE = 'data_science/prophet_model_v1.pkl'

def train_model():
    """
    Loads the prepared data, trains a Prophet model, and saves it to a file.
    """
    print("Starting model training process...")

    # Load the data
    try:
        df = pd.read_csv(INPUT_FILE)
        print(f"Successfully loaded data from {INPUT_FILE}.")
    except FileNotFoundError:
        print(f"Error: Cleaned data file not found at {INPUT_FILE}. Please run etl.py first.")
        return

    # Initialize and train the Prophet model
    # We can add seasonality components to improve the model's accuracy.
    # Daily seasonality is not relevant for daily data, but weekly and yearly are.
    print("Training Prophet model...")
    model = Prophet(weekly_seasonality=True, yearly_seasonality=True, daily_seasonality=False)
    model.add_country_holidays(country_name='UK') # Add UK holidays as a feature
    model.fit(df)
    print("Model training complete.")

    # Save the trained model to a file using pickle
    print(f"Saving model to {MODEL_OUTPUT_FILE}...")
    with open(MODEL_OUTPUT_FILE, 'wb') as f:
        pickle.dump(model, f)
    print("Model saved successfully.")

if __name__ == '__main__':
    # Note: For this to run, you must first generate the data and then run the ETL script.
    # 1. python data_science/generate_synthetic_data.py
    # 2. python data_science/etl.py
    # 3. python data_science/train.py
    train_model()