"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Map,
  Activity,
  Milestone,
  Train,
  Clock,
  Cpu,
  TrendingUp,
  AlertTriangle,
  MessageSquareCode,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  CheckCircle,
  History,
  FileText
} from "lucide-react";
import { api, API_BASE_URL } from "@/utils/api";

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  roles: string[];
}

const navigationItems: SidebarItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "manager", "user"] },
  { name: "Crowd Monitoring", href: "/stations", icon: Activity, roles: ["admin", "manager", "user"] },
  { name: "Crowd Heatmap", href: "/heatmap", icon: Map, roles: ["admin", "manager", "user"] },
  { name: "Routes", href: "/routes", icon: Milestone, roles: ["admin", "manager", "user"] },
  { name: "Trains", href: "/trains", icon: Train, roles: ["admin", "manager", "user"] },
  { name: "Scheduling", href: "/scheduling", icon: Clock, roles: ["admin", "manager", "user"] },
  { name: "AI Predictions", href: "/predictions", icon: Cpu, roles: ["admin", "manager", "user"] },
  { name: "Prediction History", href: "/history", icon: History, roles: ["admin", "manager", "user"] },
  { name: "Demand Forecast", href: "/forecast", icon: TrendingUp, roles: ["admin", "manager", "user"] },
  { name: "Analytics", href: "/analytics", icon: LayoutDashboard, roles: ["admin", "manager"] },
  { name: "Report Generator", href: "/reports", icon: FileText, roles: ["admin", "manager"] },
  { name: "Alerts Center", href: "/alerts", icon: AlertTriangle, roles: ["admin", "manager", "user"] },
  { name: "MetroMind AI", href: "/assistant", icon: MessageSquareCode, roles: ["admin", "manager", "user"] },
  { name: "Admin Panel", href: "/admin", icon: Users, roles: ["admin"] },
  { name: "Profile Settings", href: "/profile", icon: Settings, roles: ["admin", "manager", "user"] },
];

export default function CommandCenterLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState<{ fullName: string; email: string; role: string; id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [alertsCount, setAlertsCount] = useState(0);
  const [delayedCount, setDelayedCount] = useState(0);
  const [toasts, setToasts] = useState<any[]>([]);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimeout: any;

    const connectWS = () => {
      let wsUrl = "ws://127.0.0.1:5001/ws/updates";
      try {
        const base = API_BASE_URL.startsWith("http")
          ? API_BASE_URL
          : (typeof window !== "undefined" ? `${window.location.protocol}//${window.location.host}${API_BASE_URL}` : "");
        if (base) {
          const url = new URL(base);
          const protocol = url.protocol === "https:" ? "wss:" : "ws:";
          wsUrl = `${protocol}//${url.host}/ws/updates`;
        }
      } catch (e) {
        console.warn("Failed to parse API_BASE_URL for WebSocket:", e);
      }
      console.log("[DEBUG] WebSocket target URL is:", wsUrl);
      ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log("WebSocket linked successfully to MetroFlow core updates at", wsUrl);
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.event === "new_alert") {
            const toastId = Math.random().toString(36).substring(2, 9);
            const alertData = payload.data;
            
            // Add toast
            setToasts(prev => [...prev, { ...alertData, id: toastId }]);
            
            // Increment alertsCount dynamically
            setAlertsCount(prev => prev + 1);

            // Auto dismiss toast after 6 seconds
            setTimeout(() => {
              removeToast(toastId);
            }, 6000);
          }
        } catch (e) {
          console.error("Failed to parse WS payload:", e);
        }
      };

      ws.onclose = (event) => {
        console.log(`WebSocket telemetry links disconnected (code: ${event.code}, reason: ${event.reason}). Retrying connection...`);
        reconnectTimeout = setTimeout(connectWS, 4000);
      };

      ws.onerror = (err) => {
        console.warn(`WebSocket telemetry link warning for URL ${wsUrl}:`, err);
        ws.close();
      };
    };

    connectWS();

    return () => {
      if (ws) ws.close();
      clearTimeout(reconnectTimeout);
    };
  }, []);

  // Authentication and role synchronization check
  useEffect(() => {
    const token = localStorage.getItem("metroflow_token");
    const storedUser = localStorage.getItem("metroflow_user");

    if (!token || !storedUser) {
      localStorage.removeItem("metroflow_token");
      localStorage.removeItem("metroflow_user");
      router.push("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setLoading(false);

      // Fetch fresh profile from backend to sync role changes
      const syncProfile = async () => {
        try {
          const freshUser = await api.auth.getProfile();
          localStorage.setItem("metroflow_user", JSON.stringify(freshUser));
          setUser(freshUser);
        } catch (err: any) {
          console.error("Failed to sync operator profile role:", err);
          if (err.message && (err.message.includes("User not found") || err.message.includes("Unauthorized"))) {
            localStorage.removeItem("metroflow_token");
            localStorage.removeItem("metroflow_user");
            router.push("/login");
          }
        }
      };
      syncProfile();
    } catch (e) {
      localStorage.removeItem("metroflow_token");
      localStorage.removeItem("metroflow_user");
      router.push("/login");
    }
  }, [router]);

  // Fetch alerts and rolling stock details for header
  useEffect(() => {
    if (!user) return;
    
    const fetchTelemetry = async () => {
      try {
        const summary = await api.analytics.summary();
        setDelayedCount(summary.delayed_trains || 0);
        
        const activeAlerts = await api.alerts.list(true);
        setAlertsCount(activeAlerts.length);
      } catch (err) {
        console.error("Telemetry fetch error:", err);
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 15000); // 15s updates
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem("metroflow_token");
    localStorage.removeItem("metroflow_user");
    router.push("/");
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0b0f19] text-cyan-400 cyber-grid">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent shadow-[0_0_15px_rgba(6,182,212,0.3)]"></div>
          <p className="font-mono text-xs tracking-widest text-cyan-300">SYNCHRONIZING TERMINAL MODULES...</p>
        </div>
      </div>
    );
  }

  const role = user?.role || "user";
  const allowedNavigation = navigationItems.filter(item => item.roles.includes(role));

  const getRoleBadgeColor = (r: string) => {
    switch (r) {
      case "admin": return "bg-red-950/80 text-red-400 border-red-800/40";
      case "manager": return "bg-purple-950/80 text-purple-400 border-purple-800/40";
      default: return "bg-blue-950/80 text-blue-400 border-blue-800/40";
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0b0f19] text-slate-200 font-mono print:h-auto print:w-auto print:overflow-visible print:bg-white print:text-black">
      {/* Sidebar (Desktop) */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } relative z-20 flex h-full flex-col border-r border-slate-800/60 glass-sidebar transition-all duration-200 ease-in-out hidden md:flex print:hidden`}
      >
        {/* Sidebar Brand Header */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-slate-800">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-indigo-550 font-bold text-slate-900 shadow-[0_0_15px_rgba(6,182,212,0.35)]">
              MF
            </div>
            {sidebarOpen && (
              <span className="font-mono font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 text-glow-cyan">
                METROFLOW
              </span>
            )}
          </Link>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-500 hover:text-cyan-400 transition-colors">
            {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        {/* Sidebar Nav links */}
        <nav className="flex-1 space-y-1 px-3 py-5 overflow-y-auto">
          {allowedNavigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all border ${
                  isActive
                    ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                    : "text-slate-400 border-transparent hover:bg-slate-800/40 hover:text-slate-200"
                }`}
              >
                <Icon
                  size={16}
                  className={`mr-3 transition-colors ${isActive ? "text-cyan-400" : "text-slate-500 group-hover:text-slate-200"}`}
                />
                {sidebarOpen && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Logout */}
        <div className="p-4 border-t border-slate-800 space-y-3 print:hidden">
          <button
            onClick={handleLogout}
            className="flex w-full items-center rounded-xl px-3 py-2.5 text-xs font-bold text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-950/40 transition-all cursor-pointer"
          >
            <LogOut size={16} className="mr-3" />
            {sidebarOpen && <span>SECURE SIGNOUT</span>}
          </button>

        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden print:overflow-visible">
        {/* Topbar */}
        <header className="flex h-16 w-full items-center justify-between border-b border-slate-800/60 glass-navbar px-6 print:hidden">
          <div className="flex items-center space-x-4">
            <button className="md:hidden text-slate-400 hover:text-cyan-400" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu size={20} />
            </button>
            
            {/* Live Telemetry Health Bar */}
            <div className="hidden lg:flex items-center space-x-4">
              <div className="flex items-center space-x-2.5 rounded-full border border-slate-800 bg-[#0b0f19] px-3.5 py-1 text-[10px] font-bold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                </span>
                <span className="text-slate-400">TELEMETRY LINK: ACTIVE</span>
              </div>

              {delayedCount > 0 && (
                <div className="flex items-center space-x-2 rounded-full border border-yellow-800/40 bg-yellow-950/20 px-3.5 py-1 text-[10px] text-yellow-400 font-bold">
                  <Clock size={12} />
                  <span>{delayedCount} DELAYS REPORTED</span>
                </div>
              )}

              {alertsCount > 0 ? (
                <div className="flex items-center space-x-2 rounded-full border border-red-800/40 bg-red-950/20 px-3.5 py-1 text-[10px] text-red-400 font-bold animate-pulse">
                  <AlertTriangle size={12} />
                  <span>{alertsCount} INCIDENTS LOGGED</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 rounded-full border border-green-800/40 bg-green-950/20 px-3.5 py-1 text-[10px] text-green-400 font-bold">
                  <CheckCircle size={12} />
                  <span>SYSTEM NORMAL</span>
                </div>
              )}
            </div>
          </div>

          {/* User Profile menu details */}
          <div className="flex items-center space-x-4">
            <Link href="/alerts" className="relative p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800/40 rounded-lg transition-all border border-transparent hover:border-slate-800">
              <Bell size={16} />
              {alertsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 animate-ping"></span>
              )}
            </Link>

            <div className="flex items-center space-x-3 border-l border-slate-800 pl-4">
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-xs font-bold text-slate-350">{user?.fullName}</span>
                <span className={`rounded border px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest ${getRoleBadgeColor(role)}`}>
                  {role}
                </span>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-850 border border-slate-800 font-bold text-cyan-400">
                {user?.fullName?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden bg-slate-950/80 backdrop-blur-sm">
            <div className="w-64 bg-[#0f172a] border-r border-slate-800 flex flex-col h-full p-4">
              <div className="flex justify-between items-center mb-6">
                <span className="font-mono font-bold tracking-widest text-cyan-400">METROFLOW</span>
                <button onClick={() => setSidebarOpen(false)} className="text-slate-400">
                  <X size={18} />
                </button>
              </div>
              
              <nav className="flex-1 space-y-2 overflow-y-auto">
                {allowedNavigation.map(item => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center rounded-xl px-3 py-2 text-xs font-bold border transition-all ${
                        isActive ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" : "text-slate-400 border-transparent hover:bg-slate-800/40 hover:text-slate-200"
                      }`}
                    >
                      <Icon size={16} className="mr-3" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              <button
                onClick={handleLogout}
                className="flex w-full items-center rounded-xl px-3 py-2.5 text-xs font-bold text-red-400 hover:bg-red-500/10 border-t border-slate-800 pt-4"
              >
                <LogOut size={16} className="mr-3" />
                <span>SIGNOUT</span>
              </button>
            </div>
            <div className="flex-1" onClick={() => setSidebarOpen(false)}></div>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#0b0f19] cyber-grid print:p-0 print:overflow-visible print:bg-white flex flex-col justify-between">
          <div className="flex-1 w-full">
            {children}
          </div>
          <footer className="mt-8 pt-4 border-t border-slate-800/40 text-center text-[10px] text-slate-500 font-mono print:hidden">
            created by Ajit with ❤️
          </footer>
        </main>
      </div>

      {/* Toast notifications container */}
      <div className="fixed top-4 right-4 z-[9999] space-y-3 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto w-80 rounded-xl border border-red-500/30 p-4 text-slate-100 shadow-2xl glass-panel-glow animate-pulse-glow flex items-start space-x-3">
            <AlertTriangle className="text-red-405 shrink-0 mt-0.5" size={16} />
            <div className="flex-1 space-y-1">
              <div className="flex justify-between items-center text-[9px] font-black uppercase text-red-400 tracking-wider">
                <span>{toast.alert_type} :: {toast.severity}</span>
                <button onClick={() => removeToast(toast.id)} className="text-slate-500 hover:text-slate-300">
                  <X size={10} />
                </button>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-200">{toast.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
