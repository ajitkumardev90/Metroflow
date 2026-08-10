import sys
import os
import pytest
from datetime import datetime
from unittest.mock import patch
from fastapi.testclient import TestClient

# Add parent folder to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from app.middleware.auth import get_current_user

client = TestClient(app)


def test_home_endpoint():
    """
    Smoke test: Verify the home endpoint works and responds with correct status.
    """
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "Connected"


def test_db_test_endpoint():
    """
    Verify the DB connectivity check route is registered.
    """
    response = client.get("/db-test")
    assert response.status_code == 200
    assert "status" in response.json()


def test_predictions_endpoint():
    """
    Test Model A/B/C/D predictions pipeline.
    """
    payload = {
        "hour": 9,
        "day_name": "Monday",
        "month": 7,
        "is_holiday": False,
        "weather": "Clear",
        "from_station": "Kashmere Gate",
        "to_station": "Rajiv Chowk",
        "distance_km": 4.5,
        "ticket_type": "Smart Card",
        "is_interchange": True
    }
    
    response = client.post("/predict/", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    assert "predicted_passengers" in data
    assert "crowd_level" in data
    assert "congestion_status" in data
    assert "scheduling_recommendation" in data
    assert "demand_forecast" in data
    
    assert isinstance(data["predicted_passengers"], int)
    assert data["crowd_level"] in ["Low", "Medium", "High", "Very High"]
    assert data["congestion_status"] in ["Normal", "Congested"]
    
    rec = data["scheduling_recommendation"]
    assert "recommended_headway_minutes" in rec
    assert "recommended_frequency_trains_per_hour" in rec
    assert "train_allocation_adjustment" in rec


@patch("app.api.chat.ask_grok_copilot")
def test_grok_chat_simulation(mock_ask):
    """
    Test AI Copilot chat router under simulation mode.
    """
    mock_ask.return_value = "Simulated Copilot response"
    
    # Override dependency to mock authentication
    app.dependency_overrides[get_current_user] = lambda: {
        "fullName": "Test Operator",
        "role": "admin",
        "id": "60e1d51bc4b5b719488a0e8d"
    }

    payload = {
        "message": "Give me an operational summary of active trains",
        "history": []
    }
    
    response = client.post(
        "/ai/chat",
        json=payload,
        headers={"Authorization": "Bearer mock_token"}
    )
    assert response.status_code == 200
    assert "response" in response.json()
    assert "copilot" in response.json()["response"].lower() or "simulated" in response.json()["response"].lower()
    
    # Restore dependencies
    app.dependency_overrides.clear()


# =====================================================================
# EXPANDED UNIT & INTEGRATION TESTS
# =====================================================================

def test_auth_registration_and_login():
    """
    Test registration of a new operator, successful login, incorrect credentials login,
    and profile endpoint fetching with/without token.
    """
    import random
    rand_id = random.randint(1000, 9999)
    email = f"test_operator_{rand_id}@metroflow.ai"
    password = "password123"
    fullname = f"Test Operator {rand_id}"

    # 1. Register new user
    reg_payload = {
        "fullName": fullname,
        "email": email,
        "password": password
    }
    response = client.post("/auth/register", json=reg_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == email
    assert data["fullName"] == fullname
    assert data["role"] == "user"

    # 2. Login with correct credentials
    login_payload = {
        "email": email,
        "password": password
    }
    response = client.post("/auth/login", json=login_payload)
    assert response.status_code == 200
    login_data = response.json()
    assert login_data["success"] is True
    assert "token" in login_data
    token = login_data["token"]

    # 3. Login with incorrect credentials
    bad_login_payload = {
        "email": email,
        "password": "wrongpassword"
    }
    response = client.post("/auth/login", json=bad_login_payload)
    assert response.status_code == 401

    # 4. Fetch profile with valid token
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/auth/profile", headers=headers)
    assert response.status_code == 200
    profile_data = response.json()
    assert profile_data["email"] == email
    assert profile_data["role"] == "user"

    # 5. Fetch profile with invalid token
    bad_headers = {"Authorization": "Bearer badtoken"}
    response = client.get("/auth/profile", headers=bad_headers)
    assert response.status_code == 401


def test_stations_rbac_enforcement():
    """
    Test Role-Based Access Control (RBAC) on stations CRUD endpoints.
    - Admin: Full CRUD access.
    - Manager: Read & Update access.
    - User: Read only access.
    """
    station_payload = {
        "station_name": "Test Station Alpha",
        "line_name": "Yellow Line",
        "distance_from_start": 12.5,
        "opening_date": "2015-05-10",
        "station_layout": "Elevated",
        "latitude": 28.5678,
        "longitude": 77.1234,
        "is_interchange": False
    }

    # -- User Mode (Read-Only) --
    app.dependency_overrides[get_current_user] = lambda: {
        "fullName": "Normal User",
        "role": "user",
        "id": "user_id_1"
    }

    # Should fail to create
    res = client.post("/stations/", json=station_payload)
    assert res.status_code == 403

    # Should fail to delete or update
    res = client.put("/stations/1", json={"station_name": "Updated"})
    assert res.status_code == 403
    res = client.delete("/stations/1")
    assert res.status_code == 403

    # Should succeed to list/read
    res = client.get("/stations/")
    assert res.status_code == 200
    assert isinstance(res.json(), list)

    # -- Manager Mode (Read & Update) --
    app.dependency_overrides[get_current_user] = lambda: {
        "fullName": "Manager User",
        "role": "manager",
        "id": "manager_id_1"
    }

    # Should fail to create
    res = client.post("/stations/", json=station_payload)
    assert res.status_code == 403

    # Should succeed to update (assuming station with ID 1 exists from DB seeding)
    update_payload = {
        "station_name": "Kashmere Gate Updated",
        "line_name": "Red Line",
        "distance_from_start": 0.0,
        "opening_date": "2002-12-25",
        "station_layout": "Elevated",
        "latitude": 28.6675,
        "longitude": 77.2282,
        "is_interchange": True
    }
    res = client.put("/stations/1", json=update_payload)
    assert res.status_code in [200, 404]  # 404 is allowed if station 1 is missing, but 403 is NOT returned

    # Should fail to delete
    res = client.delete("/stations/1")
    assert res.status_code == 403

    # -- Admin Mode (Full Access) --
    app.dependency_overrides[get_current_user] = lambda: {
        "fullName": "Admin User",
        "role": "admin",
        "id": "admin_id_1"
    }

    # Should succeed to create
    res = client.post("/stations/", json=station_payload)
    assert res.status_code == 201
    created_id = res.json()["station_id"]

    # Should succeed to update
    res = client.put(f"/stations/{created_id}", json={"station_name": "Test Station Beta"})
    assert res.status_code == 200

    # Should succeed to delete
    res = client.delete(f"/stations/{created_id}")
    assert res.status_code == 200

    # Restore overrides
    app.dependency_overrides.clear()


@patch("app.api.alerts.fetch_system_alerts")
@patch("app.api.alerts.create_system_alert")
@patch("app.api.alerts.resolve_system_alert")
def test_alerts_crud_and_ws_broadcast(mock_resolve, mock_create, mock_fetch):
    """
    Test alert trigger, listing, and resolution endpoints.
    - Admin/Manager can create alerts.
    - Normal user cannot create alerts.
    """
    mock_alerts = []
    
    def side_effect_create(alert_type, severity, message, station_id=None, train_id=None):
        alert = {
            "id": "mock-alert-id",
            "type": alert_type,
            "severity": severity,
            "message": message,
            "station_id": station_id,
            "train_id": train_id,
            "resolved": False,
            "created_at": datetime.utcnow()
        }
        mock_alerts.append(alert)
        return alert

    mock_create.side_effect = side_effect_create
    mock_fetch.side_effect = lambda limit=50, unresolved_only=False: mock_alerts
    mock_resolve.side_effect = lambda alert_id: True

    alert_payload = {
        "alert_type": "Overcrowding",
        "severity": "High",
        "message": "Overcrowding detected at Rajiv Chowk platform 1",
        "station_id": 1
    }

    # User cannot create
    app.dependency_overrides[get_current_user] = lambda: {"role": "user", "id": "1"}
    res = client.post("/alerts/", json=alert_payload)
    assert res.status_code == 403

    # Manager can create
    app.dependency_overrides[get_current_user] = lambda: {"role": "manager", "id": "2"}
    res = client.post("/alerts/", json=alert_payload)
    assert res.status_code == 201
    created_alert = res.json()
    alert_id = created_alert["id"]

    # User can read alerts
    app.dependency_overrides[get_current_user] = lambda: {"role": "user", "id": "1"}
    res = client.get("/alerts/")
    assert res.status_code == 200
    assert len(res.json()) > 0

    # User cannot resolve
    res = client.put(f"/alerts/{alert_id}/resolve", json={"resolved": True})
    assert res.status_code == 403

    # Manager can resolve
    app.dependency_overrides[get_current_user] = lambda: {"role": "manager", "id": "2"}
    res = client.put(f"/alerts/{alert_id}/resolve", json={"resolved": True})
    assert res.status_code == 200

    app.dependency_overrides.clear()


def test_analytics_and_prediction_history():
    """
    Verify analytics dashboards summaries, trends and prediction history endpoints work correctly.
    """
    app.dependency_overrides[get_current_user] = lambda: {"role": "admin", "id": "admin_user"}

    # Fetch analytics summary
    res = client.get("/analytics/summary")
    assert res.status_code == 200
    assert "total_stations" in res.json()
    assert "latest_alerts" in res.json()

    # Fetch station performance
    res = client.get("/analytics/station-performance")
    assert res.status_code == 200
    assert isinstance(res.json(), list)

    # Fetch ridership trends
    res = client.get("/analytics/trends")
    assert res.status_code == 200
    assert isinstance(res.json(), list)

    # Fetch prediction history
    res = client.get("/prediction-history/")
    assert res.status_code == 200
    history_data = res.json()
    assert "total_records" in history_data
    assert isinstance(history_data["data"], list)

    app.dependency_overrides.clear()


@patch("app.api.chat.ask_grok_copilot")
def test_chat_rate_limiting(mock_ask):
    """
    Verify the rate-limiting on the chatbot chat endpoint.
    Exceeding the threshold (10 requests) returns a 429 status code.
    """
    mock_ask.return_value = "Simulated response"
    
    app.dependency_overrides[get_current_user] = lambda: {
        "fullName": "Test Operator",
        "role": "admin",
        "id": "rate_limited_test_user"
    }

    # Reset in-memory rate limiter for the user to ensure test starts fresh
    from app.api.chat import local_rate_limit_db, local_rate_limit_lock
    with local_rate_limit_lock:
        if "rate_limited_test_user" in local_rate_limit_db:
            del local_rate_limit_db["rate_limited_test_user"]

    payload = {
        "message": "Hello AI",
        "history": []
    }

    # Trigger 10 requests which should succeed or return 200/500/etc. (not 429)
    for _ in range(10):
        res = client.post("/ai/chat", json=payload)
        assert res.status_code != 429

    # 11th request should be rate-limited
    res = client.post("/ai/chat", json=payload)
    assert res.status_code == 429
    assert "too many requests" in res.json()["detail"].lower()

    app.dependency_overrides.clear()


def test_every_followup_intents():
    """
    Verify all follow-up conversational intents and states in the simulation fallback.
    """
    with patch.dict(os.environ, {"XAI_API_KEY": "", "GEMINI_API_KEY": ""}):
        app.dependency_overrides[get_current_user] = lambda: {
            "fullName": "Test Operator",
            "role": "admin",
            "id": "test_operator_id"
        }

        # Case 1: Alert + Announcement Draft Confirmation (yes/yess)
        payload_1 = {
            "message": "yess",
            "history": [
                {"sender": "user", "text": "Are there any active alerts?"},
                {"sender": "assistant", "text": "Active system notifications:\n- [Critical] every train wii be stoped for few mintues due to some technical issue\n\nLet me know if you would like me to draft an announcement."}
            ]
        }
        response_1 = client.post("/ai/chat", json=payload_1)
        assert response_1.status_code == 200
        reply_1 = response_1.json()["response"]
        assert "📢 **SYSTEM ANNOUNCEMENT: SERVICE SUSPENSION**" in reply_1

        # Case 2: Delays + Solution/Action
        payload_2 = {
            "message": "how to resolve",
            "history": [
                {"sender": "user", "text": "Show active train delays"},
                {"sender": "assistant", "text": "Active delays: T-AQU7-02 (Aqua Line), T-GRA11-05 (Gray Line), Red Line delays."}
            ]
        }
        response_2 = client.post("/ai/chat", json=payload_2)
        assert response_2.status_code == 200
        reply_2 = response_2.json()["response"]
        assert "standby trains" in reply_2 or "headways" in reply_2

        # Case 3: Congestion + Location
        payload_3 = {
            "message": "where are they",
            "history": [
                {"sender": "user", "text": "List congested stations"},
                {"sender": "assistant", "text": "Congested stations include Kashmere Gate, Noida Sector 145, Shadipur."}
            ]
        }
        response_3 = client.post("/ai/chat", json=payload_3)
        assert response_3.status_code == 200
        reply_3 = response_3.json()["response"]
        assert "Kashmere Gate" in reply_3 or "IGI Airport" in reply_3

        app.dependency_overrides.clear()



def test_generate_report_endpoint():
    """
    Test generating reports with various mock user permissions.
    """
    # 1. Test user role cannot generate report (requires admin or manager)
    app.dependency_overrides[get_current_user] = lambda: {
        "fullName": "Normal User",
        "role": "user",
        "id": "user_id_1"
    }
    
    response = client.get("/reports/generate")
    assert response.status_code == 403
    
    # 2. Test manager role can generate report
    app.dependency_overrides[get_current_user] = lambda: {
        "fullName": "Manager User",
        "role": "manager",
        "id": "manager_id_1"
    }
    
    response = client.get("/reports/generate?report_type=System+Summary")
    assert response.status_code == 200
    
    data = response.json()
    assert "report_id" in data
    assert "generated_at" in data
    assert "summary_metrics" in data
    assert "predictions_log" in data
    assert "station_metrics" in data
    assert "route_metrics" in data
    assert "active_alerts" in data
    assert "ai_insights" in data
    
    app.dependency_overrides.clear()


