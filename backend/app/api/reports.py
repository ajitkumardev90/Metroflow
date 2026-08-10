import random
from datetime import datetime
from typing import Optional, List, Any
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from app.database.postgres import get_db
from app.middleware.auth import require_roles
from app.models.prediction_history import PredictionHistory
from app.repositories.analytics_repository import get_station_performance_metrics, get_route_performance_metrics
from app.services.alert_service import fetch_system_alerts
from app.services.grok_service import ask_grok_copilot

router = APIRouter(
    prefix="/reports",
    tags=["Reports"]
)

@router.get("/generate")
def generate_report(
    report_type: str = Query("System Summary"),
    station: Optional[str] = None,
    crowd_level: Optional[str] = None,
    alert_severity: Optional[str] = None,
    current_user=Depends(require_roles(["admin", "manager"])),
    db: Session = Depends(get_db)
):
    try:
        # 1. Fetch matching predictions history for this report
        query = db.query(PredictionHistory)
        if station:
            query = query.filter(
                or_(
                    PredictionHistory.from_station.ilike(f"%{station}%"),
                    PredictionHistory.to_station.ilike(f"%{station}%")
                )
            )
        if crowd_level:
            query = query.filter(
                PredictionHistory.crowd_level.ilike(f"%{crowd_level}%")
            )
        if alert_severity:
            query = query.filter(
                PredictionHistory.alert_severity.ilike(f"%{alert_severity}%")
            )
            
        predictions = query.order_by(PredictionHistory.prediction_time.desc()).all()
        
        # 2. Compute aggregate metrics
        total_predictions = len(predictions)
        avg_passengers = 0.0
        peak_passengers = 0
        congested_count = 0
        alert_count = 0
        
        if total_predictions > 0:
            avg_passengers = sum(p.predicted_passengers for p in predictions) / total_predictions
            peak_passengers = max(p.predicted_passengers for p in predictions)
            congested_count = sum(1 for p in predictions if p.crowd_level in ["High", "Very High"])
            alert_count = sum(1 for p in predictions if p.alert_status)
            
        congestion_ratio = (congested_count / total_predictions * 100) if total_predictions > 0 else 0.0
        
        # 3. Get station and route metrics for system scope
        station_metrics = []
        route_metrics = []
        try:
            station_metrics = get_station_performance_metrics(db)[:5]  # Top 5
            route_metrics = get_route_performance_metrics(db)
        except Exception as e:
            print("Failed to fetch station/route metrics for report:", e)
            
        # 4. Get active alerts
        active_alerts = []
        try:
            alerts = fetch_system_alerts(limit=10, unresolved_only=True)
            for a in alerts:
                active_alerts.append({
                    "id": str(a.get("_id", "")),
                    "alert_type": a.get("alert_type", "Operational"),
                    "severity": a.get("severity", "Medium"),
                    "message": a.get("message", ""),
                    "station_name": a.get("station_name", "N/A"),
                    "created_at": a.get("created_at")
                })
        except Exception as e:
            print("Failed to fetch alerts for report:", e)
            
        # 5. Generate AI insights from Grok / Copilot
        telemetry = {
            "total_predictions": total_predictions,
            "avg_passengers": round(avg_passengers, 1),
            "peak_passengers": peak_passengers,
            "congested_count": congested_count,
            "alert_count": alert_count,
            "report_type": report_type
        }
        
        grok_prompt = (
            f"Generate a professional, concise executive summary for a Metro Operations report. "
            f"Report Type: {report_type}. Telemetry context: Total predictions: {total_predictions}, "
            f"Average predicted passenger density: {telemetry['avg_passengers']}, Peak predicted passengers: {peak_passengers}, "
            f"Congestion incidents: {congested_count}, Alerts triggered: {alert_count}. "
            f"Outline operational directives and scheduling adjustments needed. Keep under 120 words."
        )
        
        try:
            ai_insights = ask_grok_copilot(
                db=db,
                message=grok_prompt,
                role="manager",
                user_name=current_user.get("fullName", "Operator")
            )
        except Exception as e:
            ai_insights = (
                f"Operational report summary: System analyzed under scope '{report_type}'. "
                f"Telemetry records {total_predictions} prediction inquiries. Mean load is {telemetry['avg_passengers']} passengers. "
                f"Line headways should be adjusted to { '5 minutes' if congested_count > 0 else '8 minutes' } on high-demand routes. "
                f"Operational readiness: nominal."
            )
            
        # 6. Generate report metadata
        report_id = f"REP-{datetime.now().strftime('%Y%m%d')}-{random.randint(1000, 9999)}"
        
        # Serialize predictions log so standard datetime matches JSON format in fastapi return
        predictions_serialized = []
        for p in predictions:
            predictions_serialized.append({
                "prediction_id": p.prediction_id,
                "prediction_time": p.prediction_time.isoformat() if p.prediction_time else datetime.now().isoformat(),
                "from_station": p.from_station,
                "to_station": p.to_station,
                "hour": p.hour,
                "day_name": p.day_name,
                "month": p.month,
                "weather": p.weather,
                "ticket_type": p.ticket_type,
                "is_holiday": p.is_holiday,
                "is_interchange": p.is_interchange,
                "distance_km": p.distance_km,
                "predicted_passengers": p.predicted_passengers,
                "crowd_level": p.crowd_level,
                "recommendations": p.recommendations,
                "alert_status": p.alert_status,
                "alert_severity": p.alert_severity,
                "alert_type": p.alert_type,
                "alert_message": p.alert_message
            })

        return {
            "report_id": report_id,
            "generated_at": datetime.now().isoformat(),
            "operator_name": current_user.get("fullName", "System Operator"),
            "filters": {
                "report_type": report_type,
                "station": station,
                "crowd_level": crowd_level,
                "alert_severity": alert_severity
            },
            "summary_metrics": {
                "total_predictions": total_predictions,
                "avg_predicted_passengers": round(avg_passengers, 1),
                "peak_predicted_passengers": peak_passengers,
                "congestion_ratio": round(congestion_ratio, 1),
                "alert_count": alert_count
            },
            "predictions_log": predictions_serialized,
            "station_metrics": station_metrics,
            "route_metrics": route_metrics,
            "active_alerts": active_alerts,
            "ai_insights": ai_insights
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Report generation failed: {str(e)}"
        )
