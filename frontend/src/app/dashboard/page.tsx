"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CommandCenterLayout from "@/components/CommandCenterLayout";
import { api } from "@/utils/api";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";
import {
  Train,
  Activity,
  AlertTriangle,
  TrendingUp,
  Map,
  Users,
  Compass,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Cpu,
  MessageSquareCode,
  Send,
  X,
  MessageSquare,
  Bot
} from "lucide-react";

export default function Dashboard() {
  const router = useRouter();
  const [summary, setSummary] = useState<any>(null);
  const [routePerformance, setRoutePerformance] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiInsight, setAiInsight] = useState("Analyzing control room metrics for operational feedback...");
  
  // Floating Copilot states
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<any[]>([
    { sender: "assistant", text: "Secure link active. I am MetroMind AI. Ask me for operational recommendations or delay summaries." }
  ]);
  const [chatSending, setChatSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Schematic Map Hover details
  const [hoveredStation, setHoveredStation] = useState<any>(null);
  const [hoveredTrain, setHoveredTrain] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const userStr = localStorage.getItem("metroflow_user");
      const parsedUser = userStr ? JSON.parse(userStr) : null;
      const role = parsedUser?.role || "user";

      // 1. Fetch summary metrics
      try {
        const sum = await api.analytics.summary();
        setSummary(sum);
      } catch (err) {
        console.error("Failed to fetch dashboard summary:", err);
      }

      // 2. Fetch route performance if admin or manager
      if (role === "admin" || role === "manager") {
        try {
          const routeData = await api.analytics.routePerformance();
          setRoutePerformance(routeData);
        } catch (err) {
          console.error("Failed to fetch route performance:", err);
        }
      }

      // 3. Fetch trends
      try {
        const trendData = await api.analytics.trends();
        setTrends(trendData);
      } catch (err) {
        console.error("Failed to fetch ridership trends:", err);
      }
      
      // 4. Fetch MetroMind AI summary
      try {
        const chatRes = await api.assistant.chat("Give me a 2-sentence bulleted operational recommendation card based on current delays.");
        setAiInsight(chatRes.response);
      } catch (e) {
        setAiInsight("Operations Recommendation: Peak ridership detected. Keep Red Line headways at 3.5 minutes. Standby trains are ready for dispatch.");
      }
      
      setLoading(false);
    };

    fetchData();
  }, []);

  // Auto-scroll floating chat drawer
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatSending) return;

    const userText = chatInput;
    setChatMessages(prev => [...prev, { sender: "user", text: userText }]);
    setChatInput("");
    setChatSending(true);

    try {
      const historyPayload = chatMessages.map(m => ({
        sender: m.sender,
        text: m.text
      }));
      const res = await api.assistant.chat(userText, historyPayload);
      setChatMessages(prev => [...prev, { sender: "assistant", text: res.response }]);
    } catch (err: any) {
      setChatMessages(prev => [...prev, { sender: "assistant", text: `Error contacting MetroMind AI: ${err.message}` }]);
    } finally {
      setChatSending(false);
    }
  };

  if (loading) {
    return (
      <CommandCenterLayout>
        <div className="flex h-full w-full items-center justify-center text-cyan-400">
          <div className="flex flex-col items-center space-y-4 font-mono">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent shadow-[0_0_15px_rgba(6,182,212,0.35)]"></div>
            <p className="text-xs tracking-wider text-cyan-300">MOUNTING CONTROL ROOM TELEMETRY LINK...</p>
          </div>
        </div>
      </CommandCenterLayout>
    );
  }

  const activeAlertsCount = summary?.latest_alerts?.length || 0;
  const delayedTrainsCount = summary?.delayed_trains || 0;

  return (
    <CommandCenterLayout>
      <div className="space-y-6 max-w-full font-mono text-slate-200">
        
        {/* Control Room Live Header Indicator Bar */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between border-b border-slate-800 pb-5 gap-4">
          <div>
            <span className="block text-[8px] font-black tracking-widest text-slate-500 uppercase">SYSOP CONTROL terminal</span>
            <h1 className="text-xl font-black tracking-widest text-glow-cyan text-cyan-400 uppercase">
              METRO OPERATIONS CENTRAL CONTROL ROOM
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Live Link Heartbeat */}
            <div className="flex items-center space-x-2 rounded-lg border border-slate-800 bg-[#070b19] px-3.5 py-2 text-[10px] font-bold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              <span className="text-slate-400">LINK: CONTROL_ROOM_ACTIVE</span>
            </div>

            {/* Delay alert indicator */}
            <div className={`flex items-center space-x-2 rounded-lg border px-3.5 py-2 text-[10px] font-bold ${
              delayedTrainsCount > 0 
                ? "border-yellow-800/40 bg-yellow-950/20 text-yellow-400 animate-pulse" 
                : "border-slate-800 bg-[#070b19] text-slate-400"
            }`}>
              <Train size={12} />
              <span>{delayedTrainsCount} DELAYS DETECTED</span>
            </div>

            {/* Emergency alert count badge */}
            <div className={`flex items-center space-x-2 rounded-lg border px-3.5 py-2 text-[10px] font-bold ${
              activeAlertsCount > 0 
                ? "border-red-800/40 bg-red-950/20 text-red-400 animate-pulse-glow" 
                : "border-slate-800 bg-[#070b19] text-slate-400"
            }`}>
              <AlertTriangle size={12} />
              <span>{activeAlertsCount} INCIDENTS BROADCASTING</span>
            </div>
          </div>
        </div>

        {/* Dashboard Control Room main layout Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* LEFT COLUMN: Animated SVG Metro Schematic (Control Room Screen) */}
          <div className="xl:col-span-2 rounded-2xl glass-card-glow-cyan p-5 relative flex flex-col justify-between min-h-[460px]">
            <div className="mb-4 flex items-center justify-between border-b border-slate-850 pb-2">
              <div>
                <h3 className="text-xs font-black tracking-widest text-cyan-400 uppercase">Live Network Transit schematic</h3>
                <span className="text-[9px] text-slate-500 uppercase">Pulsing stations represent crowd loads. Hover nodes for details.</span>
              </div>
              <span className="rounded bg-cyan-950/50 border border-cyan-800/30 px-2 py-0.5 text-[8px] text-cyan-400 font-bold uppercase tracking-widest">
                LIVE OVERLAY SCREEN
              </span>
            </div>

            {/* SVG Interactive Metro Lines Schematic Map */}
            <div className="relative flex-1 flex items-center justify-center min-h-[300px]">
              <svg className="w-full h-full max-h-[320px]" viewBox="0 0 550 320" xmlns="http://www.w3.org/2000/svg">
                {/* Schematic Background Tracks */}
                {/* Red Line */}
                <path d="M 60 70 L 490 70" fill="none" stroke="#dc2626" strokeWidth="3" strokeLinecap="round" />
                {/* Yellow Line */}
                <path d="M 250 20 L 250 300" fill="none" stroke="#eab308" strokeWidth="3" strokeLinecap="round" />
                {/* Blue Line */}
                <path d="M 60 150 L 490 150" fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" />
                {/* Violet Line */}
                <path d="M 250 70 L 310 150 L 250 190 L 330 230 L 370 270" fill="none" stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" />
                {/* Pink Line */}
                <path d="M 150 70 L 150 110 C 150 160, 200 230, 250 230 L 330 230 C 350 230, 370 180, 370 70" fill="none" stroke="#ec4899" strokeWidth="3" strokeLinecap="round" />
                {/* Magenta Line */}
                <path d="M 250 300 L 370 270 L 400 150" fill="none" stroke="#db2777" strokeWidth="3" strokeLinecap="round" />

                {/* INTERCHANGES & STATIONS NODES */}
                {/* Kashmere Gate (Red/Yellow/Violet Interchange) */}
                <circle cx="250" cy="70" r="10" fill="#ef4444" fillOpacity="0.15" className="animate-ping" style={{ animationDuration: '4s' }} />
                <circle
                  cx="250" cy="70" r="5.5" fill="#1e293b" stroke="#ef4444" strokeWidth="2.5"
                  onMouseEnter={() => setHoveredStation({ name: "Kashmere Gate", line: "Red / Yellow / Violet Interchange", density: "Normal", load: "340 Pax", layout: "Underground/Elevated" })}
                  onMouseLeave={() => setHoveredStation(null)}
                  className="cursor-pointer"
                />

                {/* Rajiv Chowk (Yellow/Blue Interchange) - Critical Overcrowding */}
                <circle cx="250" cy="150" r="14" fill="#ef4444" fillOpacity="0.15" className="animate-ping" style={{ animationDuration: '3s' }} />
                <circle
                  cx="250" cy="150" r="7.5" fill="#991b1b" stroke="#eab308" strokeWidth="3"
                  onMouseEnter={() => setHoveredStation({ name: "Rajiv Chowk", line: "Yellow / Blue Interchange", density: "Critical (Very High)", load: "2,450 Pax", layout: "Underground" })}
                  onMouseLeave={() => setHoveredStation(null)}
                  className="cursor-pointer"
                />

                {/* Mandi House (Blue/Violet Interchange) */}
                <circle cx="310" cy="150" r="9" fill="#8b5cf6" fillOpacity="0.1" />
                <circle
                  cx="310" cy="150" r="5" fill="#1e293b" stroke="#8b5cf6" strokeWidth="2"
                  onMouseEnter={() => setHoveredStation({ name: "Mandi House", line: "Blue / Violet Interchange", density: "Normal", load: "680 Pax", layout: "Underground" })}
                  onMouseLeave={() => setHoveredStation(null)}
                  className="cursor-pointer"
                />

                {/* Central Secretariat (Yellow/Violet Interchange) */}
                <circle cx="250" cy="190" r="9" fill="#eab308" fillOpacity="0.1" />
                <circle
                  cx="250" cy="190" r="5" fill="#1e293b" stroke="#eab308" strokeWidth="2"
                  onMouseEnter={() => setHoveredStation({ name: "Central Secretariat", line: "Yellow / Violet Interchange", density: "Normal", load: "510 Pax", layout: "Underground" })}
                  onMouseLeave={() => setHoveredStation(null)}
                  className="cursor-pointer"
                />

                {/* Dilli Haat INA (Yellow/Pink Interchange) */}
                <circle cx="250" cy="230" r="10" fill="#ec4899" fillOpacity="0.15" />
                <circle
                  cx="250" cy="230" r="5.5" fill="#1e293b" stroke="#ec4899" strokeWidth="2"
                  onMouseEnter={() => setHoveredStation({ name: "Dilli Haat INA", line: "Yellow / Pink Interchange", density: "Medium Load", load: "920 Pax", layout: "Underground" })}
                  onMouseLeave={() => setHoveredStation(null)}
                  className="cursor-pointer"
                />

                {/* Lajpat Nagar (Pink/Violet Interchange) */}
                <circle cx="330" cy="230" r="9" fill="#ec4899" fillOpacity="0.1" />
                <circle
                  cx="330" cy="230" r="5" fill="#1e293b" stroke="#ec4899" strokeWidth="2"
                  onMouseEnter={() => setHoveredStation({ name: "Lajpat Nagar", line: "Pink / Violet Interchange", density: "Medium Load", load: "790 Pax", layout: "Elevated" })}
                  onMouseLeave={() => setHoveredStation(null)}
                  className="cursor-pointer"
                />

                {/* Hauz Khas (Yellow/Magenta Interchange) */}
                <circle cx="250" cy="300" r="10" fill="#db2777" fillOpacity="0.15" />
                <circle
                  cx="250" cy="300" r="5.5" fill="#1e293b" stroke="#db2777" strokeWidth="2"
                  onMouseEnter={() => setHoveredStation({ name: "Hauz Khas", line: "Yellow / Magenta Interchange", density: "High Load", load: "1,380 Pax", layout: "Underground" })}
                  onMouseLeave={() => setHoveredStation(null)}
                  className="cursor-pointer"
                />

                {/* Kalkaji Mandir (Violet/Magenta Interchange) */}
                <circle cx="370" cy="270" r="10" fill="#db2777" fillOpacity="0.15" />
                <circle
                  cx="370" cy="270" r="5.5" fill="#1e293b" stroke="#db2777" strokeWidth="2"
                  onMouseEnter={() => setHoveredStation({ name: "Kalkaji Mandir", line: "Violet / Magenta Interchange", density: "High Load", load: "1,210 Pax", layout: "Underground" })}
                  onMouseLeave={() => setHoveredStation(null)}
                  className="cursor-pointer"
                />

                {/* Botanical Garden (Blue/Magenta Interchange) */}
                <circle cx="400" cy="150" r="10" fill="#db2777" fillOpacity="0.15" />
                <circle
                  cx="400" cy="150" r="5.5" fill="#1e293b" stroke="#db2777" strokeWidth="2"
                  onMouseEnter={() => setHoveredStation({ name: "Botanical Garden", line: "Blue / Magenta Interchange", density: "High Load", load: "1,120 Pax", layout: "Elevated" })}
                  onMouseLeave={() => setHoveredStation(null)}
                  className="cursor-pointer"
                />

                {/* Netaji Subhash Place (Red/Pink Interchange) */}
                <circle cx="150" cy="70" r="9" fill="#ec4899" fillOpacity="0.1" />
                <circle
                  cx="150" cy="70" r="5" fill="#1e293b" stroke="#ec4899" strokeWidth="2"
                  onMouseEnter={() => setHoveredStation({ name: "Netaji Subhash Place", line: "Red / Pink Interchange", density: "Normal", load: "480 Pax", layout: "Elevated" })}
                  onMouseLeave={() => setHoveredStation(null)}
                  className="cursor-pointer"
                />

                {/* Welcome (Red/Pink Interchange) */}
                <circle cx="370" cy="70" r="9" fill="#ec4899" fillOpacity="0.1" />
                <circle
                  cx="370" cy="70" r="5" fill="#1e293b" stroke="#ec4899" strokeWidth="2"
                  onMouseEnter={() => setHoveredStation({ name: "Welcome", line: "Red / Pink Interchange", density: "Normal", load: "390 Pax", layout: "Elevated" })}
                  onMouseLeave={() => setHoveredStation(null)}
                  className="cursor-pointer"
                />

                {/* NON-INTERCHANGE NODES */}
                {/* Rithala (Red Line terminus) */}
                <circle cx="80" cy="70" r="5" fill="#dc2626" />
                <circle
                  cx="80" cy="70" r="3.5" fill="#1e293b" stroke="#dc2626" strokeWidth="1.5"
                  onMouseEnter={() => setHoveredStation({ name: "Rithala", line: "Red Line", density: "Normal", load: "190 Pax", layout: "Elevated" })}
                  onMouseLeave={() => setHoveredStation(null)}
                  className="cursor-pointer"
                />

                {/* Dilshad Garden (Red Line) */}
                <circle cx="450" cy="70" r="5" fill="#dc2626" />
                <circle
                  cx="450" cy="70" r="3.5" fill="#1e293b" stroke="#dc2626" strokeWidth="1.5"
                  onMouseEnter={() => setHoveredStation({ name: "Dilshad Garden", line: "Red Line", density: "Normal", load: "280 Pax", layout: "Elevated" })}
                  onMouseLeave={() => setHoveredStation(null)}
                  className="cursor-pointer"
                />

                {/* Samaypur Badli (Yellow Line terminus) */}
                <circle cx="250" cy="20" r="5" fill="#eab308" />
                <circle
                  cx="250" cy="20" r="3.5" fill="#1e293b" stroke="#eab308" strokeWidth="1.5"
                  onMouseEnter={() => setHoveredStation({ name: "Samaypur Badli", line: "Yellow Line", density: "Normal", load: "220 Pax", layout: "Elevated" })}
                  onMouseLeave={() => setHoveredStation(null)}
                  className="cursor-pointer"
                />

                {/* AIIMS (Yellow Line) */}
                <circle cx="250" cy="265" r="7" fill="#eab308" fillOpacity="0.1" />
                <circle
                  cx="250" cy="265" r="4" fill="#ca8a04" stroke="#eab308" strokeWidth="2"
                  onMouseEnter={() => setHoveredStation({ name: "AIIMS", line: "Yellow Line", density: "Normal", load: "420 Pax", layout: "Underground" })}
                  onMouseLeave={() => setHoveredStation(null)}
                  className="cursor-pointer"
                />

                {/* Karol Bagh (Blue Line) */}
                <circle cx="110" cy="150" r="7" fill="#3b82f6" fillOpacity="0.1" />
                <circle
                  cx="110" cy="150" r="4" fill="#1e3a8a" stroke="#3b82f6" strokeWidth="2"
                  onMouseEnter={() => setHoveredStation({ name: "Karol Bagh", line: "Blue Line", density: "Medium Load", load: "840 Pax", layout: "Elevated" })}
                  onMouseLeave={() => setHoveredStation(null)}
                  className="cursor-pointer"
                />

                {/* Noida Sector 62 (Blue Line) */}
                <circle cx="450" cy="150" r="7" fill="#3b82f6" fillOpacity="0.1" />
                <circle
                  cx="450" cy="150" r="4" fill="#1e3a8a" stroke="#3b82f6" strokeWidth="2"
                  onMouseEnter={() => setHoveredStation({ name: "Noida Sector 62", line: "Blue Line", density: "Normal", load: "310 Pax", layout: "Elevated" })}
                  onMouseLeave={() => setHoveredStation(null)}
                  className="cursor-pointer"
                />

                {/* ANIMATED ROLLING TRAINS */}
                {/* Train on Yellow Line */}
                <g
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredTrain({ id: "T-YEL-02", name: "Yellow Line Express", speed: "55 km/h", status: "Active", capacity: "1,500 Pax" })}
                  onMouseLeave={() => setHoveredTrain(null)}
                >
                  <circle cx="250" cy="110" r="6" fill="#fca5a5" className="animate-ping" style={{ animationDuration: '2.5s' }} />
                  <polygon points="246,114 254,114 250,105" fill="#eab308" />
                </g>

                {/* Train on Blue Line */}
                <g
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredTrain({ id: "T-BLU-05", name: "Blue Line Local", speed: "0 km/h (Stopped)", status: "Delayed", capacity: "1,500 Pax" })}
                  onMouseLeave={() => setHoveredTrain(null)}
                >
                  <circle cx="180" cy="150" r="6" fill="#93c5fd" className="animate-ping" style={{ animationDuration: '1.8s' }} />
                  <polygon points="176,154 184,154 180,145" fill="#3b82f6" />
                </g>

                {/* STATION LABELS */}
                {/* Red Line Labels */}
                <text x="50" y="60" fill="#dc2626" fontSize="6.5" fontWeight="bold">Rithala</text>
                <text x="120" y="55" fill="#ec4899" fontSize="6.5" fontWeight="bold">Netaji Subhash Pl</text>
                <text x="256" y="64" fill="#dc2626" fontSize="6.5" fontWeight="bold">Kashmere Gate</text>
                <text x="376" y="60" fill="#ec4899" fontSize="6.5" fontWeight="bold">Welcome</text>
                <text x="440" y="60" fill="#dc2626" fontSize="6.5" fontWeight="bold">Dilshad Gdn</text>

                {/* Yellow Line Labels */}
                <text x="260" y="24" fill="#eab308" fontSize="6.5" fontWeight="bold">Samaypur Badli</text>
                <text x="260" y="146" fill="#eab308" fontSize="7" fontWeight="black" className="animate-pulse">Rajiv Chowk (HUB)</text>
                <text x="260" y="186" fill="#eab308" fontSize="6.5" fontWeight="bold">Central Sec</text>
                <text x="260" y="226" fill="#ec4899" fontSize="6.5" fontWeight="bold">INA</text>
                <text x="260" y="260" fill="#eab308" fontSize="6.5" fontWeight="bold">AIIMS</text>
                <text x="260" y="296" fill="#db2777" fontSize="6.5" fontWeight="bold">Hauz Khas</text>

                {/* Blue Line Labels */}
                <text x="80" y="136" fill="#3b82f6" fontSize="6.5" fontWeight="bold">Karol Bagh</text>
                <text x="315" y="136" fill="#8b5cf6" fontSize="6.5" fontWeight="bold">Mandi House</text>
                <text x="390" y="136" fill="#db2777" fontSize="6.5" fontWeight="bold">Botanical Gdn</text>
                <text x="445" y="136" fill="#2563eb" fontSize="6.5" fontWeight="bold">Noida Sec 62</text>

                {/* Violet, Pink, Magenta Interchange Labels */}
                <text x="336" y="222" fill="#ec4899" fontSize="6.5" fontWeight="bold">Lajpat Nagar</text>
                <text x="376" y="262" fill="#db2777" fontSize="6.5" fontWeight="bold">Kalkaji Mandir</text>
              </svg>

              {/* Station details popup overlay */}
              {hoveredStation && (
                <div className="absolute top-2 left-2 rounded-xl border border-cyan-500/20 bg-slate-950/90 backdrop-blur-md p-4 w-60 text-[10px] space-y-1.5 shadow-2xl z-20">
                  <span className="block font-black text-cyan-400 text-glow-cyan uppercase border-b border-slate-800 pb-1 font-mono tracking-wider">
                    🚉 {hoveredStation.name}
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 font-mono text-slate-350">
                    <span className="text-slate-500">Route Line:</span>
                    <span className="font-bold text-slate-200">{hoveredStation.line}</span>
                    <span className="text-slate-500">Density:</span>
                    <span className={`font-bold ${hoveredStation.density.includes("Critical") ? "text-red-400 animate-pulse" : "text-green-400"}`}>
                      {hoveredStation.density}
                    </span>
                    <span className="text-slate-500">Current Flow:</span>
                    <span className="font-bold text-slate-200">{hoveredStation.load}</span>
                    <span className="text-slate-500">Layout:</span>
                    <span className="text-slate-200">{hoveredStation.layout}</span>
                  </div>
                </div>
              )}

              {/* Train details popup overlay */}
              {hoveredTrain && (
                <div className="absolute top-2 right-2 rounded-xl border border-cyan-500/20 bg-slate-950/90 backdrop-blur-md p-4 w-60 text-[10px] space-y-1.5 shadow-2xl z-20">
                  <span className="block font-black text-cyan-400 text-glow-cyan uppercase border-b border-slate-800 pb-1 font-mono tracking-wider">
                    🚆 ROLLING NODE: {hoveredTrain.id}
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 font-mono text-slate-350">
                    <span className="text-slate-500">Stock Name:</span>
                    <span className="font-bold text-slate-200">{hoveredTrain.name}</span>
                    <span className="text-slate-500">Velocity:</span>
                    <span className="font-bold text-slate-200">{hoveredTrain.speed}</span>
                    <span className="text-slate-500">Status:</span>
                    <span className={`font-bold uppercase ${hoveredTrain.status === "Delayed" ? "text-yellow-400" : "text-green-400"}`}>
                      {hoveredTrain.status}
                    </span>
                    <span className="text-slate-500">Capacity:</span>
                    <span className="font-bold text-slate-200">{hoveredTrain.capacity}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Map Legends */}
            <div className="flex flex-wrap items-center gap-6 border-t border-slate-850 pt-3 text-[8px] text-slate-500 font-bold uppercase">
              <div className="flex items-center space-x-2">
                <span className="h-2 w-2 rounded-full bg-green-500"></span>
                <span>Normal Inflow</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                <span>Medium load</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="h-2 w-2 rounded-full bg-orange-500"></span>
                <span>High load</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-ping"></span>
                <span className="text-slate-400 font-black">Critical Overcrowded</span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Emergency alert console & KPI Stats */}
          <div className="space-y-6">
            
            {/* Real-time Emergency alert console */}
            <div className="rounded-2xl glass-card-glow-red p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                <h3 className="text-xs font-black tracking-widest text-red-400 uppercase">Emergency Incident Console</h3>
                <span className="rounded bg-red-950/40 border border-red-900/30 px-2 py-0.5 text-[8px] text-red-400 font-bold animate-pulse">
                  ALERTS LINK: ACTIVE
                </span>
              </div>

              <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
                {summary?.latest_alerts?.length > 0 ? (
                  summary.latest_alerts.map((alert: any) => (
                    <div
                      key={alert.id}
                      className={`rounded-xl border p-3 flex flex-col space-y-1 transition-all ${
                        alert.severity === "Critical"
                          ? "bg-red-950/10 border-red-900/30 text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.02)]"
                          : "bg-amber-950/10 border-amber-900/30 text-amber-250"
                      }`}
                    >
                      <div className="flex justify-between items-center text-[9px] font-black uppercase">
                        <span>{alert.alert_type} :: {alert.severity}</span>
                        <span className="text-slate-500 font-semibold">{new Date(alert.created_at).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-slate-350">{alert.message}</p>
                    </div>
                  ))
                ) : (
                  <div className="flex h-36 flex-col items-center justify-center text-slate-650 border border-dashed border-slate-800 rounded-xl bg-slate-950/5">
                    <ShieldCheck size={24} className="text-green-500/30 mb-1" />
                    <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold">ALL TRANSIT SECTORS NORMAL</span>
                  </div>
                )}
              </div>
            </div>

            {/* MetroMind AI Grounded Recommendations Card */}
            <div className="rounded-2xl glass-card-glow-cyan p-5 border-l-4 border-l-cyan-400 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                <div className="flex items-center space-x-1.5">
                  <Zap size={14} className="text-cyan-400 animate-pulse" />
                  <span className="text-xs font-black tracking-widest text-cyan-400 uppercase">MetroMind AI Advisory</span>
                </div>
                <Link
                  href="/assistant"
                  className="text-[9px] text-cyan-400 hover:text-cyan-300 font-black flex items-center space-x-1"
                >
                  <span>Query Copilot</span>
                  <ArrowUpRight size={10} />
                </Link>
              </div>
              <p className="text-xs text-slate-350 leading-relaxed italic">
                "{aiInsight}"
              </p>
            </div>

          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          
          {/* Trends Area Chart */}
          <div className="lg:col-span-2 rounded-2xl glass-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black tracking-widest text-slate-350 uppercase font-mono">System Volume Sequence</h3>
                <span className="text-[9px] font-bold text-slate-500 uppercase">24-Hour Passenger Inflow Metrics</span>
              </div>
              <TrendingUp size={15} className="text-cyan-400" />
            </div>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#10172a" />
                  <XAxis dataKey="date" stroke="#475569" tickFormatter={(v) => v.slice(5)} fontSize={8} />
                  <YAxis stroke="#475569" fontSize={8} />
                  <Tooltip contentStyle={{ backgroundColor: "#060914", border: "1px solid #1e293b", borderRadius: '8px', fontSize: '9px', fontFamily: 'monospace' }} />
                  <Line type="monotone" dataKey="total_flow" name="Volume" stroke="#06b6d4" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#06b6d4' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Transit Route Load comparison chart */}
          <div className="rounded-2xl glass-card p-5">
            <div className="mb-4">
              <h3 className="text-xs font-black tracking-widest text-slate-350 uppercase">Line Performance Index</h3>
              <span className="text-[9px] font-bold text-slate-500 uppercase">Transit Loads per Mapped Route</span>
            </div>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={routePerformance} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#10172a" />
                  <XAxis type="number" stroke="#475569" fontSize={8} />
                  <YAxis type="category" dataKey="route_name" stroke="#475569" fontSize={8} width={70} />
                  <Tooltip contentStyle={{ backgroundColor: "#060914", border: "1px solid #1e293b", borderRadius: '8px', fontSize: '9px', fontFamily: 'monospace' }} />
                  <Bar dataKey="total_flow" name="Ridership Volume" fill="#8b5cf6" radius={[0, 4, 4, 0]}>
                    {routePerformance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.route_color || "#8b5cf6"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Floating MetroMind AI Copilot chat drawer */}
        <div className="fixed bottom-6 right-6 z-40">
          {!chatOpen ? (
            <button
              onClick={() => setChatOpen(true)}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-indigo-650 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:scale-105 hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] transition-all cursor-pointer border border-cyan-300/30"
              title="Query MetroMind AI Copilot"
            >
              <MessageSquare size={20} className="text-[#070b19]" />
            </button>
          ) : (
            <div className="w-80 h-96 rounded-2xl border border-cyan-500/30 bg-[#070b19]/95 backdrop-blur-md shadow-3xl flex flex-col justify-between overflow-hidden glass-panel-glow animate-pulse-glow">
              {/* Chat Drawer Header */}
              <div className="bg-gradient-to-r from-cyan-950 to-indigo-950 px-4 py-3 flex items-center justify-between border-b border-cyan-800/20">
                <div className="flex items-center space-x-2">
                  <Bot size={16} className="text-cyan-400 animate-pulse" />
                  <span className="text-[10px] font-black uppercase text-cyan-400 tracking-wider font-mono">MetroMind AI Copilot</span>
                </div>
                <button onClick={() => setChatOpen(false)} className="text-slate-400 hover:text-cyan-400 transition-colors">
                  <X size={14} />
                </button>
              </div>

              {/* Chat Logs Area */}
              <div className="flex-1 p-3 overflow-y-auto space-y-2 text-[10px] font-mono leading-normal max-h-[280px]">
                {chatMessages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`rounded-lg border p-2.5 max-w-[200px] whitespace-pre-line ${
                      m.sender === "user" 
                        ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-200" 
                        : "bg-slate-950 border-slate-850 text-slate-350"
                    }`}>
                      {m.text}
                    </div>
                  </div>
                ))}
                
                {chatSending && (
                  <div className="flex justify-start animate-pulse">
                    <div className="rounded-lg border border-slate-850 bg-slate-950 p-2 text-slate-500">
                      METROMIND AI IS INFERRING...
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input drawer form */}
              <form onSubmit={handleSendChat} className="border-t border-slate-850/80 p-2 flex gap-2">
                <input
                  type="text"
                  required
                  disabled={chatSending}
                  placeholder="Ask MetroMind..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-2 text-[10px] text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-400 placeholder:text-slate-650"
                />
                <button
                  type="submit"
                  disabled={chatSending || !chatInput.trim()}
                  className="rounded-lg bg-cyan-500 px-3 text-slate-950 hover:bg-cyan-400 transition-colors disabled:opacity-50"
                >
                  <Send size={11} />
                </button>
              </form>
            </div>
          )}
        </div>

      </div>
    </CommandCenterLayout>
  );
}
