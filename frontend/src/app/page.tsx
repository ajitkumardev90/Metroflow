"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  Activity,
  Cpu,
  Layers,
  ShieldCheck,
  CheckCircle,
  Database
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    activeTrains: 8,
    passengersToday: 24500,
    congestedHotspots: 0,
    alertsActive: 0
  });

  useEffect(() => {
    // Proactively check if operator has session token
    const token = localStorage.getItem("metroflow_token");
    if (token) {
      router.push("/dashboard");
    }
  }, [router]);

  return (
    <div className="relative min-h-screen w-screen bg-[#0b0f19] text-slate-200 overflow-x-hidden font-mono cyber-grid flex flex-col justify-between">
      {/* Background gradients */}
      <div className="absolute top-[-10%] left-[-10%] h-[600px] w-[600px] rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[20%] right-[-10%] h-[600px] w-[600px] rounded-full bg-violet-600/5 blur-[120px] pointer-events-none"></div>

      {/* Navbar header */}
      <header className="relative z-20 flex h-16 w-full items-center justify-between px-6 md:px-12 border-b border-slate-800 bg-[#0f172a]/60 backdrop-blur-md">
        <div className="flex items-center space-x-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-indigo-650 font-bold text-slate-900 shadow-[0_0_15px_rgba(6,182,212,0.35)]">
            MF
          </div>
          <span className="font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 text-glow-cyan">
            METROFLOW
          </span>
        </div>

        <Link
          href="/login"
          className="flex items-center space-x-1.5 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-4 py-2 text-xs font-bold text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/40 transition-all hover:shadow-[0_0_15px_rgba(6,182,212,0.1)]"
        >
          <span>SIGN IN</span>
          <ArrowRight size={12} />
        </Link>
      </header>

      {/* Hero section */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto px-6 md:px-12 py-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6 text-left">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 rounded-full border border-cyan-500/20 bg-cyan-950/20 px-3.5 py-1 text-[10px] text-cyan-400 font-bold">
            <Sparkles size={11} className="animate-pulse" />
            <span>METROFLOW SYSTEM ACTIVE</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-none text-slate-100 font-mono">
            Next-Gen Smart City <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 text-glow-cyan">
              Metro Crowd Management
            </span>
          </h1>

          <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-sans max-w-lg">
            MetroFlow leverages tree ensemble regression and neural forecasting to predict station congestion, optimize dispatch headways, and coordinate rolling stock allocations. Monitored through a military-grade Cyber Control Room.
          </p>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link
              href="/login"
              className="flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-650 py-3.5 px-6 text-xs font-black text-slate-950 hover:from-cyan-400 hover:to-indigo-500 hover:shadow-[0_0_25px_rgba(6,182,212,0.45)] transition-all duration-300"
            >
              <span>SIGN IN</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-6 border-t border-slate-800/80 pt-6 max-w-md">
            <div>
              <span className="block text-[8px] text-slate-500 uppercase tracking-wider font-bold">ACTIVE STOCK NODES</span>
              <span className="text-2xl font-black text-slate-200">8 / 8 Active</span>
            </div>
            <div>
              <span className="block text-[8px] text-slate-500 uppercase tracking-wider font-bold">AVG FREQUENCY HEADWAY</span>
              <span className="text-2xl font-black text-slate-200">3.5 Minutes</span>
            </div>
          </div>
        </div>

        {/* Animated Metro Line Graphic Illustration (SVG) */}
        <div className="relative flex justify-center items-center h-80 md:h-[400px] w-full rounded-2xl border border-slate-800 bg-[#070b19]/60 backdrop-blur-sm p-4 overflow-hidden shadow-2xl">
          {/* Grid effect inside canvas */}
          <div className="absolute inset-0 bg-radial-dots pointer-events-none opacity-20"></div>

          <svg className="w-full h-full" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            {/* Background Grid Lines */}
            <line x1="0" y1="100" x2="400" y2="100" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3 3" />
            <line x1="0" y1="200" x2="400" y2="200" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3 3" />
            <line x1="0" y1="300" x2="400" y2="300" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3 3" />
            <line x1="100" y1="0" x2="100" y2="400" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3 3" />
            <line x1="200" y1="0" x2="200" y2="400" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3 3" />
            <line x1="300" y1="0" x2="300" y2="400" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3 3" />

            {/* Red Line Route */}
            <path
              d="M 50 150 L 150 150 L 250 250 L 350 250"
              fill="none"
              stroke="#ef4444"
              strokeWidth="4"
              strokeLinecap="round"
              className="opacity-80"
            />
            {/* Blue Line Route */}
            <path
              d="M 250 50 L 250 150 L 150 250 L 50 250"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="4"
              strokeLinecap="round"
              className="opacity-80"
            />

            {/* Stations Glow Rings & Dots */}
            {/* Station 1: Red Line Start */}
            <circle cx="50" cy="150" r="8" fill="#ef4444" fillOpacity="0.15" />
            <circle cx="50" cy="150" r="4" fill="#ef4444" />
            
            {/* Station 2: Interchange Station (Glow Yellow) */}
            <circle cx="200" cy="200" r="14" fill="#eab308" fillOpacity="0.1" className="animate-ping" style={{ animationDuration: '3s' }} />
            <circle cx="200" cy="200" r="7" fill="#1e293b" stroke="#eab308" strokeWidth="2.5" />

            {/* Station 3: Red Line End */}
            <circle cx="350" cy="250" r="8" fill="#ef4444" fillOpacity="0.15" />
            <circle cx="350" cy="250" r="4" fill="#ef4444" />

            {/* Station 4: Blue Line Start */}
            <circle cx="250" cy="50" r="8" fill="#3b82f6" fillOpacity="0.15" />
            <circle cx="250" cy="50" r="4" fill="#3b82f6" />

            {/* Animated Train Node on Red Line (Pulsing node moving) */}
            <g className="animate-pulse">
              <circle cx="250" cy="250" r="6" fill="#fca5a5" className="animate-ping" />
              <circle cx="250" cy="250" r="4" fill="#ef4444" />
            </g>

            {/* Animated Train Node on Blue Line */}
            <g className="animate-pulse">
              <circle cx="150" cy="250" r="6" fill="#93c5fd" className="animate-ping" style={{ animationDuration: '2s' }} />
              <circle cx="150" cy="250" r="4" fill="#3b82f6" />
            </g>

            {/* Label overlays */}
            <text x="35" y="135" fill="#ef4444" fontSize="8" fontFamily="monospace" fontWeight="bold">Kashmere Gate</text>
            <text x="215" y="195" fill="#eab308" fontSize="8" fontFamily="monospace" fontWeight="black" className="animate-pulse">Rajiv Chowk (Interchange)</text>
            <text x="280" y="240" fill="#3b82f6" fontSize="8" fontFamily="monospace" fontWeight="bold">Noida City Center</text>
          </svg>

          {/* Floating UI overlay badge */}
          <div className="absolute bottom-4 left-4 bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-1.5 font-mono text-[9px] flex items-center space-x-2 text-slate-350 shadow-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span>SIMULATED NETWORK REPLAY: ACTIVE</span>
          </div>
        </div>
      </main>

      {/* Feature Section Grid */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-12 border-t border-slate-800 w-full grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="rounded-xl border border-slate-800 bg-[#070b19]/40 p-6 space-y-3">
          <div className="p-2.5 w-fit rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-850">
            <Cpu size={18} />
          </div>
          <h3 className="text-xs font-black tracking-widest text-slate-200 uppercase font-mono">1. Scikit-learn Forecasting</h3>
          <p className="text-[11px] text-slate-400 leading-normal font-sans">
            Engineered models compare HistGradientBoosting ensembled regressions to predict congestion indices and station counts dynamically.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#070b19]/40 p-6 space-y-3">
          <div className="p-2.5 w-fit rounded-lg bg-violet-950 text-violet-400 border border-violet-850">
            <Activity size={18} />
          </div>
          <h3 className="text-xs font-black tracking-widest text-slate-200 uppercase font-mono">2. Dynamic Controls Room</h3>
          <p className="text-[11px] text-slate-400 leading-normal font-sans">
            Grounded monitoring of delayed schedules, overcrowding, alert broadcasts, and daily analytics charts on high-end slate views.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#070b19]/40 p-6 space-y-3">
          <div className="p-2.5 w-fit rounded-lg bg-green-950 text-green-400 border border-green-850">
            <Sparkles size={18} />
          </div>
          <h3 className="text-xs font-black tracking-widest text-slate-200 uppercase font-mono">3. MetroMind AI</h3>
          <p className="text-[11px] text-slate-400 leading-normal font-sans">
            Google Gemini-powered operations copilot grounded in real-time telemetry. Explains predictions and outlines delay recovery headways.
          </p>
        </div>
      </section>

      {/* Animated Metro Train Background */}
      <div className="relative w-full overflow-hidden h-12 pointer-events-none z-10 opacity-30 select-none border-t border-slate-900 bg-slate-950/20">
        <div className="absolute bottom-[2px] left-0 w-[300px] h-6 animate-metro-train flex items-center">
          {/* Engine */}
          <div className="w-12 h-5 bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-r-lg relative flex items-center px-1 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
            <div className="w-3 h-2 bg-yellow-400 opacity-80 rounded-sm animate-pulse"></div>
          </div>
          {/* Carriage 1 */}
          <div className="w-16 h-5 bg-indigo-950 border border-indigo-500/30 mx-[2px] rounded-sm flex justify-around items-center px-1">
            <div className="w-2 h-1.5 bg-cyan-400/40 rounded-sm"></div>
            <div className="w-2 h-1.5 bg-cyan-400/40 rounded-sm"></div>
            <div className="w-2 h-1.5 bg-cyan-400/40 rounded-sm"></div>
          </div>
          {/* Carriage 2 */}
          <div className="w-16 h-5 bg-indigo-950 border border-indigo-500/30 mx-[2px] rounded-sm flex justify-around items-center px-1">
            <div className="w-2 h-1.5 bg-cyan-400/40 rounded-sm"></div>
            <div className="w-2 h-1.5 bg-cyan-400/40 rounded-sm"></div>
            <div className="w-2 h-1.5 bg-cyan-400/40 rounded-sm"></div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-20 flex flex-col md:flex-row h-20 items-center justify-between border-t border-slate-800 bg-[#0f172a]/60 px-6 md:px-12 text-[10px] text-slate-600 font-mono w-full shrink-0">
        <div>© 2026 METROFLOW PLATFORM. ALL RIGHTS RESERVED.</div>
        <div className="flex space-x-4 mt-2 md:mt-0 font-bold">
          <span className="text-slate-500">FastAPI</span>
          <span>•</span>
          <span className="text-slate-500">PostgreSQL</span>
          <span>•</span>
          <span className="text-slate-500">MongoDB</span>
          <span>•</span>
          <span className="text-slate-500">TailwindCSS</span>
        </div>
      </footer>
    </div>
  );
}
