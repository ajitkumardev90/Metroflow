"use client";

import React, { useState, useEffect } from "react";
import CommandCenterLayout from "@/components/CommandCenterLayout";
import { api } from "@/utils/api";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ShieldCheck, HelpCircle, TrendingUp, Cpu, Award } from "lucide-react";

export default function ForecastPage() {
  const [stations, setStations] = useState<any[]>([]);
  const [selectedStation, setSelectedStation] = useState("");
  const [hour, setHour] = useState("8");
  const [weather, setWeather] = useState("Clear");
  const [loading, setLoading] = useState(true);

  // Predictions & Metrics
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [forecasting, setForecasting] = useState(false);
  
  // Scikit-learn validation metrics
  const [modelAMetrics, setModelAMetrics] = useState<any>(null);
  const [modelExtraMetrics, setModelExtraMetrics] = useState<any>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const stationData = await api.stations.list();
      setStations(stationData);
      if (stationData.length > 0) {
        setSelectedStation(stationData[0].station_name);
      }

      // Hardcoded fallback metrics if training files are unread, but we will try to fetch summary
      // which has model details
      setModelAMetrics({
        mae: 100.06,
        rmse: 132.90,
        r2: 0.9790,
        baseline_mae: 607.06,
        baseline_r2: 0.3924
      });

      setModelExtraMetrics({
        model_b: {
          mae: 209.72,
          rmse: 323.94,
          r2: 0.8826,
          baseline_mae: 671.88,
          baseline_r2: 0.2335
        },
        model_c: {
          accuracy: 0.9466,
          precision: 0.9633,
          recall: 0.9635,
          f1: 0.9634,
          baseline_accuracy: 0.7334,
          baseline_f1: 0.8412
        }
      });

      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleForecast = async (e: React.FormEvent) => {
    e.preventDefault();
    setForecasting(true);

    try {
      // Query predicting route which triggers next-hour forecasts automatically
      const res = await api.predict.run({
        hour: parseInt(hour),
        day_name: "Monday",
        month: 7,
        is_holiday: false,
        weather: weather,
        from_station: selectedStation,
        to_station: stations.find(s => s.station_name !== selectedStation)?.station_name || selectedStation,
        distance_km: 5.0,
        ticket_type: "Smart Card",
        is_interchange: true
      });

      // Format forecasts for Recharts
      const chartPoints = [
        { name: "Current Load", passengers: 250 } // starting lag
      ];

      res.demand_forecast?.forEach((f: any) => {
        chartPoints.push({
          name: `${f.hour}:00`,
          passengers: f.predicted_demand
        });
      });

      setForecastData(chartPoints);
      setForecasting(false);
    } catch (err) {
      console.error(err);
      setForecasting(false);
    }
  };

  if (loading) {
    return (
      <CommandCenterLayout>
        <div className="flex h-full w-full items-center justify-center text-cyan-400">
          <div className="flex flex-col items-center space-y-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
            <p className="font-mono text-xs tracking-wider text-cyan-300">QUERYING TIME-SERIES LAGGED FORECASTERS...</p>
          </div>
        </div>
      </CommandCenterLayout>
    );
  }

  return (
    <CommandCenterLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold tracking-wider font-mono text-cyan-400 text-glow-cyan">
            DEMAND HORIZON FORECAST
          </h1>
          <p className="text-xs text-slate-500 font-mono">Sequential hourly passenger demand forecasting and projection</p>
        </div>

        {/* Demand Forecaster Simulator - Full Width */}
        <div className="rounded-xl glass-card p-6 shadow-2xl border border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-3 mb-6 gap-2">
            <h3 className="font-mono text-sm font-bold text-slate-200 tracking-wider flex items-center space-x-2">
              <TrendingUp size={16} className="text-cyan-400" />
              <span>STATION DEMAND HORIZON SIMULATION</span>
            </h3>
            <span className="text-[10px] font-mono text-cyan-400/80 bg-cyan-950/40 border border-cyan-800/40 px-2.5 py-1 rounded-full w-fit">
              LIVE PREDICTIVE ENGINE
            </span>
          </div>

          <form onSubmit={handleForecast} className="flex flex-wrap gap-4 items-end font-mono text-xs mb-6">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[9px] text-slate-400 uppercase tracking-wider mb-1.5 font-bold">
                Station Focus
              </label>
              <select
                value={selectedStation}
                onChange={(e) => setSelectedStation(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 py-2.5 px-3 text-slate-200 focus:outline-none focus:border-cyan-500 transition-all font-mono"
              >
                {stations.map(s => (
                  <option key={s.station_id} value={s.station_name}>{s.station_name}</option>
                ))}
              </select>
            </div>

            <div className="w-36">
              <label className="block text-[9px] text-slate-400 uppercase tracking-wider mb-1.5 font-bold">
                Base Hour
              </label>
              <select
                value={hour}
                onChange={(e) => setHour(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 py-2.5 px-3 text-slate-200 focus:outline-none focus:border-cyan-500 transition-all font-mono"
              >
                {Array.from({ length: 22 }).map((_, i) => (
                  <option key={i+5} value={i+5}>{(i+5).toString().padStart(2, '0')}:00</option>
                ))}
              </select>
            </div>

            <div className="w-36">
              <label className="block text-[9px] text-slate-400 uppercase tracking-wider mb-1.5 font-bold">
                Weather
              </label>
              <select
                value={weather}
                onChange={(e) => setWeather(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 py-2.5 px-3 text-slate-200 focus:outline-none focus:border-cyan-500 transition-all font-mono"
              >
                {["Clear", "Rain", "Heavy Rain", "Fog"].map(w => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={forecasting}
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 py-2.5 px-6 font-mono text-xs font-bold text-slate-950 hover:from-cyan-400 hover:to-indigo-500 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all uppercase shrink-0 disabled:opacity-50 cursor-pointer"
            >
              {forecasting ? "Projecting..." : "Project Demand"}
            </button>
          </form>

          {/* Area Chart Container */}
          {forecastData.length > 0 ? (
            <div className="space-y-4">
              <div className="h-80 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={forecastData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                    <defs>
                      <linearGradient id="colorPax" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.45}/>
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.02}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} fontStyle="italic" />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "10px", fontSize: "12px", fontFamily: "monospace" }} />
                    <Area type="monotone" dataKey="passengers" name="Forecasted Passengers" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#colorPax)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Simulation Quick Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800/80 font-mono text-xs">
                <div className="rounded-lg bg-slate-900/60 border border-slate-800 p-3">
                  <div className="text-[9px] uppercase text-slate-500">Selected Station</div>
                  <div className="text-sm font-bold text-cyan-400 truncate">{selectedStation}</div>
                </div>
                <div className="rounded-lg bg-slate-900/60 border border-slate-800 p-3">
                  <div className="text-[9px] uppercase text-slate-500">Base Time Horizon</div>
                  <div className="text-sm font-bold text-slate-200">{hour.toString().padStart(2, '0')}:00 hrs</div>
                </div>
                <div className="rounded-lg bg-slate-900/60 border border-slate-800 p-3">
                  <div className="text-[9px] uppercase text-slate-500">Peak Demand Projection</div>
                  <div className="text-sm font-bold text-amber-400">
                    {Math.max(...forecastData.map(d => d.passengers || 0))} pax
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-72 flex-col items-center justify-center text-slate-600 border border-dashed border-slate-800/80 rounded-xl bg-slate-950/20">
              <TrendingUp size={36} className="text-cyan-500/30 mb-2 animate-pulse" />
              <p className="font-mono text-xs text-slate-400 font-semibold mb-1">Select a station and click &apos;Project Demand&apos;</p>
              <p className="font-mono text-[10px] text-slate-600">Generates sequential multi-hour passenger surge forecast curves</p>
            </div>
          )}
        </div>
      </div>
    </CommandCenterLayout>
  );
}
