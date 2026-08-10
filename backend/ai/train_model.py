import os
import joblib
import json
import pandas as pd
import numpy as np

from sklearn.linear_model import LinearRegression
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score
)

# ----------------------------
# Paths
# ----------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATA_FILE = os.path.join(
    BASE_DIR,
    "processed_data",
    "processed_synthetic.csv"
)

MODEL_FILE = os.path.join(
    BASE_DIR,
    "models",
    "crowd_prediction.pkl"
)

METRICS_FILE = os.path.join(
    BASE_DIR,
    "models",
    "crowd_regressor_metrics.json"
)

# ----------------------------
# Load Dataset
# ----------------------------
print("Loading processed dataset...")
if not os.path.exists(DATA_FILE):
    print(f"Data file not found at {DATA_FILE}. Make sure preprocessing ran.")
    exit(1)

df = pd.read_csv(DATA_FILE)
print(f"Dataset Shape: {df.shape}")

# ----------------------------
# Features & Target
# ----------------------------
X = df[
    [
        "Hour",
        "Day_Name",
        "Month",
        "Is_Holiday",
        "Weather",
        "From_Station",
        "To_Station",
        "Distance_km",
        "Ticket_Type",
        "Is_Interchange"
    ]
]

y = df["Passenger_Count"]

# Train Test Split
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)

# ----------------------------
# 1. Train & Evaluate Baseline (Linear Regression)
# ----------------------------
print("\nTraining Baseline Model (Linear Regression)...")
baseline = LinearRegression()
baseline.fit(X_train, y_train)
base_preds = baseline.predict(X_test)

base_mae = mean_absolute_error(y_test, base_preds)
base_rmse = mean_squared_error(y_test, base_preds) ** 0.5
base_r2 = r2_score(y_test, base_preds)

print(f"Linear Regression -> MAE: {base_mae:.2f}, RMSE: {base_rmse:.2f}, R²: {base_r2:.4f}")

# ----------------------------
# 2. Train & Evaluate HistGradientBoostingRegressor
# ----------------------------
print("\nTraining Optimized Ensemble Model (HistGradientBoostingRegressor)...")
# HistGradientBoostingRegressor works well out of the box and is fast/small
ensemble = HistGradientBoostingRegressor(
    max_iter=150,
    max_depth=10,
    learning_rate=0.1,
    random_state=42
)
ensemble.fit(X_train, y_train)
ensemble_preds = ensemble.predict(X_test)

ens_mae = mean_absolute_error(y_test, ensemble_preds)
ens_rmse = mean_squared_error(y_test, ensemble_preds) ** 0.5
ens_r2 = r2_score(y_test, ensemble_preds)

print(f"HistGradientBoosting  -> MAE: {ens_mae:.2f}, RMSE: {ens_rmse:.2f}, R²: {ens_r2:.4f}")

# Select and save the best model (HistGradientBoosting is expected to win by far)
print("\nSaving best model to", MODEL_FILE)
os.makedirs(os.path.dirname(MODEL_FILE), exist_ok=True)
joblib.dump(ensemble, MODEL_FILE)

# Save metrics JSON for visual analysis on dashboard
metrics = {
    "model_name": "HistGradientBoostingRegressor",
    "metrics": {
        "mae": round(ens_mae, 2),
        "rmse": round(ens_rmse, 2),
        "r2": round(ens_r2, 4)
    },
    "baseline": {
        "model_name": "LinearRegression",
        "mae": round(base_mae, 2),
        "rmse": round(base_rmse, 2),
        "r2": round(base_r2, 4)
    }
}

with open(METRICS_FILE, "w") as f:
    json.dump(metrics, f, indent=4)

print("Crowd Count Regressor metrics saved to:", METRICS_FILE)
print("Training Completed Successfully!")