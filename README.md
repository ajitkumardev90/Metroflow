# MetroFlow AI: Intelligent Crowd Management & Scheduling Platform

MetroFlow AI is a state-of-the-art Metro Crowd Management and Scheduling Command Center. It integrates scikit-learn machine learning regression/classification models (HistGradientBoosting) and a grounded LLM (xAI Grok Copilot) to predict crowd density, forecast demand, optimize transit frequencies, alert operators of congestion, and allow natural language analysis of station telemetry.

---

## 🚀 Key Features

1. **User Identity & RBAC (MongoDB)**
   - Role-Based Access Control enforcing permission limits on three tiers: `admin` (System Administrator), `manager` (Traffic Manager), and `user` (Passenger Observer).
   - Auto-provisioning of demo operator credentials on first signin for seamless evaluation.
   
2. **Real-time Telemetry & GIS (PostgreSQL & Leaflet)**
   - Tracks 285 stations, 14 transit lines, 56 trains, and thousands of schedules.
   - Beautiful dark-themed **AI Smart City Metro Operations Command Center** dashboard with live telemetry indicators (delays, active alerts, total ridership counts).
   - Live Leaflet-based Geographic Heatmap highlighting station crowd densities.

3. **Machine Learning Pipeline (scikit-learn Models)**
   - **Crowd Count Regressor**: Predicting segment passenger count. Shrunk model pickle file size from 4.3 GB to **552 KB** with MAE = 100.06 and R² = 0.9790.
   - **Passenger Demand Forecaster**: Sequentially projects station passenger counts for the next 3 hours using lag-shift features. R² = 0.8826.
   - **Congestion Classifier**: Predicts threshold overcrowding status. Accuracy = 94.66%, F1 = 0.9634.
   - **Scheduling Optimizer**: Rule-based headway, frequency, and train allocation calculations.
   
4. **AI Metro Copilot (xAI Grok Grounding)**
   - Grounded LLM Chat Assistant utilizing live database telemetry (active alerts, congested stations, delayed train numbers) to ground its responses, falling back to simulated templates if keys are unconfigured.

---

## 🛠️ Tech Stack

- **Backend**: FastAPI, SQLAlchemy (PostgreSQL), PyMongo (MongoDB), Redis Cache, Joblib, scikit-learn.
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Recharts, React Leaflet.
- **Containers**: Docker, Docker Compose.

---

## 📂 Project Structure

```
metroflow-ai/
├── backend/
│   ├── ai/                      # ML Pipelines, datasets, and training code
│   │   ├── models/              # Trained Regressor/Classifier PKL artifacts
│   │   └── train_model.py       # scikit-learn training script
│   ├── app/
│   │   ├── api/                 # FastAPI routes (auth, stations, predictions)
│   │   ├── database/            # Postgres, MongoDB, and Redis client setups
│   │   ├── middleware/          # JWT and RBAC validations
│   │   ├── repositories/        # SQL/NoSQL DB aggregation queries
│   │   └── services/            # Model orchestrations & Grok groundings
│   └── tests/                   # pytest suite covering prediction models & routers
├── frontend/
│   ├── src/
│   │   ├── app/                 # Next.js pages (dashboard, heatmap, predictions)
│   │   ├── components/          # Sidebar layouts and Leaflet map wrappers
│   │   └── utils/               # Axios/Fetch API client
│   └── Dockerfile
├── docker-compose.yml           # Multi-container orchestration
└── README.md
```

---

## 📦 Quick Start Guide

Refer to [DEPLOYMENT.md](file:///c:/Users/ajitk/OneDrive/Desktop/metroflow%20ai/DEPLOYMENT.md) for local setup, Docker build commands, and demo credentials.
Refer to [ML_MODELS.md](file:///c:/Users/ajitk/OneDrive/Desktop/metroflow%20ai/ML_MODELS.md) for training history and metrics evaluation.
Refer to [API_TESTING.md](file:///c:/Users/ajitk/OneDrive/Desktop/metroflow%20ai/API_TESTING.md) for route testing and validation parameters.
Refer to [DEMO_GUIDE.md](file:///c:/Users/ajitk/OneDrive/Desktop/metroflow%20ai/DEMO_GUIDE.md) for validation workflows.
