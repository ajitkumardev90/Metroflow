import React, { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default leaflet icons
if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  });
}

function MapAutoResizer() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

interface CrowdMapProps {
  stations: any[];
}

export default function CrowdMap({ stations }: CrowdMapProps) {
  // Center map on Delhi (since datasets are Delhi Metro network based)
  const defaultPosition: [number, number] = [28.6139, 77.2090];

  const getCrowdColor = (density: number) => {
    if (density > 1000) return "#ef4444"; // Red (Critical)
    if (density > 600) return "#f97316";  // Orange (High)
    if (density > 300) return "#eab308";  // Yellow (Medium)
    return "#22c55e";                     // Green (Low)
  };

  const getCrowdLevel = (density: number) => {
    if (density > 1000) return "CRITICAL";
    if (density > 600) return "HIGH";
    if (density > 300) return "MEDIUM";
    return "LOW";
  };

  return (
    <div className="h-full w-full rounded-xl overflow-hidden border border-slate-800/80 shadow-2xl relative">
      <MapContainer
        center={defaultPosition}
        zoom={11}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <MapAutoResizer />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="leaflet-dark-tiles"
          maxZoom={19}
        />
        
        {stations.map((station) => {
          const lat = parseFloat(station.latitude);
          const lng = parseFloat(station.longitude);
          
          if (isNaN(lat) || isNaN(lng)) return null;

          // Compute fake passenger density based on is_interchange and id
          const seedDensity = station.is_interchange 
            ? 700 + (station.station_id * 13) % 600 
            : 100 + (station.station_id * 7) % 500;
          
          const color = getCrowdColor(seedDensity);
          const level = getCrowdLevel(seedDensity);

          return (
            <CircleMarker
              key={station.station_id}
              center={[lat, lng]}
              radius={station.is_interchange ? 12 : 8}
              fillColor={color}
              color={color}
              weight={1}
              opacity={0.8}
              fillOpacity={0.4}
            >
              <Popup>
                <div className="p-1 font-mono text-xs text-slate-100 space-y-1">
                  <div className="font-bold border-b border-slate-700 pb-1 text-cyan-400">
                    {station.station_name}
                  </div>
                  <div>Line: {station.line_name}</div>
                  <div>Layout: {station.station_layout || "Underground"}</div>
                  <div>
                    Crowd Level:{" "}
                    <span className="font-bold" style={{ color }}>
                      {level} ({seedDensity} pass)
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Coords: {lat.toFixed(4)}, {lng.toFixed(4)}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Floating Legend */}
      <div className="absolute bottom-4 right-4 z-[1000] rounded-lg border border-slate-800/80 bg-slate-950/90 p-4 font-mono text-[10px] uppercase tracking-wider text-slate-300 backdrop-blur-md space-y-2">
        <div className="font-bold border-b border-slate-800 pb-1 text-cyan-400">Crowd Intensity</div>
        <div className="flex items-center space-x-2">
          <span className="h-3 w-3 rounded-full bg-red-500"></span>
          <span>Critical (&gt;1000 passengers)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="h-3 w-3 rounded-full bg-orange-500"></span>
          <span>High (600 - 1000 passengers)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="h-3 w-3 rounded-full bg-yellow-500"></span>
          <span>Medium (300 - 600 passengers)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="h-3 w-3 rounded-full bg-green-500"></span>
          <span>Low (&lt;300 passengers)</span>
        </div>
      </div>
    </div>
  );
}
