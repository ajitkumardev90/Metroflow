import os
import json
import joblib
import pandas as pd
import numpy as np

from sklearn.ensemble import HistGradientBoostingRegressor, HistGradientBoostingClassifier
from sklearn.linear_model import LogisticRegression, Ridge
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix
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

MODEL_B_FILE = os.path.join(
    BASE_DIR,
    "models",
    "demand_forecast.pkl"
)

MODEL_C_FILE = os.path.join(
    BASE_DIR,
    "models",
    "congestion_classifier.pkl"
)

METRICS_FILE = os.path.join(
    BASE_DIR,
    "models",
    "metrics_extra.json"
)

# ----------------------------
# Load Dataset
# ----------------------------
print("Loading dataset for extra models...")
df = pd.read_csv(DATA_FILE)

# ----------------------------
# Passenger Demand Forecaster (Hourly Demand at Station)
# ----------------------------
print("\n--- Training Passenger Demand Forecaster ---")
# Aggregating count by Date, Hour, From_Station to get hourly demand
agg_df = df.groupby(["Date", "Hour", "From_Station", "Weather", "Is_Holiday", "Day_Name", "Month"]).agg({
    "Passenger_Count": "sum"
}).reset_index()

# Sort by station and date/hour to create lag features
agg_df = agg_df.sort_values(by=["From_Station", "Date", "Hour"])
agg_df["Passenger_Lag_1"] = agg_df.groupby("From_Station")["Passenger_Count"].shift(1)

# Fill na (for the first hour of each station) with station's median ridership
agg_df["Passenger_Lag_1"] = agg_df.groupby("From_Station")["Passenger_Lag_1"].transform(
    lambda x: x.fillna(x.median() if not x.isna().all() else 100)
)

# Features & Target for Model B
X_b = agg_df[
    [
        "Hour",
        "Day_Name",
        "Month",
        "Is_Holiday",
        "Weather",
        "From_Station",
        "Passenger_Lag_1"
    ]
]
y_b = agg_df["Passenger_Count"]

X_b_train, X_b_test, y_b_train, y_b_test = train_test_split(
    X_b, y_b, test_size=0.2, random_state=42
)

# Compare Baseline (Ridge) and HistGradientBoostingRegressor
baseline_b = Ridge()
baseline_b.fit(X_b_train, y_b_train)
b_base_preds = baseline_b.predict(X_b_test)

b_base_mae = mean_absolute_error(y_b_test, b_base_preds)
b_base_rmse = mean_squared_error(y_b_test, b_base_preds) ** 0.5
b_base_r2 = r2_score(y_b_test, b_base_preds)

model_b = HistGradientBoostingRegressor(max_iter=100, max_depth=8, random_state=42)
model_b.fit(X_b_train, y_b_train)
b_preds = model_b.predict(X_b_test)

b_mae = mean_absolute_error(y_b_test, b_preds)
b_rmse = mean_squared_error(y_b_test, b_preds) ** 0.5
b_r2 = r2_score(y_b_test, b_preds)

print(f"Demand Forecaster Baseline (Ridge) -> MAE: {b_base_mae:.2f}, R²: {b_base_r2:.4f}")
print(f"Demand Forecaster Regressor (HGBR) -> MAE: {b_mae:.2f}, RMSE: {b_rmse:.2f}, R²: {b_r2:.4f}")
joblib.dump(model_b, MODEL_B_FILE)


# ----------------------------
# Congestion Classifier (Binary: Congested = 1 / 0)
# ----------------------------
print("\n--- Training Congestion Classifier ---")
# Define congested status: count > 1200 passengers for a single trip record
df["Congested"] = (df["Passenger_Count"] > 1200).astype(int)

X_c = df[
    [
        "Hour",
        "Day_Name",
        "Month",
        "Is_Holiday",
        "Weather",
        "From_Station",
        "To_Station",
        "Distance_km",
        "Is_Interchange"
    ]
]
y_c = df["Congested"]

X_c_train, X_c_test, y_c_train, y_c_test = train_test_split(
    X_c, y_c, test_size=0.2, random_state=42
)

# Compare Baseline (Logistic Regression) and HistGradientBoostingClassifier
baseline_c = LogisticRegression(max_iter=500)
baseline_c.fit(X_c_train, y_c_train)
c_base_preds = baseline_c.predict(X_c_test)

base_acc = accuracy_score(y_c_test, c_base_preds)
base_f1 = f1_score(y_c_test, c_base_preds, zero_division=0)

model_c = HistGradientBoostingClassifier(max_iter=100, max_depth=8, random_state=42)
model_c.fit(X_c_train, y_c_train)
c_preds = model_c.predict(X_c_test)

acc = accuracy_score(y_c_test, c_preds)
prec = precision_score(y_c_test, c_preds, zero_division=0)
rec = recall_score(y_c_test, c_preds, zero_division=0)
f1 = f1_score(y_c_test, c_preds, zero_division=0)
tn, fp, fn, tp = confusion_matrix(y_c_test, c_preds).ravel()

print(f"Congestion Classifier Baseline (LogReg) -> Accuracy: {base_acc:.4f}, F1: {base_f1:.4f}")
print(f"Congestion Classifier (HGBC) -> Accuracy: {acc:.4f}, Precision: {prec:.4f}, Recall: {rec:.4f}, F1: {f1:.4f}")
joblib.dump(model_c, MODEL_C_FILE)


# Save all extra metrics
metrics_extra = {
    "model_b_demand": {
        "model_name": "HistGradientBoostingRegressor",
        "mae": round(float(b_mae), 2),
        "rmse": round(float(b_rmse), 2),
        "r2": round(float(b_r2), 4),
        "baseline": {
            "model_name": "RidgeRegression",
            "mae": round(float(b_base_mae), 2),
            "r2": round(float(b_base_r2), 4)
        }
    },
    "model_c_congestion": {
        "model_name": "HistGradientBoostingClassifier",
        "accuracy": round(float(acc), 4),
        "precision": round(float(prec), 4),
        "recall": round(float(rec), 4),
        "f1": round(float(f1), 4),
        "confusion_matrix": {
            "true_negative": int(tn),
            "false_positive": int(fp),
            "false_negative": int(fn),
            "true_positive": int(tp)
        },
        "baseline": {
            "model_name": "LogisticRegression",
            "accuracy": round(float(base_acc), 4),
            "f1": round(float(base_f1), 4)
        }
    }
}

with open(METRICS_FILE, "w") as f:
    json.dump(metrics_extra, f, indent=4)

print("\nExtra model metrics saved to:", METRICS_FILE)
print("Training of Extra Models Completed Successfully!")
