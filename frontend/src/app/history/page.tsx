"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CommandCenterLayout from "@/components/CommandCenterLayout";
import { api } from "@/utils/api";
import {
  Trash2,
  Search,
  Calendar,
  Cpu,
  Eye,
  Printer,
  MessageCircle,
  X,
  Info,
  CloudSun,
  MapPin,
  Ticket,
  ShieldAlert,
  ArrowRight,
  Sparkles
} from "lucide-react";

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [stationFilter, setStationFilter] = useState("");
  const [crowdFilter, setCrowdFilter] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Modal State
  const [selectedPrediction, setSelectedPrediction] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("metroflow_user");
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
    fetchHistory();
  }, [page, stationFilter, crowdFilter]);

  const fetchHistory = async () => {
    try {
      const res = await api.predict.history({
        page,
        limit,
        station: stationFilter || undefined,
        crowd_level: crowdFilter || undefined
      });
      setHistory(res.data || []);
      setTotal(res.total_records || 0);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering open modal
    if (!confirm("Are you sure you want to delete this prediction log entry?")) return;
    try {
      await api.predict.deleteHistory(id);
      fetchHistory();
      if (selectedPrediction?.prediction_id === id) {
        setSelectedPrediction(null);
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete prediction entry.");
    }
  };

  const getCrowdBadgeColor = (level: string) => {
    switch (level) {
      case "Very High": return "bg-red-950/80 text-red-400 border-red-800/40";
      case "High": return "bg-orange-950/80 text-orange-400 border-orange-800/40";
      case "Medium": return "bg-yellow-950/80 text-yellow-400 border-yellow-800/40";
      default: return "bg-green-950/80 text-green-400 border-green-800/40";
    }
  };

  const handleAskGrokExplanation = (item: any) => {
    const prompt = `Explain this crowd prediction: We expect ${item.predicted_passengers} passengers (${item.crowd_level} crowd) travelling from ${item.from_station} to ${item.to_station} at ${item.hour}:00 on a ${item.day_name} in ${item.weather} conditions. Congestion status is classified as ${item.alert_status ? "Congested" : "Normal"}. Recommended headway adjustments: ${item.recommendations}. What does this mean and what should I do?`;
    sessionStorage.setItem("metroflow_assistant_query", prompt);
    router.push("/assistant");
  };

  const handlePrintItem = () => {
    window.print();
  };

  if (loading && page === 1) {
    return (
      <CommandCenterLayout>
        <div className="flex h-full w-full items-center justify-center text-cyan-400">
          <div className="flex flex-col items-center space-y-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent shadow-[0_0_15px_rgba(6,182,212,0.3)]"></div>
            <p className="font-mono text-xs tracking-wider text-cyan-300">QUERYING PREDICTION HISTORY DATABASE...</p>
          </div>
        </div>
      </CommandCenterLayout>
    );
  }

  const role = currentUser?.role || "user";
  const canDelete = role === "admin";

  return (
    <CommandCenterLayout>
      <div className="space-y-6 screen-only">
        {/* Header */}
        <div className="border-b border-slate-850 pb-5">
          <h1 className="text-lg font-black tracking-widest text-cyan-400 text-glow-cyan uppercase font-mono">
            FORECAST LOG HISTORY
          </h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5 font-mono">
            Traceability log of historical crowd prediction queries
          </p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Filter by station name..."
              value={stationFilter}
              onChange={(e) => {
                setStationFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-slate-800 bg-[#070b19]/80 py-2.5 pl-10 pr-4 font-mono text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-400"
            />
          </div>

          <select
            value={crowdFilter}
            onChange={(e) => {
              setCrowdFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-800 bg-[#070b19]/80 py-2.5 px-4 font-mono text-xs text-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer"
          >
            <option value="">All Crowd Levels</option>
            <option value="Low">Low Density</option>
            <option value="Medium">Medium Density</option>
            <option value="High">High Density</option>
            <option value="Very High">Very High Density</option>
          </select>

          <div className="flex items-center justify-end font-mono text-[10px] text-slate-500 tracking-wider font-bold">
            LOG ENTRIES: {total} RECORDS DETECTED
          </div>
        </div>

        {/* History Table */}
        <div className="rounded-xl border border-slate-850 bg-[#070b19] overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 uppercase text-[9px] tracking-wider bg-slate-950/40">
                  <th className="p-4">Route Segment</th>
                  <th className="p-4">Parameters Tested</th>
                  <th className="p-4">Passengers Count</th>
                  <th className="p-4">Density Level</th>
                  <th className="p-4">Query Time</th>
                  <th className="p-4 text-center">Inspect</th>
                  {canDelete && <th className="p-4 text-right">Delete</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-slate-350">
                {history.length > 0 ? (
                  history.map(item => (
                    <tr
                      key={item.prediction_id}
                      onClick={() => setSelectedPrediction(item)}
                      className="hover:bg-slate-900/40 transition-colors cursor-pointer"
                    >
                      <td className="p-4 font-bold text-slate-200">
                        <span className="flex items-center space-x-1.5">
                          <span>{item.from_station}</span>
                          <ArrowRight size={11} className="text-slate-500" />
                          <span>{item.to_station}</span>
                        </span>
                      </td>
                      <td className="p-4 text-slate-400 text-[10px]">
                        Hour: {item.hour}:00 | Weather: {item.weather} | Holiday: {item.is_holiday ? "Yes" : "No"}
                      </td>
                      <td className="p-4 font-bold text-cyan-400">{item.predicted_passengers}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black border ${getCrowdBadgeColor(item.crowd_level)}`}>
                          {item.crowd_level.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500">
                        <span className="flex items-center space-x-1.5 text-[10px]">
                          <Calendar size={12} className="text-slate-600" />
                          <span>{new Date(item.prediction_time).toLocaleString()}</span>
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPrediction(item);
                          }}
                          className="p-1 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded transition-all"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                      {canDelete && (
                        <td className="p-4 text-right">
                          <button
                            onClick={(e) => handleDelete(item.prediction_id, e)}
                            className="p-1 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={canDelete ? 7 : 6} className="p-8 text-center text-slate-500 font-mono text-[10px]">
                      NO AI PREDICTIONS HAVE BEEN INQUIRED YET WITH APPLIED FILTERS.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {total > limit && (
          <div className="flex justify-center space-x-2 pt-4">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="rounded bg-slate-850 border border-slate-800 py-1.5 px-3.5 font-mono text-[10px] text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
            >
              PREV
            </button>
            <span className="flex items-center px-4 font-mono text-[10px] text-slate-500 font-bold">
              PAGE {page} OF {Math.ceil(total / limit)}
            </span>
            <button
              disabled={page >= Math.ceil(total / limit)}
              onClick={() => setPage(page + 1)}
              className="rounded bg-slate-850 border border-slate-800 py-1.5 px-3.5 font-mono text-[10px] text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
            >
              NEXT
            </button>
          </div>
        )}
      </div>

      {/* Details View Modal */}
      {selectedPrediction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 screen-only">
          <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-[#060a16] p-6 shadow-xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-850 pb-4">
              <div className="flex items-center space-x-2">
                <Cpu size={16} className="text-cyan-400" />
                <h3 className="font-mono text-sm font-black tracking-widest text-slate-200 uppercase">
                  Prediction log telemetry #PH-{selectedPrediction.prediction_id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedPrediction(null)}
                className="p-1 text-slate-500 hover:text-slate-300 hover:bg-slate-850 rounded-lg transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-6 font-mono text-xs">
              {/* Row 1: Segment Details */}
              <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-850/80 space-y-3">
                <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider pb-1.5 border-b border-slate-900 flex items-center space-x-1.5">
                  <MapPin size={12} className="text-cyan-400" />
                  <span>Segment configuration</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-[9px] text-slate-550 uppercase">From Station</span>
                    <span className="font-bold text-slate-200 text-sm">{selectedPrediction.from_station}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-slate-550 uppercase">To Station</span>
                    <span className="font-bold text-slate-200 text-sm">{selectedPrediction.to_station}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-slate-550 uppercase">Travel Distance</span>
                    <span className="font-bold text-slate-200">{selectedPrediction.distance_km} KM</span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-slate-550 uppercase">Interchange Node</span>
                    <span className="font-bold text-slate-200">{selectedPrediction.is_interchange ? "YES" : "NO"}</span>
                  </div>
                </div>
              </div>

              {/* Row 2: Scenario Parameters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-850/80 space-y-2.5">
                  <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider pb-1 border-b border-slate-900 flex items-center space-x-1.5">
                    <Calendar size={12} className="text-violet-400" />
                    <span>Temporal Variables</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="block text-[9px] text-slate-500 uppercase">Departure Interval</span>
                      <span className="font-bold text-slate-300">{selectedPrediction.hour.toString().padStart(2, '0')}:00 HRS</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-500 uppercase">Day Type</span>
                      <span className="font-bold text-slate-300 uppercase">{selectedPrediction.day_name}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-500 uppercase">Month Range</span>
                      <span className="font-bold text-slate-300">{selectedPrediction.month} (MONTH)</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-500 uppercase">Holiday Schedule</span>
                      <span className="font-bold text-slate-300">{selectedPrediction.is_holiday ? "YES" : "NO"}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-850/80 space-y-2.5">
                  <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider pb-1 border-b border-slate-900 flex items-center space-x-1.5">
                    <CloudSun size={12} className="text-cyan-400" />
                    <span>Environmental & Fare</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="block text-[9px] text-slate-500 uppercase">Weather Advisory</span>
                      <span className="font-bold text-slate-300 uppercase">{selectedPrediction.weather}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-500 uppercase">Ticket Media Type</span>
                      <span className="font-bold text-slate-300 uppercase">{selectedPrediction.ticket_type}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 3: ML Model Output & recommendations */}
              <div className="bg-[#090f20] p-4 rounded-xl border border-slate-800/80 space-y-4 border-l-4 border-l-cyan-400">
                <div className="text-[10px] font-black uppercase text-cyan-450 tracking-wider pb-1 border-b border-cyan-950/50 flex items-center space-x-1.5">
                  <Sparkles size={12} className="text-cyan-400" />
                  <span>Model Inference results</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-850">
                    <span className="block text-[8px] text-slate-500 uppercase">Predicted count</span>
                    <span className="block text-lg font-black text-cyan-400 mt-0.5">{selectedPrediction.predicted_passengers}</span>
                  </div>
                  <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-850">
                    <span className="block text-[8px] text-slate-500 uppercase">Congestion Sector</span>
                    <span className="block text-lg font-black text-violet-400 mt-0.5 uppercase">
                      {selectedPrediction.alert_status ? "CONGESTED" : "NORMAL"}
                    </span>
                  </div>
                  <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-850">
                    <span className="block text-[8px] text-slate-500 uppercase">Density Load</span>
                    <span className="block text-[10px] font-black text-green-400 mt-2 uppercase truncate">
                      {selectedPrediction.crowd_level}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="block text-[9px] text-slate-500 uppercase font-black">dispatch headways recommendation directive:</span>
                  <p className="text-slate-350 text-[11px] leading-relaxed italic bg-slate-950/40 p-3 rounded-lg border border-slate-850/40">
                    "{selectedPrediction.recommendations || "No operational adjustments required for nominal passenger flow."}"
                  </p>
                </div>
              </div>

              {/* Row 4: Alert status if applicable */}
              {selectedPrediction.alert_status && (
                <div className="bg-red-950/10 p-4 rounded-xl border border-red-900/35 flex items-center space-x-3 text-red-400">
                  <ShieldAlert size={18} className="shrink-0" />
                  <div>
                    <span className="block text-[9px] uppercase font-bold text-red-500/80">Active Congestion Severity alert triggered: [{selectedPrediction.alert_severity}]</span>
                    <p className="text-[11px] mt-0.5 font-bold leading-normal">{selectedPrediction.alert_message}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-slate-850">
              <button
                onClick={() => handleAskGrokExplanation(selectedPrediction)}
                className="flex-1 flex items-center space-x-2 rounded-xl border border-cyan-500/20 bg-cyan-500/5 py-3 font-mono text-xs font-bold text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/40 transition-all justify-center cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.05)]"
              >
                <MessageCircle size={14} />
                <span>EXPLAIN WITH METROMIND AI</span>
              </button>

              <button
                onClick={handlePrintItem}
                className="flex items-center space-x-2 rounded-xl bg-slate-800 hover:bg-slate-750 px-5 py-3 font-mono text-xs font-bold text-slate-200 transition-all justify-center cursor-pointer border border-slate-700/50"
              >
                <Printer size={14} />
                <span>PRINT DIRECTIVE</span>
              </button>

              <button
                onClick={() => setSelectedPrediction(null)}
                className="rounded-xl border border-slate-800 bg-[#070b19] px-5 py-3 font-mono text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-all cursor-pointer"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print-Only Style Template for Selected Prediction */}
      {selectedPrediction && (
        <div className="printable-content p-8 bg-white text-black font-serif text-sm max-w-4xl mx-auto space-y-6">
          <div className="text-center border-b-4 border-double border-black pb-4">
            <h1 className="text-2xl font-black uppercase tracking-wider">METROFLOW INTELLIGENT TRANSIT SYSTEM</h1>
            <h2 className="text-lg font-bold text-gray-700 mt-1 uppercase">OPERATIONAL DIRECTIVE & DISPATCH DIRECTIVE</h2>
            <div className="text-[10px] text-gray-500 font-mono mt-2 flex justify-between px-4">
              <span>REPORT REFERENCE: PH-{selectedPrediction.prediction_id}</span>
              <span>TIMESTAMP: {new Date(selectedPrediction.prediction_time).toLocaleString()}</span>
              <span>CLASSIFICATION: RESTRICTED - FOR INTERNAL OPERATIONS ONLY</span>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-base font-bold underline">1. SEGMENT METRICS</h3>
            <table className="w-full border-collapse border border-black text-xs font-mono">
              <tbody>
                <tr>
                  <td className="border border-black p-2 font-bold bg-gray-150 w-1/4">Departure Station</td>
                  <td className="border border-black p-2 w-1/4">{selectedPrediction.from_station}</td>
                  <td className="border border-black p-2 font-bold bg-gray-150 w-1/4">Arrival Station</td>
                  <td className="border border-black p-2 w-1/4">{selectedPrediction.to_station}</td>
                </tr>
                <tr>
                  <td className="border border-black p-2 font-bold bg-gray-150">Segment Distance</td>
                  <td className="border border-black p-2">{selectedPrediction.distance_km} KM</td>
                  <td className="border border-black p-2 font-bold bg-gray-150">Interchange Node</td>
                  <td className="border border-black p-2">{selectedPrediction.is_interchange ? "Yes (Hub)" : "No"}</td>
                </tr>
              </tbody>
            </table>

            <h3 className="text-base font-bold underline mt-6">2. ENVIRONMENT & TEMPORAL SCENARIO</h3>
            <table className="w-full border-collapse border border-black text-xs font-mono">
              <tbody>
                <tr>
                  <td className="border border-black p-2 font-bold bg-gray-150 w-1/4">Scheduled Hour</td>
                  <td className="border border-black p-2 w-1/4">{selectedPrediction.hour.toString().padStart(2, '0')}:00 HRS</td>
                  <td className="border border-black p-2 font-bold bg-gray-150 w-1/4">Day of Week</td>
                  <td className="border border-black p-2 w-1/4">{selectedPrediction.day_name}</td>
                </tr>
                <tr>
                  <td className="border border-black p-2 font-bold bg-gray-150">Weather Advisory</td>
                  <td className="border border-black p-2 uppercase">{selectedPrediction.weather}</td>
                  <td className="border border-black p-2 font-bold bg-gray-150">Holiday Schedule</td>
                  <td className="border border-black p-2">{selectedPrediction.is_holiday ? "Yes" : "No"}</td>
                </tr>
                <tr>
                  <td className="border border-black p-2 font-bold bg-gray-150">Fare class type</td>
                  <td className="border border-black p-2 uppercase">{selectedPrediction.ticket_type}</td>
                  <td className="border border-black p-2 font-bold bg-gray-150">Calendar Month</td>
                  <td className="border border-black p-2">{selectedPrediction.month} (Standard Cycle)</td>
                </tr>
              </tbody>
            </table>

            <h3 className="text-base font-bold underline mt-6">3. AI MODEL INFERENCE LOAD FORECAST</h3>
            <table className="w-full border-collapse border border-black text-xs font-mono">
              <tbody>
                <tr>
                  <td className="border border-black p-2 font-bold bg-gray-150 w-1/3">Predicted Passengers / Trip</td>
                  <td className="border border-black p-2 text-base font-bold text-center">{selectedPrediction.predicted_passengers}</td>
                </tr>
                <tr>
                  <td className="border border-black p-2 font-bold bg-gray-150">Sector Congestion Index</td>
                  <td className="border border-black p-2 text-center uppercase font-bold">
                    {selectedPrediction.alert_status ? "CONGESTED - RED FLAG ALERT" : "NOMINAL - CLEAR LINE"}
                  </td>
                </tr>
                <tr>
                  <td className="border border-black p-2 font-bold bg-gray-150">Line Load Category</td>
                  <td className="border border-black p-2 text-center uppercase font-bold">{selectedPrediction.crowd_level} DENSITY</td>
                </tr>
              </tbody>
            </table>

            <h3 className="text-base font-bold underline mt-6">4. DISPATCH INSTRUCTIONS & RECOMMENDED HEADWAYS</h3>
            <div className="border border-black p-3 bg-gray-50 rounded-lg text-xs leading-relaxed font-mono">
              <span className="font-bold block mb-1">OPERATIONAL TIMETABLE RECOMMENDATION:</span>
              "{selectedPrediction.recommendations || "Adjust lines capacity to normal standards. No extra headways needed."}"
            </div>

            {selectedPrediction.alert_status && (
              <div className="border-2 border-black p-3 mt-4 bg-gray-100 text-xs font-mono">
                <span className="font-bold block text-red-700">⚠️ CRITICAL CONGESTION WARNING NOTICE:</span>
                Severity Level: {selectedPrediction.alert_severity} | Alert Type: {selectedPrediction.alert_type}
                <p className="mt-1">{selectedPrediction.alert_message}</p>
              </div>
            )}
          </div>

          <div className="pt-12 text-center text-xs text-gray-500 font-mono border-t border-gray-300 flex justify-between">
            <span>METRO SYSTEM OPERATIONAL INTELLIGENCE DIVISION</span>
            <span>SIGNATURE: _______________________________</span>
          </div>
        </div>
      )}
    </CommandCenterLayout>
  );
}
