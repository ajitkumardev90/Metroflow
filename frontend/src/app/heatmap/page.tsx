"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import CommandCenterLayout from "@/components/CommandCenterLayout";
import { api } from "@/utils/api";

// Dynamically import the map component with SSR disabled
const CrowdMap = dynamic(() => import("@/components/CrowdMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-slate-950 text-cyan-400 border border-slate-800 rounded-xl">
      <div className="flex flex-col items-center space-y-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
        <p className="font-mono text-xs tracking-wider text-cyan-300">MOUNTING MAP GRAPHICS SYSTEM...</p>
      </div>
    </div>
  )
});

export default function HeatmapPage() {
  const [stations, setStations] = useState<any[]>([]);
  const [selectedLine, setSelectedLine] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getStationsData = async () => {
      try {
        const data = await api.stations.list();
        setStations(data);
        setLoading(false);
      } catch (err) {
        console.error("Heatmap station fetch error:", err);
        setLoading(false);
      }
    };
    getStationsData();
  }, []);

  const lines = ["ALL", ...Array.from(new Set(stations.map(s => s.line_name).filter(Boolean)))];

  const filteredStations = selectedLine === "ALL" 
    ? stations 
    : stations.filter(s => s.line_name === selectedLine);

  return (
    <CommandCenterLayout>
      <div className="flex flex-col space-y-4 h-[calc(100vh-140px)] min-h-[600px]">
        {/* Header & Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div>
            <h1 className="text-xl font-bold tracking-wider font-mono text-cyan-400 text-glow-cyan">
              CONGESTION HEATMAP
            </h1>
            <p className="text-xs text-slate-500 font-mono">
              Interactive geographic visualization of real-time passenger densities ({filteredStations.length} nodes)
            </p>
          </div>

          {/* Line Selector */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 max-w-xl">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest shrink-0">Line:</span>
            <select
              value={selectedLine}
              onChange={(e) => setSelectedLine(e.target.value)}
              className="rounded-lg bg-slate-900 border border-slate-800 py-1.5 px-3 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              {lines.map((l: any) => (
                <option key={l} value={l}>{l === "ALL" ? "All Metro Lines" : l}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Map Frame Container */}
        <div className="flex-1 w-full rounded-xl overflow-hidden border border-slate-800/80 bg-slate-950 relative min-h-[450px]">
          {!loading ? (
            <CrowdMap stations={filteredStations} />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-950 text-cyan-400">
              <div className="flex flex-col items-center space-y-4">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
                <p className="font-mono text-xs tracking-wider text-cyan-300">SYNCING COORDINATE MATRIX...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </CommandCenterLayout>
  );
}
