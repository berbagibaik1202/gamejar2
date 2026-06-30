/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { CheckCircle, RotateCcw, Network, HelpCircle, Activity } from "lucide-react";
import { sfx } from "../../utils/audio";

interface Device {
  id: string;
  name: string;
  type: "router" | "switch" | "pc";
  icon: string;
  x: number; // visual percent coordinates on workspace
  y: number;
}

interface Connection {
  from: string;
  to: string;
  cableType: "straight" | "crossover" | "console";
  isValid: boolean;
}

const DEVICES: Device[] = [
  { id: "router", name: "Router Utama", type: "router", icon: "🌐", x: 50, y: 15 },
  { id: "switch", name: "Switch Utama", type: "switch", icon: "🎛️", x: 50, y: 50 },
  { id: "pc1", name: "PC Staf Admin", type: "pc", icon: "🖥️", x: 20, y: 80 },
  { id: "pc2", name: "PC Keuangan", type: "pc", icon: "🖥️", x: 50, y: 80 },
  { id: "pc3", name: "PC Kepala Sekolah", type: "pc", icon: "🖥️", x: 80, y: 80 },
];

type CableType = "straight" | "crossover" | "console";

interface TopologySimProps {
  onSuccess: () => void;
  onClose: () => void;
}

export default function TopologySim({ onSuccess, onClose }: TopologySimProps) {
  const [selectedCable, setSelectedCable] = useState<CableType>("straight");
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [feedback, setFeedback] = useState<string>("Pilih tipe kabel di laci bawah (pilih Straight-Through), lalu klik dua perangkat berturut-turut untuk menyambungkannya.");

  const handleDeviceClick = (deviceId: string) => {
    sfx.playClick();
    if (selectedDevice === null) {
      setSelectedDevice(deviceId);
      setFeedback(`Dipilih: ${DEVICES.find((d) => d.id === deviceId)?.name}. Klik perangkat tujuan untuk memasang kabel.`);
    } else {
      if (selectedDevice === deviceId) {
        setSelectedDevice(null);
        setFeedback("Pemilihan dibatalkan.");
        return;
      }

      // Check if connection already exists in some direction
      const exists = connections.some(
        (c) => (c.from === selectedDevice && c.to === deviceId) || (c.from === deviceId && c.to === selectedDevice)
      );

      if (exists) {
        sfx.playError();
        setFeedback("Kedua perangkat tersebut sudah tersambung! Hapus koneksi atau sambungkan ke perangkat lain.");
        setSelectedDevice(null);
        return;
      }

      // Determine validity of cable type
      const dev1 = DEVICES.find((d) => d.id === selectedDevice)!;
      const dev2 = DEVICES.find((d) => d.id === deviceId)!;

      let isValid = false;
      let errorReason = "";

      // Rules:
      // PC to Switch (Different devices) => Straight-Through
      // Switch to Router (Different devices) => Straight-Through
      // PC to PC (Same devices) => Crossover
      // PC to Router console interface => Console
      if (selectedCable === "straight") {
        if (
          (dev1.type === "pc" && dev2.type === "switch") ||
          (dev2.type === "pc" && dev1.type === "switch") ||
          (dev1.type === "switch" && dev2.type === "router") ||
          (dev2.type === "switch" && dev1.type === "router")
        ) {
          isValid = true;
        } else {
          errorReason = "Straight-Through digunakan untuk menghubungkan dua perangkat yang BERBEDA jenis (misal PC ke Switch).";
        }
      } else if (selectedCable === "crossover") {
        if (
          (dev1.type === "pc" && dev2.type === "pc") ||
          (dev1.type === "router" && dev2.type === "router") ||
          (dev1.type === "switch" && dev2.type === "switch")
        ) {
          isValid = true;
        } else {
          errorReason = "Crossover digunakan khusus untuk menyambungkan dua perangkat yang SEJENIS (misal Switch ke Switch, PC ke PC).";
        }
      } else if (selectedCable === "console") {
        if (
          (dev1.type === "pc" && dev2.type === "router") ||
          (dev2.type === "pc" && dev1.type === "router")
        ) {
          isValid = true;
          errorReason = "Kabel console terhubung! Namun, ini digunakan untuk manajemen CLI, bukan untuk transmisi data jaringan utama.";
          isValid = false; // Cannot complete main topological data loop with console cable
        } else {
          errorReason = "Kabel console hanya digunakan untuk menghubungkan Port Serial PC ke Port Console Router.";
        }
      }

      const newConnection: Connection = {
        from: selectedDevice,
        to: deviceId,
        cableType: selectedCable,
        isValid
      };

      setConnections((prev) => [...prev, newConnection]);
      setSelectedDevice(null);

      if (isValid) {
        sfx.playSuccess();
        setFeedback(`Koneksi berhasil! ${dev1.name} terhubung ke ${dev2.name} menggunakan kabel Straight-Through. Sinyal menyala HIJAU.`);
      } else {
        sfx.playError();
        setFeedback(`Koneksi Gagal! Sinyal MERAH. Alasan: ${errorReason || "Kabel tidak sesuai dengan standar jaringan."}`);
      }
    }
  };

  const removeConnection = (index: number) => {
    sfx.playClick();
    setConnections((prev) => prev.filter((_, i) => i !== index));
    setFeedback("Koneksi dihapus. Konfigurasikan kembali dengan kabel yang tepat.");
  };

  const handleReset = () => {
    sfx.playClick();
    setConnections([]);
    setSelectedDevice(null);
    setFeedback("Pilih tipe kabel di laci bawah (pilih Straight-Through), lalu klik dua perangkat berturut-turut untuk menyambungkannya.");
  };

  // Evaluate if the topology is complete
  // To complete: PC1-Switch, PC2-Switch, PC3-Switch, Switch-Router must all have valid connections
  const pc1Linked = connections.some((c) => c.isValid && ((c.from === "pc1" && c.to === "switch") || (c.from === "switch" && c.to === "pc1")));
  const pc2Linked = connections.some((c) => c.isValid && ((c.from === "pc2" && c.to === "switch") || (c.from === "switch" && c.to === "pc2")));
  const pc3Linked = connections.some((c) => c.isValid && ((c.from === "pc3" && c.to === "switch") || (c.from === "switch" && c.to === "pc3")));
  const routerLinked = connections.some((c) => c.isValid && ((c.from === "switch" && c.to === "router") || (c.from === "router" && c.to === "switch")));

  const isTopologyComplete = pc1Linked && pc2Linked && pc3Linked && routerLinked;

  return (
    <div className="fixed inset-0 bg-slate-950/90 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl rounded-xl shadow-2xl overflow-hidden flex flex-col h-[90vh]">
        {/* Header */}
        <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center">
          <div>
            <span className="text-xs font-mono px-2 py-1 bg-emerald-950 text-emerald-400 rounded border border-emerald-800 uppercase mr-2">
              Level 3
            </span>
            <h2 className="text-xl font-bold text-white inline-block">Simulasi: Merancang Topologi Bintang (Star)</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded-md text-sm transition"
          >
            Keluar Game
          </button>
        </div>

        {/* Workspace */}
        <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto">
          
          {/* Left Column: Connections List & Instructions */}
          <div className="lg:col-span-4 bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2 border-b border-slate-800 pb-2">
                <Network className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                  Daftar Sambungan Kabel
                </h3>
              </div>

              {connections.length === 0 ? (
                <div className="text-xs text-slate-500 italic p-4 text-center border border-dashed border-slate-800 rounded bg-slate-900/10">
                  Belum ada kabel yang terpasang pada rancangan topologi ini.
                </div>
              ) : (
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {connections.map((conn, idx) => {
                    const d1 = DEVICES.find((d) => d.id === conn.from)!;
                    const d2 = DEVICES.find((d) => d.id === conn.to)!;
                    return (
                      <div
                        key={idx}
                        className={`p-2 rounded text-xs flex justify-between items-center border ${
                          conn.isValid
                            ? "bg-emerald-950/40 border-emerald-900 text-emerald-300"
                            : "bg-red-950/40 border-red-900 text-red-300"
                        }`}
                      >
                        <div>
                          <p className="font-bold">{d1.name} ↔ {d2.name}</p>
                          <p className="text-[10px] text-slate-400 capitalize font-mono">
                            Kabel: {conn.cableType} ({conn.isValid ? "AKTIF" : "GAGAL"})
                          </p>
                        </div>
                        <button
                          onClick={() => removeConnection(idx)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-[10px] text-slate-300 transition"
                        >
                          Putus
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-4 bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-2 text-xs text-slate-300">
                <span className="text-[10px] text-indigo-400 font-bold uppercase block">📋 SYARAT LAYOUT SELESAI:</span>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${pc1Linked ? "bg-emerald-500" : "bg-slate-700"}`} />
                  <span>PC Staf Admin terhubung ke Switch Utama (Straight-Through)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${pc2Linked ? "bg-emerald-500" : "bg-slate-700"}`} />
                  <span>PC Keuangan terhubung ke Switch Utama (Straight-Through)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${pc3Linked ? "bg-emerald-500" : "bg-slate-700"}`} />
                  <span>PC Kepala Sekolah terhubung ke Switch Utama (Straight-Through)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${routerLinked ? "bg-emerald-500" : "bg-slate-700"}`} />
                  <span>Switch Utama terhubung ke Router Utama (Straight-Through)</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 mt-4">
              <span className="text-xs text-slate-400 block font-mono">PANEL DIAGNOSIS:</span>
              <p className="text-xs text-slate-200 mt-1 leading-relaxed">{feedback}</p>
            </div>
          </div>

          {/* Right Column: Dynamic Visual Canvas */}
          <div className="lg:col-span-8 bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col justify-between relative min-h-[400px]">
            <div className="absolute top-4 right-4 flex items-center gap-2 text-xs font-mono text-indigo-400 bg-indigo-950/40 px-2 py-1 rounded border border-indigo-900">
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              Blue Print Jaringan Aktif
            </div>

            {/* Simulated Grid Area for placing connections */}
            <div className="relative flex-1 bg-slate-900/40 rounded-lg border border-slate-800 overflow-hidden min-h-[300px]">
              {/* Background Grid Pattern */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.05)_1px,transparent_1px)] bg-[size:24px_24px]" />

              {/* Draw Lines for Connections */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {connections.map((conn, idx) => {
                  const d1 = DEVICES.find((d) => d.id === conn.from)!;
                  const d2 = DEVICES.find((d) => d.id === conn.to)!;
                  
                  // Calculate absolute points based on current width/height
                  const x1 = `${d1.x}%`;
                  const y1 = `${d1.y}%`;
                  const x2 = `${d2.x}%`;
                  const y2 = `${d2.y}%`;

                  return (
                    <g key={idx}>
                      {/* Outer shadow line */}
                      <line
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={conn.isValid ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}
                        strokeWidth="8"
                        strokeLinecap="round"
                      />
                      {/* Core dashed line represent link */}
                      <line
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={conn.isValid ? "#10b981" : "#ef4444"}
                        strokeWidth="3"
                        strokeDasharray={conn.cableType === "crossover" ? "5,5" : conn.cableType === "console" ? "2,2" : "none"}
                        strokeLinecap="round"
                        className={conn.isValid ? "animate-[dash_2s_linear_infinite]" : ""}
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Render Devices as Interactive Hotspots */}
              {DEVICES.map((dev) => {
                const isSelected = selectedDevice === dev.id;
                
                // Check if this device has active valid links
                const hasValidLink = connections.some((c) => c.isValid && (c.from === dev.id || c.to === dev.id));
                const hasFailedLink = connections.some((c) => !c.isValid && (c.from === dev.id || c.to === dev.id));

                let statusColor = "bg-slate-800 border-slate-700";
                if (isSelected) statusColor = "bg-indigo-950 border-indigo-500 ring-2 ring-indigo-500 scale-105 shadow-[0_0_15px_rgba(99,102,241,0.4)]";
                else if (hasValidLink) statusColor = "bg-slate-900 border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.2)]";
                else if (hasFailedLink) statusColor = "bg-slate-900 border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.2)]";

                return (
                  <button
                    key={dev.id}
                    onClick={() => handleDeviceClick(dev.id)}
                    style={{ left: `${dev.x}%`, top: `${dev.y}%`, transform: "translate(-50%, -50%)" }}
                    className={`absolute p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all z-10 w-28 bg-opacity-95 ${statusColor}`}
                  >
                    <div className="text-2xl">{dev.icon}</div>
                    <span className="text-[10px] font-bold text-white text-center line-clamp-1">{dev.name}</span>
                    
                    {/* Link Indicator LED */}
                    <div className="flex gap-1 mt-1 justify-center">
                      <div className={`w-2 h-2 rounded-full border border-black/40 ${hasValidLink ? "bg-emerald-400" : hasFailedLink ? "bg-red-500" : "bg-slate-600"}`} />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Cable Drawer & Complete button */}
            <div className="mt-4 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900 p-3 rounded-lg border border-slate-800">
              <div className="flex gap-2 items-center">
                <span className="text-xs text-slate-400 font-mono uppercase mr-2">Pilih Kabel:</span>
                
                <button
                  onClick={() => { sfx.playClick(); setSelectedCable("straight"); }}
                  className={`px-3 py-1.5 rounded text-xs font-bold transition flex items-center gap-1.5 ${
                    selectedCable === "straight"
                      ? "bg-indigo-600 text-white shadow"
                      : "bg-slate-800 text-slate-400 hover:text-slate-300"
                  }`}
                >
                  <span className="w-3.5 h-0.5 bg-current inline-block" /> Straight-Through
                </button>

                <button
                  onClick={() => { sfx.playClick(); setSelectedCable("crossover"); }}
                  className={`px-3 py-1.5 rounded text-xs font-bold transition flex items-center gap-1.5 ${
                    selectedCable === "crossover"
                      ? "bg-indigo-600 text-white shadow"
                      : "bg-slate-800 text-slate-400 hover:text-slate-300"
                  }`}
                >
                  <span className="w-3.5 h-0.5 border-t-2 border-dashed border-current inline-block" /> Crossover
                </button>

                <button
                  onClick={() => { sfx.playClick(); setSelectedCable("console"); }}
                  className={`px-3 py-1.5 rounded text-xs font-bold transition flex items-center gap-1.5 ${
                    selectedCable === "console"
                      ? "bg-indigo-600 text-white shadow"
                      : "bg-slate-800 text-slate-400 hover:text-slate-300"
                  }`}
                >
                  <span className="text-[10px] text-sky-400">🔌</span> Console Cable
                </button>
              </div>

              <div className="flex gap-2 w-full md:w-auto">
                {isTopologyComplete && (
                  <button
                    onClick={() => { sfx.playQuestComplete(); onSuccess(); }}
                    className="flex-1 md:flex-initial px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-lg text-sm transition shadow-md flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" /> SELESAIKAN MISI
                  </button>
                )}

                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs rounded border border-slate-700 flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset Blueprint
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
