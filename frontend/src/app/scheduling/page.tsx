"use client";

import React, { useState, useEffect } from "react";
import CommandCenterLayout from "@/components/CommandCenterLayout";
import { api } from "@/utils/api";
import { Plus, Trash2, ShieldAlert, Calendar, Clock, Zap } from "lucide-react";

export default function SchedulingPage() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [stations, setStations] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [trains, setTrains] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Form states
  const [modalOpen, setModalOpen] = useState(false);
  const [stationId, setStationId] = useState("");
  const [routeId, setRouteId] = useState("");
  const [trainId, setTrainId] = useState("");
  const [arrivalTime, setArrivalTime] = useState("08:00");
  const [departureTime, setDepartureTime] = useState("08:02");
  const [dayType, setDayType] = useState("Daily");
  const [errorMsg, setErrorMsg] = useState("");

  // Optimization panel simulation
  const [optRecommendation, setOptRecommendation] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("metroflow_user");
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const scheduleData = await api.schedules.list();
      const stationData = await api.stations.list();
      const routeData = await api.routes.list();
      const trainData = await api.trains.list();

      setSchedules(scheduleData);
      setStations(stationData);
      setRoutes(routeData);
      setTrains(trainData);

      // Trigger automatic schedule headway check for Yellow Line
      // Yellow line has route_id = 2 typically in Delhi Metro networks or we check first route
      const firstRoute = routeData[0];
      if (firstRoute) {
        // Query prediction dynamically
        const optRes = await api.predict.run({
          hour: 9, // Peak hour check
          day_name: "Monday",
          month: 7,
          is_holiday: false,
          weather: "Clear",
          from_station: stationData[0]?.station_name || "Kashmere Gate",
          to_station: stationData[1]?.station_name || "Rajiv Chowk",
          distance_km: 4.5,
          ticket_type: "Smart Card",
          is_interchange: true
        });
        setOptRecommendation({
          lineName: firstRoute.route_name,
          color: firstRoute.route_color,
          rec: optRes.scheduling_recommendation
        });
      }

      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setStationId(stations[0]?.station_id?.toString() || "");
    setRouteId(routes[0]?.route_id?.toString() || "");
    setTrainId(trains[0]?.train_id?.toString() || "");
    setArrivalTime("08:00");
    setDepartureTime("08:02");
    setDayType("Daily");
    setErrorMsg("");
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const payload = {
      station_id: parseInt(stationId),
      route_id: parseInt(routeId),
      train_id: parseInt(trainId),
      arrival_time: arrivalTime + ":00", // append seconds
      departure_time: departureTime + ":00",
      day_type: dayType
    };

    try {
      await api.schedules.create(payload);
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create schedule entry.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to remove this timetable schedule entry?")) return;
    try {
      await api.schedules.delete(id);
      fetchData();
    } catch (err: any) {
      alert(err.message || "Could not delete schedule entry.");
    }
  };

  const getStationName = (id: number) => {
    const s = stations.find(item => item.station_id === id);
    return s ? s.station_name : `Station #${id}`;
  };

  const getRouteName = (id: number) => {
    const r = routes.find(item => item.route_id === id);
    return r ? r.route_name : `Route #${id}`;
  };

  const getTrainNumber = (id: number) => {
    const t = trains.find(item => item.train_id === id);
    return t ? t.train_number : `Train #${id}`;
  };

  if (loading) {
    return (
      <CommandCenterLayout>
        <div className="flex h-full w-full items-center justify-center text-cyan-400">
          <div className="flex flex-col items-center space-y-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
            <p className="font-mono text-xs tracking-wider text-cyan-300">COMPILING SUBWAY TIMETABLES...</p>
          </div>
        </div>
      </CommandCenterLayout>
    );
  }

  const role = currentUser?.role || "user";
  const canModify = role === "admin" || role === "manager";
  const canDelete = role === "admin";

  return (
    <CommandCenterLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h1 className="text-xl font-bold tracking-wider font-mono text-cyan-400 text-glow-cyan">
              TRAIN TIMETABLES
            </h1>
            <p className="text-xs text-slate-500 font-mono">Real-time subway transit timetables and dispatch schedules</p>
          </div>

          {canModify && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center space-x-1.5 rounded-lg bg-cyan-500 py-2.5 px-4 font-mono text-xs font-bold text-slate-900 hover:bg-cyan-400 hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all"
            >
              <Plus size={14} />
              <span>ADD STOP ENTRY</span>
            </button>
          )}
        </div>

        {/* Schedule Recommendation optimizer panel */}
        {optRecommendation && (
          <div className="rounded-xl border border-slate-800 bg-[#091124] p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-l-4 border-l-cyan-400 animate-pulse-glow">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Zap size={16} className="text-cyan-400" />
                <span className="font-mono text-xs font-bold tracking-widest text-cyan-400 uppercase">AI TIMETABLE OPTIMIZER (SCHEDULING OPTIMIZER)</span>
              </div>
              <h3 className="text-sm font-bold font-mono text-slate-200">
                Recommended Frequency for line:{" "}
                <span style={{ color: optRecommendation.color }}>{optRecommendation.lineName}</span>
              </h3>
              <p className="text-xs font-mono text-slate-400">{optRecommendation.rec?.explanation}</p>
            </div>
            
            <div className="flex items-center gap-4 bg-slate-950/60 p-4 rounded-lg border border-slate-850 shrink-0 font-mono text-xs">
              <div className="text-center px-3 border-r border-slate-800">
                <span className="block text-[9px] text-slate-500">HEADWAY</span>
                <span className="text-base font-bold text-cyan-400">{optRecommendation.rec?.recommended_headway_minutes} min</span>
              </div>
              <div className="text-center px-3 border-r border-slate-800">
                <span className="block text-[9px] text-slate-500">FREQUENCY</span>
                <span className="text-base font-bold text-violet-400">{optRecommendation.rec?.recommended_frequency_trains_per_hour}/hr</span>
              </div>
              <div className="text-center px-3">
                <span className="block text-[9px] text-slate-500">ALLOCATION</span>
                <span className="text-base font-bold text-green-400">{optRecommendation.rec?.train_allocation_adjustment}</span>
              </div>
            </div>
          </div>
        )}

        {/* Schedules Grid / List */}
        <div className="rounded-xl border border-slate-800 bg-[#070b19] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 uppercase text-[9px] tracking-wider">
                  <th className="p-4">Route Name</th>
                  <th className="p-4">Station stop</th>
                  <th className="p-4">Train Allocated</th>
                  <th className="p-4">Timetable Stops</th>
                  <th className="p-4">Service Mode</th>
                  {canDelete && <th className="p-4 text-right">Delete</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-slate-300">
                {schedules.slice(0, 50).map(s => ( // show first 50 for page speed
                  <tr key={s.schedule_id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-4 font-bold text-slate-200">
                      {getRouteName(s.route_id)}
                    </td>
                    <td className="p-4 flex items-center space-x-2">
                      <Calendar size={14} className="text-slate-500" />
                      <span>{getStationName(s.station_id)}</span>
                    </td>
                    <td className="p-4">
                      <span className="rounded bg-slate-950 border border-slate-800 px-2 py-0.5 text-cyan-400 font-bold">
                        {getTrainNumber(s.train_id)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-3 text-slate-300">
                        <span className="flex items-center space-x-1">
                          <Clock size={12} className="text-green-500/80" />
                          <span>Arr: {s.arrival_time}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock size={12} className="text-red-500/80" />
                          <span>Dep: {s.departure_time}</span>
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="rounded-full bg-slate-900 border border-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
                        {s.day_type}
                      </span>
                    </td>
                    {canDelete && (
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDelete(s.schedule_id)}
                          className="p-1.5 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {schedules.length > 50 && (
            <div className="p-4 text-center border-t border-slate-850 text-slate-500 text-[10px] uppercase tracking-wider">
              TIMETABLE TRUNCATED. TOTAL TIMETABLE STOPS: {schedules.length}
            </div>
          )}
        </div>

        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-xl border border-slate-800 bg-[#070b19] p-6 shadow-2xl">
              <h2 className="font-mono text-base font-bold text-cyan-400 tracking-widest uppercase border-b border-slate-800 pb-3 mb-4">
                Add Timetable stop
              </h2>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block font-mono text-[9px] text-slate-400 uppercase mb-1">Route / Line</label>
                  <select
                    value={routeId}
                    onChange={(e) => setRouteId(e.target.value)}
                    className="w-full rounded bg-slate-900 border border-slate-800 py-2.5 px-3 text-xs text-slate-450 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  >
                    {routes.map(r => (
                      <option key={r.route_id} value={r.route_id}>{r.route_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-[9px] text-slate-400 uppercase mb-1">Station Stop</label>
                  <select
                    value={stationId}
                    onChange={(e) => setStationId(e.target.value)}
                    className="w-full rounded bg-slate-900 border border-slate-800 py-2.5 px-3 text-xs text-slate-450 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  >
                    {stations.map(s => (
                      <option key={s.station_id} value={s.station_id}>{s.station_name} ({s.line_name})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-[9px] text-slate-400 uppercase mb-1">Assigned Train</label>
                  <select
                    value={trainId}
                    onChange={(e) => setTrainId(e.target.value)}
                    className="w-full rounded bg-slate-900 border border-slate-800 py-2.5 px-3 text-xs text-slate-450 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  >
                    {trains.map(t => (
                      <option key={t.train_id} value={t.train_id}>{t.train_number} - {t.train_name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono text-[9px] text-slate-400 uppercase mb-1">Arrival Time</label>
                    <input
                      type="time"
                      required
                      value={arrivalTime}
                      onChange={(e) => setArrivalTime(e.target.value)}
                      className="w-full rounded bg-slate-900 border border-slate-800 py-2 px-3 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[9px] text-slate-400 uppercase mb-1">Departure Time</label>
                    <input
                      type="time"
                      required
                      value={departureTime}
                      onChange={(e) => setDepartureTime(e.target.value)}
                      className="w-full rounded bg-slate-900 border border-slate-800 py-2 px-3 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-[9px] text-slate-400 uppercase mb-1">Service Mode</label>
                  <select
                    value={dayType}
                    onChange={(e) => setDayType(e.target.value)}
                    className="w-full rounded bg-slate-900 border border-slate-800 py-2 px-3 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  >
                    <option value="Daily">Daily Service</option>
                    <option value="Weekday">Weekday Only</option>
                    <option value="Weekend">Weekend Only</option>
                  </select>
                </div>

                {errorMsg && (
                  <div className="flex items-center space-x-2 rounded bg-red-950/30 border border-red-800/40 p-3 text-xs text-red-400">
                    <ShieldAlert size={14} className="shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="flex justify-end space-x-3 border-t border-slate-800/60 pt-4">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="rounded bg-slate-800 px-4 py-2 font-mono text-xs text-slate-400 hover:bg-slate-755"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    className="rounded bg-cyan-500 px-4 py-2 font-mono text-xs font-bold text-slate-900 hover:bg-cyan-400"
                  >
                    SAVE TIMETABLE
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </CommandCenterLayout>
  );
}
