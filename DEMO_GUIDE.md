# MetroFlow AI: Visual Verification Demo Guide

Follow this step-by-step walkthrough to verify all core platform features.

---

## 💻 Step 1: Signin Gateway
1. Open the UI at `http://localhost:3000`.
2. Enter the Administrator credentials:
   - **Email**: `admin@metroflow.ai`
   - **Password**: `admin123`
3. Click **Authenticate Connection** to log in. You are redirected to the Operations Command Center.

---

## 📊 Step 2: Telemetry Dashboard
1. Review the top header:
   - Verify that **Telemetry Link** shows **ACTIVE**.
   - Check the **Active Alerts** indicator.
2. Review the KPI Cards:
   - View active train counts and passenger flow metrics.
3. Review the charts:
   - Check the **Ridership Flow Trends** line chart (Recharts).
   - Check the **Line Performance** bar chart colored by line themes.
4. Review the grounded **Real-Time Copilot Report** at the top of the dashboard.

---

## 🗺️ Step 3: Geographic Crowd Heatmap
1. Click **Live Heatmap** in the header or sidebar.
2. The Leaflet map will render in dark mode.
3. Hover over/click circle markers to view station popups displaying current line names, coordinate details, and simulated passenger counts colored by density.

---

## 🚆 Step 4: Line & Rolling Stock Delay Test
1. Select **Trains** in the sidebar.
2. Find any active train (e.g. `T-YEL-01` or another train).
3. Click the **Refresh (Toggle Status)** button on that row.
4. Change status from `Active` to `Delayed`.
5. Navigate to **Alerts Center** in the sidebar:
   - Verify that a new delay warning has been broadcasted automatically.
6. Return to the main **Dashboard**:
   - Verify that the top header delay count has updated.
   - The AI Copilot summary will now list the delayed train numbers.

---

## 🔮 Step 5: AI Scenario Simulator
1. Navigate to **AI Predictions** in the sidebar.
2. Configure travel segment inputs (e.g., set Hour to `9`, Weather to `Rain`, interchange check to true).
3. Click **Run Inference Pipeline**:
   - View predicted segment passenger loads (via Crowd Count Regressor).
   - View binary congestion classification status (via Congestion Classifier).
   - View headway recommendations and train allocations (via Scheduling Optimizer).
4. Click **Explain with Grok Copilot**:
   - This redirects you to the AI Assistant chat, pre-populating and auto-sending a natural language analysis request grounded in the prediction metrics.

---

## 💬 Step 6: conversational AI Copilot
1. Navigate to **AI Assistant** in the sidebar.
2. Query the chatbot, for example: *"What is the status of delayed trains on the network?"*
3. The assistant will retrieve database stats, analyze active delays, and provide grounded corrective actions.
