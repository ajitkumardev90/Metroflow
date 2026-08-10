import os
import joblib
import pandas as pd
from sqlalchemy.orm import Session

from app.services.recommendation_service import get_recommendations, optimize_schedule
from app.services.alert_service import generate_alert
from app.models.station import Station
from app.models.passenger_data import PassengerData

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))

CROWD_REGRESSOR_PATH = os.path.join(
    BASE_DIR,
    "ai",
    "models",
    "crowd_prediction.pkl"
)

DEMAND_FORECASTER_PATH = os.path.join(
    BASE_DIR,
    "ai",
    "models",
    "demand_forecast.pkl"
)

CONGESTION_CLASSIFIER_PATH = os.path.join(
    BASE_DIR,
    "ai",
    "models",
    "congestion_classifier.pkl"
)

ENCODER_PATH = os.path.join(
    BASE_DIR,
    "ai",
    "models",
    "label_encoders.pkl"
)

print("Loading AI Models...")

crowd_regressor = joblib.load(CROWD_REGRESSOR_PATH)
demand_forecaster = joblib.load(DEMAND_FORECASTER_PATH)
congestion_classifier = joblib.load(CONGESTION_CLASSIFIER_PATH)
encoders = joblib.load(ENCODER_PATH)

print("AI Models Loaded Successfully!")


def safe_transform(encoder, val, default_val=None):
    """
    Safely encode categorical labels, handling previously unseen variables.
    """
    if val in encoder.classes_:
        return encoder.transform([val])[0]
        
    # Check for partial matches (e.g. Rajiv Chowk -> Rajiv Chowk [Conn: Yellow/Blue])
    val_lower = val.lower()
    for c in encoder.classes_:
        c_lower = c.lower()
        if val_lower in c_lower or c_lower in val_lower:
            return encoder.transform([c])[0]
            
    if default_val and default_val in encoder.classes_:
        return encoder.transform([default_val])[0]
        
    # Fallback to first class in label encoder to avoid crashes
    return encoder.transform([encoder.classes_[0]])[0]


def predict_crowd(data, db: Session = None):
    # 1. Crowd Count Regressor - Passenger count prediction
    encoded_data = {
        "Hour": data.hour,
        "Day_Name": safe_transform(encoders["Day_Name"], data.day_name),
        "Month": data.month,
        "Is_Holiday": int(data.is_holiday),
        "Weather": safe_transform(encoders["Weather"], data.weather),
        "From_Station": safe_transform(encoders["From_Station"], data.from_station),
        "To_Station": safe_transform(encoders["To_Station"], data.to_station),
        "Distance_km": data.distance_km,
        "Ticket_Type": safe_transform(encoders["Ticket_Type"], data.ticket_type),
        "Is_Interchange": int(data.is_interchange)
    }

    df = pd.DataFrame([encoded_data])
    prediction = int(crowd_regressor.predict(df)[0])

    if prediction < 1200:
        crowd_level = "Low"
    elif prediction < 2500:
        crowd_level = "Medium"
    elif prediction < 3500:
        crowd_level = "High"
    else:
        crowd_level = "Very High"

    # Base recommendations
    recommendations = get_recommendations(crowd_level)

    alert = generate_alert(
        predicted_passengers=prediction,
        crowd_level=crowd_level
    )

    # 2. Congestion Classifier - Peak/Off-peak categorization
    encoded_c = {
        "Hour": data.hour,
        "Day_Name": safe_transform(encoders["Day_Name"], data.day_name),
        "Month": data.month,
        "Is_Holiday": int(data.is_holiday),
        "Weather": safe_transform(encoders["Weather"], data.weather),
        "From_Station": safe_transform(encoders["From_Station"], data.from_station),
        "To_Station": safe_transform(encoders["To_Station"], data.to_station),
        "Distance_km": data.distance_km,
        "Is_Interchange": int(data.is_interchange)
    }
    df_c = pd.DataFrame([encoded_c])
    is_congested = int(congestion_classifier.predict(df_c)[0])
    congestion_status = "Congested" if is_congested == 1 else "Normal"

    # 3. Scheduling Optimizer - Headway and frequency logic
    # Find any active delays on the route or station (if DB session is provided)
    delay_min = 0
    if db:
        try:
            from app.models.train import Train
            from app.models.route import Route
            station_line = db.query(Station.line_name).filter(Station.station_name == data.from_station).first()
            if station_line:
                route = db.query(Route).filter(Route.route_name == station_line[0]).first()
                if route:
                    delayed_train = db.query(Train).filter(Train.route_id == route.route_id, Train.status == "Delayed").first()
                    if delayed_train:
                        delay_min = 12
        except Exception as e:
            print(f"Error checking schedule delay: {e}")

    scheduling_rec = optimize_schedule(
        predicted_passengers=prediction,
        crowd_level=crowd_level,
        capacity=1500,
        delay_min=delay_min
    )

    # 4. Passenger Demand Forecaster - Hourly demand forecasting (Next 3 Hours)
    # Query database for current lag ridership count if DB session is provided
    lag_value = 250
    if db:
        try:
            station_obj = db.query(Station).filter(Station.station_name == data.from_station).first()
            if station_obj:
                latest_p = db.query(PassengerData.passenger_count)\
                    .filter(PassengerData.station_id == station_obj.station_id)\
                    .order_by(PassengerData.travel_date.desc(), PassengerData.travel_time.desc())\
                    .first()
                if latest_p:
                    lag_value = latest_p[0]
        except Exception as e:
            print(f"Error getting lag value: {e}")

    forecasts = []
    current_lag = float(lag_value)
    for hour_offset in range(1, 4):
        target_hour = (data.hour + hour_offset) % 24
        encoded_step = {
            "Hour": target_hour,
            "Day_Name": safe_transform(encoders["Day_Name"], data.day_name),
            "Month": data.month,
            "Is_Holiday": int(data.is_holiday),
            "Weather": safe_transform(encoders["Weather"], data.weather),
            "From_Station": safe_transform(encoders["From_Station"], data.from_station),
            "Passenger_Lag_1": current_lag
        }
        df_step = pd.DataFrame([encoded_step])
        pred_step = max(50, int(demand_forecaster.predict(df_step)[0]))
        forecasts.append({
            "hour": target_hour,
            "predicted_demand": pred_step
        })
        current_lag = float(pred_step)

    return {
        "predicted_passengers": prediction,
        "crowd_level": crowd_level,
        "recommendations": recommendations,
        "alert": alert,
        "congestion_status": congestion_status,
        "scheduling_recommendation": scheduling_rec,
        "demand_forecast": forecasts
    }