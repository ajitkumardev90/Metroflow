# 🚀 MetroFlow AI: Production Deployment Guide

This guide details how to deploy MetroFlow AI to production using **Vercel** (Frontend) and **Render** or **Railway** (Backend & PostgreSQL).

---

## 🏗️ Architecture Overview

```mermaid
graph LR
    User([commuters & operators]) --> Vercel[Vercel: Next.js Frontend]
    Vercel -->|HTTPS API Requests| Render[Render: FastAPI Backend Engine]
    Render --> PG[(Render: Managed PostgreSQL)]
    Render --> Mongo[(MongoDB Atlas: Users & Auth)]
    Render --> Gemini[Google Gemini AI: MetroMind]
```

---

## 🔑 Demo Operator Access Credentials

The demo accounts are pre-seeded in the database and authenticate automatically on login:

| Role | Email | Password | Access Tier |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin@metroflow.ai` | `admin123` | Full control: schedules, models, overrides |
| **Traffic Manager** | `manager@metroflow.ai` | `manager123` | Route performance, alerts, analytics |
| **Passenger Observer** | `user@metroflow.ai` | `user123` | Telemetry map, heatmap, route search |

---

## 📦 Part 1: Deploy Backend & PostgreSQL (Render)

Render provides free hosting for both the FastAPI web service and a managed PostgreSQL database.

### Option A: 1-Click Blueprint (Recommended)

1. Push your latest code to GitHub:
   ```bash
   git add .
   git commit -m "Configure production deployment and Gemini engine"
   git push origin main
   ```
2. Log into [Render.com](https://dashboard.render.com).
3. Click **New +** > **Blueprint**.
4. Select your `Metroflow` GitHub repository.
5. Render reads [render.yaml](file:///c:/Users/ajitk/OneDrive/Desktop/Platform-for-Metro-Crowd-Management-and-Scheduling/render.yaml) and automatically creates:
   - **`metroflow-postgres`**: Managed PostgreSQL Database
   - **`metroflow-backend`**: FastAPI Web Service with Python 3.11
6. In the Render Dashboard under **Environment Variables**, fill in:
   - `GEMINI_API_KEY`: Your Google Gemini API Key
   - `MONGODB_URI`: `mongodb+srv://ajitkumardev90_db_user:metroflow90060@metroflowcluster.eqgpg5i.mongodb.net/metroflow?retryWrites=true&w=majority`
7. Click **Apply**.
8. Once built, copy your backend URL (e.g. `https://metroflow-backend.onrender.com`).
   *Note: On first startup, the backend automatically seeds all 286 stations and routes into the PostgreSQL database.*

### Option B: Manual Web Service on Render

If not using blueprints:
1. **Create Database**: Click **New +** > **PostgreSQL Database** named `metroflow`. Copy the **Internal Database URL**.
2. **Create Web Service**: Click **New +** > **Web Service**.
   - **Root Directory**: `backend`
   - **Environment**: `Python`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Environment Variables**:
     - `DATABASE_URL`: *(paste PostgreSQL URL)*
     - `MONGODB_URI`: `mongodb+srv://ajitkumardev90_db_user:metroflow90060@metroflowcluster.eqgpg5i.mongodb.net/metroflow?retryWrites=true&w=majority`
     - `GEMINI_API_KEY`: *(your Gemini key)*
     - `JWT_SECRET`: `metroflow_super_secret_key`
     - `JWT_EXPIRES_IN`: `7d`
     - `PYTHON_VERSION`: `3.11.9`

---

## 🌐 Part 2: Deploy Frontend UI (Vercel)

Vercel provides edge hosting for Next.js applications.

1. Log into [Vercel.com](https://vercel.com).
2. Click **Add New...** > **Project**.
3. Import your `Metroflow` GitHub repository.
4. In the project setup screen:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click *Edit* and select `frontend`
5. Expand **Environment Variables** and add:
   - **`NEXT_PUBLIC_API_URL`**: Your deployed backend URL from Part 1 (e.g. `https://metroflow-backend.onrender.com`)
   *(Do NOT include a trailing slash)*
6. Click **Deploy**.
7. Vercel will build the frontend and provide your live URL (e.g. `https://metroflow.vercel.app`).

---

## 🚂 Alternative: Deploy Backend on Railway

If you prefer Railway instead of Render:

1. Log into [Railway.app](https://railway.app).
2. Click **New Project** > **Provision PostgreSQL**.
3. Click **Add Service** > **GitHub Repo** > Select `Metroflow`.
4. In Service Settings:
   - Set **Root Directory**: `/backend`
   - Railway automatically uses the bundled `Procfile` (`uvicorn app.main:app --host 0.0.0.0 --port $PORT`).
5. In Variables, add:
   - `DATABASE_URL`: `${{Postgres.DATABASE_URL}}`
   - `MONGODB_URI`: `mongodb+srv://ajitkumardev90_db_user:metroflow90060@metroflowcluster.eqgpg5i.mongodb.net/metroflow?retryWrites=true&w=majority`
   - `GEMINI_API_KEY`: *(your Gemini key)*
   - `JWT_SECRET`: `metroflow_super_secret_key`
6. Click **Generate Domain** to get your public backend URL.
7. Use that URL as `NEXT_PUBLIC_API_URL` in Vercel.

---

## ✅ Post-Deployment Verification Checklist

Once both services are deployed:

1. **Backend Health Check**:
   - Open `https://your-backend.onrender.com/` -> Should return `{"status": "Connected"}`.
   - Open `https://your-backend.onrender.com/docs` -> Verify Swagger API documentation loads.
   - Open `https://your-backend.onrender.com/db-test` -> Verify PostgreSQL connection returns `"status": "PostgreSQL Connected"`.
2. **Frontend UI Check**:
   - Open your Vercel URL `https://your-app.vercel.app`.
   - Log in with `admin@metroflow.ai` / `admin123`.
   - Verify dashboard telemetry loads without delay.
   - Open `/assistant` and test MetroMind: ask *"Show active train delays"* (verify sub-second response).
   - Test Crowd Prediction at `/predictions` (verify HistGradientBoosting models return predictions).
