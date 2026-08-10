export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5001";

// Helper to get auth headers
const getHeaders = (contentType: string = "application/json") => {
  const headers: Record<string, string> = {};
  if (contentType) {
    headers["Content-Type"] = contentType;
  }
  
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("metroflow_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return headers;
};

// Generic request wrapper
async function request(path: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${path}`;
  const headers = {
    ...getHeaders((options.body && !(options.body instanceof FormData)) ? "application/json" : ""),
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401 || (response.status === 404 && path === "/auth/profile")) {
    // Session expired/invalid or user not found -> clear token and redirect
    if (typeof window !== "undefined") {
      localStorage.removeItem("metroflow_token");
      localStorage.removeItem("metroflow_user");
      window.location.href = "/login";
    }
    throw new Error(response.status === 404 ? "User not found. Logging out..." : "Unauthorized. Logging out...");
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || "An error occurred");
  }
  return data;
}

// ==========================================
// API Operations
// ==========================================
export const api = {
  // 1. Authentication
  auth: {
    register: (payload: any) => request("/auth/register", { method: "POST", body: JSON.stringify(payload) }),
    login: (payload: any) => request("/auth/login", { method: "POST", body: JSON.stringify(payload) }),
    getProfile: () => request("/auth/profile"),
    getUsers: () => request("/auth/users"),
    changeRole: (userId: string, role: string) => request("/auth/change-role", {
      method: "PATCH",
      body: JSON.stringify({ userId, role })
    }),
    deleteUser: (userId: string) => request(`/auth/users/${userId}`, { method: "DELETE" }),
  },

  // 2. Stations
  stations: {
    list: () => request("/stations/"),
    get: (id: number) => request(`/stations/${id}`),
    create: (payload: any) => request("/stations/", { method: "POST", body: JSON.stringify(payload) }),
    update: (id: number, payload: any) => request(`/stations/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
    delete: (id: number) => request(`/stations/${id}`, { method: "DELETE" }),
  },

  // 3. Routes
  routes: {
    list: () => request("/routes/"),
    get: (id: number) => request(`/routes/${id}`),
    create: (payload: any) => request("/routes/", { method: "POST", body: JSON.stringify(payload) }),
    update: (id: number, payload: any) => request(`/routes/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
    delete: (id: number) => request(`/routes/${id}`, { method: "DELETE" }),
  },

  // 4. Trains
  trains: {
    list: () => request("/trains/"),
    get: (id: number) => request(`/trains/${id}`),
    create: (payload: any) => request("/trains/", { method: "POST", body: JSON.stringify(payload) }),
    update: (id: number, payload: any) => request(`/trains/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
    delete: (id: number) => request(`/trains/${id}`, { method: "DELETE" }),
  },

  // 5. Schedules
  schedules: {
    list: () => request("/train-schedules/"),
    get: (id: number) => request(`/train-schedules/${id}`),
    create: (payload: any) => request("/train-schedules/", { method: "POST", body: JSON.stringify(payload) }),
    update: (id: number, payload: any) => request(`/train-schedules/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
    delete: (id: number) => request(`/train-schedules/${id}`, { method: "DELETE" }),
  },

  // 6. Passenger & Operational Records
  passengerData: {
    list: (params: Record<string, any> = {}) => {
      const q = new URLSearchParams(Object.fromEntries(
        Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== "")
      ) as any).toString();
      return request(`/passenger-data/${q ? "?" + q : ""}`);
    },
    get: (id: number) => request(`/passenger-data/${id}`),
    create: (payload: any) => request("/passenger-data/", { method: "POST", body: JSON.stringify(payload) }),
    update: (id: number, payload: any) => request(`/passenger-data/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
    delete: (id: number) => request(`/passenger-data/${id}`, { method: "DELETE" }),
  },

  // 7. AI Prediction
  predict: {
    run: (payload: any) => request("/predict/", { method: "POST", body: JSON.stringify(payload) }),
    history: (params: any = {}) => {
      const q = new URLSearchParams(Object.fromEntries(
        Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== "")
      ) as any).toString();
      return request(`/prediction-history/${q ? "?" + q : ""}`);
    },
    deleteHistory: (id: number) => request(`/prediction-history/${id}`, { method: "DELETE" }),
  },

  // 8. Alerts & Announcements
  alerts: {
    list: (unresolvedOnly = false) => request(`/alerts/${unresolvedOnly ? "?unresolved_only=true" : ""}`),
    create: (payload: any) => request("/alerts/", { method: "POST", body: JSON.stringify(payload) }),
    resolve: (id: string) => request(`/alerts/${id}/resolve`, { method: "PUT", body: JSON.stringify({ resolved: true }) }),
  },

  // 9. Operational Analytics
  analytics: {
    summary: () => request("/analytics/summary"),
    stationPerformance: () => request("/analytics/station-performance"),
    routePerformance: () => request("/analytics/route-performance"),
    trends: () => request("/analytics/trends"),
  },

  // Reports
  reports: {
    generate: (params: any = {}) => {
      const q = new URLSearchParams(Object.fromEntries(
        Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== "")
      ) as any).toString();
      return request(`/reports/generate?${q}`);
    }
  },

  // 10. AI Chat Assistant
  assistant: {
    chat: (message: string, history: Array<any> = []) => request("/ai/chat", {
      method: "POST",
      body: JSON.stringify({ message, history })
    }),
  }
};
