"use client";

import React, { useState, useEffect } from "react";
import CommandCenterLayout from "@/components/CommandCenterLayout";
import { api } from "@/utils/api";
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Activity,
  Milestone,
  AlertTriangle,
  Cpu,
  RefreshCw,
  Search,
  MessageCircle,
  MapPin,
  TrendingUp,
  Clock,
  ArrowRight
} from "lucide-react";

export default function ReportsPage() {
  const [stations, setStations] = useState<any[]>([]);
  const [loadingStations, setLoadingStations] = useState(true);

  // Filter state
  const [reportType, setReportType] = useState("System Summary");
  const [selectedStation, setSelectedStation] = useState("");
  const [selectedCrowd, setSelectedCrowd] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState("");

  // Report output state
  const [generating, setGenerating] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    try {
      const data = await api.stations.list();
      setStations(data || []);
      setLoadingStations(false);
    } catch (err) {
      console.error("Failed to load stations:", err);
      setLoadingStations(false);
    }
  };

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setErrorMsg("");
    setReportData(null);

    const params = {
      report_type: reportType,
      station: selectedStation || undefined,
      crowd_level: selectedCrowd || undefined,
      alert_severity: selectedSeverity || undefined
    };

    try {
      const res = await api.reports.generate(params);
      setReportData(res);
      setGenerating(false);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to generate system report telemetry.");
      setGenerating(false);
    }
  };

  const handleExportCSV = () => {
    if (!reportData || !reportData.predictions_log) return;
    
    const logs = reportData.predictions_log;
    
    // Define headers
    const headers = [
      "Prediction ID",
      "Query Time",
      "From Station",
      "To Station",
      "Hour",
      "Day",
      "Month",
      "Weather",
      "Ticket Type",
      "Holiday",
      "Interchange",
      "Distance (KM)",
      "Predicted Passengers",
      "Crowd Density Level",
      "Scheduling Recommendations",
      "Alert severity"
    ];

    // Build rows
    const rows = logs.map((p: any) => [
      p.prediction_id,
      p.prediction_time,
      p.from_station,
      p.to_station,
      p.hour,
      p.day_name,
      p.month,
      p.weather,
      p.ticket_type,
      p.is_holiday ? "Yes" : "No",
      p.is_interchange ? "Yes" : "No",
      p.distance_km,
      p.predicted_passengers,
      p.crowd_level,
      `"${(p.recommendations || "").replace(/"/g, '""')}"`,
      p.alert_severity || "None"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map((e: any) => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `MetroFlow_${reportType.replace(/\s+/g, '_')}_Report_${reportData.report_id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <CommandCenterLayout>
      {/* 1. Normal UI Screen - Hidden on Print */}
      <div className="space-y-6 screen-only">
        {/* Header */}
        <div className="border-b border-slate-850 pb-5">
          <h1 className="text-lg font-black tracking-widest text-cyan-400 text-glow-cyan uppercase font-mono">
            SYSTEM REPORT GENERATOR
          </h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5 font-mono">
            Compile operational summaries, prediction audits, headway optimizations, and alerts into downloadable documents
          </p>
        </div>

        {/* Input Parameters panel */}
        <div className="rounded-2xl border border-slate-850 bg-[#060a16] p-5 shadow-md">
          <form onSubmit={handleGenerateReport} className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono text-xs font-bold">
            <div>
              <label className="block text-[8px] text-slate-500 uppercase mb-1.5">Report Scope Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/60 py-2.5 px-3 text-slate-350 focus:outline-none focus:border-cyan-500/60 transition-all cursor-pointer"
              >
                <option value="System Summary">System Operational Summary</option>
                <option value="AI Predictions Audit">AI Crowd Inference Audit</option>
                <option value="Scheduling Optimization">Scheduling & Dispatch optimization</option>
                <option value="Congestion & Alert Analysis">Congestion Severity & Alert analysis</option>
              </select>
            </div>

            <div>
              <label className="block text-[8px] text-slate-500 uppercase mb-1.5">Station focus (Optional)</label>
              <select
                value={selectedStation}
                onChange={(e) => setSelectedStation(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/60 py-2.5 px-3 text-slate-350 focus:outline-none focus:border-cyan-500/60 transition-all cursor-pointer"
                disabled={loadingStations}
              >
                <option value="">ALL STATIONS</option>
                {stations.map(s => (
                  <option key={s.station_id} value={s.station_name}>{s.station_name.toUpperCase()}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[8px] text-slate-500 uppercase mb-1.5">Density classification</label>
              <select
                value={selectedCrowd}
                onChange={(e) => setSelectedCrowd(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/60 py-2.5 px-3 text-slate-350 focus:outline-none focus:border-cyan-500/60 transition-all cursor-pointer"
              >
                <option value="">ALL CROWD LEVELS</option>
                <option value="Low">Low Density</option>
                <option value="Medium">Medium Density</option>
                <option value="High">High Density</option>
                <option value="Very High">Very High Density</option>
              </select>
            </div>

            <div>
              <label className="block text-[8px] text-slate-500 uppercase mb-1.5">Alert Severity</label>
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/60 py-2.5 px-3 text-slate-350 focus:outline-none focus:border-cyan-500/60 transition-all cursor-pointer"
              >
                <option value="">ALL SEVERITY LEVELS</option>
                <option value="Low">Low Severity</option>
                <option value="Medium">Medium Severity</option>
                <option value="High">High Severity</option>
                <option value="Critical">Critical Severity</option>
              </select>
            </div>

            <div className="md:col-span-4 pt-2">
              <button
                type="submit"
                disabled={generating}
                className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 py-3 font-mono text-[9px] font-black uppercase tracking-widest text-slate-950 hover:from-cyan-400 hover:to-indigo-500 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all duration-300 disabled:opacity-50 cursor-pointer flex items-center justify-center space-x-2"
              >
                {generating ? (
                  <>
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    <span>COMPILING SYSTEM TELEMETRY AND AI DIRECTIVES...</span>
                  </>
                ) : (
                  <>
                    <FileText className="h-3.5 w-3.5" />
                    <span>COMPILE OPERATIONAL REPORT</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {errorMsg && (
          <div className="flex items-center space-x-2 rounded-xl bg-red-950/20 border border-red-900/30 p-3 text-red-400 font-mono text-xs">
            <AlertTriangle size={14} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Report Preview Panel */}
        {reportData ? (
          <div className="space-y-6">
            {/* Actions Bar */}
            <div className="flex items-center justify-between bg-slate-950/40 p-4 rounded-xl border border-slate-850">
              <div className="font-mono text-xs text-slate-400">
                REPORT COMPILED: <span className="font-bold text-cyan-400">#{reportData.report_id}</span>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleExportCSV}
                  disabled={reportData.predictions_log.length === 0}
                  className="flex items-center space-x-1.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-850 px-4 py-2 font-mono text-[10px] text-slate-300 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Download size={13} />
                  <span>EXPORT CSV</span>
                </button>
                <button
                  onClick={handlePrintPDF}
                  className="flex items-center space-x-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 px-4 py-2 font-mono text-[10px] text-slate-950 font-bold transition-all cursor-pointer"
                >
                  <Printer size={13} />
                  <span>PRINT PDF / REPORT</span>
                </button>
              </div>
            </div>

            {/* Document Preview Shell */}
            <div className="rounded-2xl border border-slate-850 bg-[#070b19] p-6 md:p-8 space-y-6 shadow-xl relative overflow-hidden">
              {/* Report Header watermark */}
              <div className="absolute top-0 right-0 p-4 font-mono text-[8px] text-slate-700 tracking-wider font-bold select-none border-b border-l border-slate-900">
                RESTRICTED DIRECTIVE
              </div>

              {/* Header block */}
              <div className="border-b-2 border-slate-800 pb-5 space-y-2">
                <div className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-cyan-400" />
                  <span className="text-[10px] font-black text-cyan-400 tracking-widest uppercase font-mono">MetroFlow operations Command center</span>
                </div>
                <h2 className="text-xl font-black text-slate-200 uppercase tracking-widest font-mono">
                  {reportType} Telemetry Report
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-[10px] text-slate-500 pt-2">
                  <div>
                    <span className="block text-[8px] uppercase">Report ID</span>
                    <span className="font-bold text-slate-350">{reportData.report_id}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] uppercase">Compiled At</span>
                    <span className="font-bold text-slate-350">{new Date(reportData.generated_at).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] uppercase">Issuer Role</span>
                    <span className="font-bold text-slate-350">{reportData.operator_name} (Operator)</span>
                  </div>
                  <div>
                    <span className="block text-[8px] uppercase">Predictions Analyzed</span>
                    <span className="font-bold text-cyan-400">{reportData.summary_metrics.total_predictions} records</span>
                  </div>
                </div>
              </div>

              {/* KPI Summaries */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-950/45 p-4 rounded-xl border border-slate-850/80 text-center space-y-1">
                  <span className="block text-[8px] font-black text-slate-500 uppercase tracking-wider">Total Predictions Inquired</span>
                  <span className="block text-2xl font-black text-slate-300 font-mono">{reportData.summary_metrics.total_predictions}</span>
                </div>
                <div className="bg-slate-950/45 p-4 rounded-xl border border-slate-850/80 text-center space-y-1">
                  <span className="block text-[8px] font-black text-slate-500 uppercase tracking-wider">Avg Predicted Passenger Load</span>
                  <span className="block text-2xl font-black text-cyan-400 font-mono">{reportData.summary_metrics.avg_predicted_passengers}</span>
                </div>
                <div className="bg-slate-950/45 p-4 rounded-xl border border-slate-850/80 text-center space-y-1">
                  <span className="block text-[8px] font-black text-slate-500 uppercase tracking-wider">Congestion Ratio (Red / Orange)</span>
                  <span className="block text-2xl font-black text-violet-400 font-mono">{reportData.summary_metrics.congestion_ratio}%</span>
                </div>
                <div className="bg-slate-950/45 p-4 rounded-xl border border-slate-850/80 text-center space-y-1">
                  <span className="block text-[8px] font-black text-slate-500 uppercase tracking-wider">Inference Alerts Triggered</span>
                  <span className="block text-2xl font-black text-red-500 font-mono">{reportData.summary_metrics.alert_count}</span>
                </div>
              </div>

              {/* AI Copilot grounded summary */}
              <div className="bg-[#090f20] p-4 rounded-xl border border-slate-800/80 space-y-2.5 border-l-4 border-l-cyan-400">
                <div className="flex items-center space-x-2 text-[10px] font-black text-cyan-400 uppercase tracking-wider border-b border-cyan-950/40 pb-1.5">
                  <MessageCircle size={14} />
                  <span>METROMIND AI EXECUTIVE OPERATIONS SUMMARY</span>
                </div>
                <p className="text-xs font-mono text-slate-350 leading-relaxed italic bg-slate-950/40 p-3 rounded-lg border border-slate-850/40">
                  "{reportData.ai_insights}"
                </p>
              </div>

              {/* Busiest Station Flow Loads & Route Performance */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Stations */}
                <div className="bg-slate-950/30 p-4 rounded-xl border border-slate-850 space-y-3">
                  <div className="text-[9px] font-black uppercase text-slate-400 tracking-wider pb-1 border-b border-slate-900 flex items-center space-x-1.5">
                    <MapPin size={12} className="text-cyan-400" />
                    <span>Top system station loads</span>
                  </div>
                  <div className="space-y-2">
                    {reportData.station_metrics.length > 0 ? (
                      reportData.station_metrics.map((s: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-[10px] font-mono border-b border-slate-900 pb-1 last:border-b-0">
                          <span className="text-slate-300 font-bold">{idx + 1}. {s.station_name}</span>
                          <span className="text-cyan-400 font-black">{s.total_flow} PAX</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-slate-600 font-mono italic">No station telemetry logged.</p>
                    )}
                  </div>
                </div>

                {/* Routes */}
                <div className="bg-slate-950/30 p-4 rounded-xl border border-slate-850 space-y-3">
                  <div className="text-[9px] font-black uppercase text-slate-400 tracking-wider pb-1 border-b border-slate-900 flex items-center space-x-1.5">
                    <Milestone size={12} className="text-violet-400" />
                    <span>Route Line Load volumes</span>
                  </div>
                  <div className="space-y-2">
                    {reportData.route_metrics.length > 0 ? (
                      reportData.route_metrics.map((r: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-[10px] font-mono border-b border-slate-900 pb-1 last:border-b-0">
                          <span className="text-slate-300 font-bold" style={{ color: r.route_color || undefined }}>{r.route_name}</span>
                          <span className="text-slate-350 font-black">{r.total_flow} riders</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-slate-600 font-mono italic">No route telemetry logged.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Active warnings and delays */}
              <div className="bg-slate-950/30 p-4 rounded-xl border border-slate-850 space-y-3">
                <div className="text-[9px] font-black uppercase text-slate-400 tracking-wider pb-1 border-b border-slate-900 flex items-center space-x-1.5">
                  <AlertTriangle size={12} className="text-red-500" />
                  <span>Active Congestion warnings & Timetable Delays</span>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {reportData.active_alerts.length > 0 ? (
                    reportData.active_alerts.map((a: any, idx: number) => (
                      <div key={idx} className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-850 flex justify-between items-start text-[10px] font-mono">
                        <div>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-black mr-2 ${
                            a.severity === "Critical" ? "bg-red-950 text-red-400 border border-red-800" : "bg-orange-950 text-orange-400 border border-orange-850"
                          }`}>
                            {a.severity.toUpperCase()}
                          </span>
                          <span className="font-bold text-slate-200">{a.alert_type} @ {a.station_name}</span>
                          <p className="text-slate-400 mt-1">{a.message}</p>
                        </div>
                        <span className="text-slate-550 text-[9px] whitespace-nowrap">{new Date(a.created_at).toLocaleTimeString()}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] text-slate-650 font-mono italic">Nominal status. No active unresolved delays detected.</p>
                  )}
                </div>
              </div>

              {/* Prediction details logs */}
              <div className="space-y-3">
                <div className="text-[9px] font-black uppercase text-slate-400 tracking-wider pb-1 border-b border-slate-900 flex items-center space-x-1.5">
                  <Cpu size={12} className="text-cyan-400" />
                  <span>Audited crowd prediction logs ({reportData.predictions_log.length} records)</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-[10px] border border-slate-850/80 rounded-lg overflow-hidden">
                    <thead>
                      <tr className="border-b border-slate-850 text-slate-500 uppercase text-[8px] bg-slate-950/75">
                        <th className="p-3">Log segment</th>
                        <th className="p-3">Environment</th>
                        <th className="p-3 text-right">load</th>
                        <th className="p-3">Density</th>
                        <th className="p-3">Headway Optimizations</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 text-slate-350">
                      {reportData.predictions_log.length > 0 ? (
                        reportData.predictions_log.map((p: any) => (
                          <tr key={p.prediction_id} className="hover:bg-slate-900/10">
                            <td className="p-3 font-bold text-slate-200">
                              {p.from_station} → {p.to_station}
                            </td>
                            <td className="p-3 text-slate-400">
                              Hr: {p.hour}:00 | Wx: {p.weather} | Dist: {p.distance_km}km
                            </td>
                            <td className="p-3 font-bold text-cyan-400 text-right">{p.predicted_passengers}</td>
                            <td className="p-3 font-bold uppercase" style={{ color: p.crowd_level === "Very High" || p.crowd_level === "High" ? "#f97316" : "#10b981" }}>
                              {p.crowd_level}
                            </td>
                            <td className="p-3 text-slate-400 max-w-xs truncate italic">
                              "{p.recommendations || "Nominal schedules."}"
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-slate-600">No predictions compiled inside this report scope.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-600 border border-dashed border-slate-850/80 rounded-2xl bg-slate-950/10 p-8 text-center min-h-[300px]">
            <FileText size={35} className="text-cyan-500/25 mb-2" />
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Awaiting Report Compilation</h4>
            <p className="text-[10px] text-slate-600 max-w-xs leading-normal">Configure the report parameters above and click "Compile Operational Report" to compile active operational telemetry and AI headway guidelines.</p>
          </div>
        )}
      </div>

      {/* 2. Custom Printer-Friendly layout for PDF/Window printing */}
      {reportData && (
        <div className="printable-content p-8 bg-white text-black font-serif text-sm max-w-5xl mx-auto space-y-6">
          {/* Print Header */}
          <div className="text-center border-b-4 border-double border-black pb-4">
            <h1 className="text-2xl font-black uppercase tracking-wider">METROFLOW INTELLIGENT METRO SYSTEM</h1>
            <h2 className="text-lg font-bold text-gray-700 mt-1 uppercase">OPERATIONAL COMMAND CENTER SYSTEM DIRECTIVE</h2>
            <div className="text-[9px] text-gray-500 font-mono mt-2 flex justify-between px-4">
              <span>REPORT ID: {reportData.report_id}</span>
              <span>COMPILED AT: {new Date(reportData.generated_at).toLocaleString()}</span>
              <span>ISSUED BY: {reportData.operator_name} (OPERATOR ID: OP-98)</span>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-base font-bold underline">1. DIRECTIVE OVERVIEW & METRICS</h3>
            <table className="w-full border-collapse border border-black text-xs font-mono text-left">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-black p-2">Total Scenarios Audited</th>
                  <th className="border border-black p-2">Avg Passenger Density</th>
                  <th className="border border-black p-2">Line Congestion Ratio</th>
                  <th className="border border-black p-2">Alert Triggers Active</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black p-2 text-center font-bold">{reportData.summary_metrics.total_predictions}</td>
                  <td className="border border-black p-2 text-center font-bold">{reportData.summary_metrics.avg_predicted_passengers}</td>
                  <td className="border border-black p-2 text-center font-bold">{reportData.summary_metrics.congestion_ratio}%</td>
                  <td className="border border-black p-2 text-center font-bold">{reportData.summary_metrics.alert_count}</td>
                </tr>
              </tbody>
            </table>

            <h3 className="text-base font-bold underline mt-6">2. METROMIND AI EXECUTIVE OPERATIONS ANALYSIS</h3>
            <div className="border border-black p-3 bg-gray-50 text-xs leading-relaxed font-mono italic">
              "{reportData.ai_insights}"
            </div>

            <div className="grid grid-cols-2 gap-6 mt-6">
              <div>
                <h3 className="text-sm font-bold underline mb-2">3. STATION RIDERSHIP FLOWS</h3>
                <table className="w-full border-collapse border border-black text-[10px] font-mono">
                  <thead>
                    <tr className="bg-gray-150">
                      <th className="border border-black p-1">Station Name</th>
                      <th className="border border-black p-1">Ridership count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.station_metrics.slice(0, 5).map((s: any, idx: number) => (
                      <tr key={idx}>
                        <td className="border border-black p-1">{s.station_name}</td>
                        <td className="border border-black p-1 font-bold text-center">{s.total_flow} PAX</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <h3 className="text-sm font-bold underline mb-2">4. ROUTE RIDERSHIP DISTRIBUTION</h3>
                <table className="w-full border-collapse border border-black text-[10px] font-mono">
                  <thead>
                    <tr className="bg-gray-150">
                      <th className="border border-black p-1">Route Line</th>
                      <th className="border border-black p-1">Daily flow volume</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.route_metrics.map((r: any, idx: number) => (
                      <tr key={idx}>
                        <td className="border border-black p-1 font-bold">{r.route_name}</td>
                        <td className="border border-black p-1 text-center">{r.total_flow}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <h3 className="text-base font-bold underline mt-6">5. ACTIVE CONGESTION WARNINGS & TRANSIT DELAYS</h3>
            <table className="w-full border-collapse border border-black text-[10px] font-mono">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-black p-1">Severity</th>
                  <th className="border border-black p-1">Alert Category</th>
                  <th className="border border-black p-1">Affected Node</th>
                  <th className="border border-black p-1">Message Detail</th>
                </tr>
              </thead>
              <tbody>
                {reportData.active_alerts.length > 0 ? (
                  reportData.active_alerts.map((a: any, idx: number) => (
                    <tr key={idx}>
                      <td className="border border-black p-1 text-center font-bold uppercase">{a.severity}</td>
                      <td className="border border-black p-1">{a.alert_type}</td>
                      <td className="border border-black p-1">{a.station_name}</td>
                      <td className="border border-black p-1">{a.message}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="border border-black p-2 text-center text-gray-500">Nominal operations. No delays in effect.</td>
                  </tr>
                )}
              </tbody>
            </table>

            <h3 className="text-base font-bold underline mt-6">6. AUDITED SCENARIO SIMULATIONS</h3>
            <table className="w-full border-collapse border border-black text-[9px] font-mono">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-black p-1">Trip Segment</th>
                  <th className="border border-black p-1">Temporal / Wx</th>
                  <th className="border border-black p-1 text-center">Load</th>
                  <th className="border border-black p-1 text-center">Density</th>
                  <th className="border border-black p-1">Timetable headway recommendation directive</th>
                </tr>
              </thead>
              <tbody>
                {reportData.predictions_log.slice(0, 10).map((p: any) => (
                  <tr key={p.prediction_id}>
                    <td className="border border-black p-1 font-bold">{p.from_station} → {p.to_station}</td>
                    <td className="border border-black p-1">Hr: {p.hour}:00 | Wx: {p.weather}</td>
                    <td className="border border-black p-1 text-center font-bold">{p.predicted_passengers}</td>
                    <td className="border border-black p-1 text-center uppercase font-bold">{p.crowd_level}</td>
                    <td className="border border-black p-1 italic">"{p.recommendations || "Keep normal service."}"</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {reportData.predictions_log.length > 10 && (
              <div className="text-[9px] text-gray-500 font-mono italic">
                * Note: Showing first 10 records. Total of {reportData.predictions_log.length} records available in export dataset.
              </div>
            )}
          </div>

          <div className="pt-12 text-center text-xs text-gray-500 font-mono border-t border-gray-300 flex justify-between">
            <span>METRO OPERATIONS COMMAND CENTRAL COMMISSION</span>
            <span>DIRECTOR SIGN-OFF: _______________________________</span>
          </div>
        </div>
      )}
    </CommandCenterLayout>
  );
}
