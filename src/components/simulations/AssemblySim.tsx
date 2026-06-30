/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Cpu, CpuIcon, HardDrive, HardDriveIcon, Zap, CheckCircle, RotateCcw, Monitor } from "lucide-react";
import { motion } from "motion/react";
import { sfx } from "../../utils/audio";

interface ComponentPart {
  id: string;
  name: string;
  indonesian: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  targetSlot: string;
}

const PARTS: ComponentPart[] = [
  {
    id: "mobo",
    name: "Motherboard",
    indonesian: "Papan Induk",
    description: "Papan sirkuit utama tempat semua komponen komputer terhubung.",
    icon: <CpuIcon className="w-8 h-8 text-emerald-400" />,
    color: "from-emerald-500 to-teal-600",
    targetSlot: "mobo_slot",
  },
  {
    id: "cpu",
    name: "CPU (Processor)",
    indonesian: "Prosesor",
    description: "Otak utama komputer yang memproses semua instruksi data.",
    icon: <Cpu className="w-8 h-8 text-sky-400" />,
    color: "from-sky-500 to-blue-600",
    targetSlot: "cpu_slot",
  },
  {
    id: "ram",
    name: "RAM Memory",
    indonesian: "Memori RAM",
    description: "Penyimpanan data sementara kecepatan tinggi untuk aplikasi berjalan.",
    icon: <div className="font-mono text-xl font-bold text-amber-400">RAM</div>,
    color: "from-amber-500 to-orange-600",
    targetSlot: "ram_slot",
  },
  {
    id: "gpu",
    name: "GPU (Graphic Card)",
    indonesian: "Kartu Grafis",
    description: "Mengolah data grafis untuk ditampilkan ke layar monitor.",
    icon: <Monitor className="w-8 h-8 text-fuchsia-400" />,
    color: "from-fuchsia-500 to-pink-600",
    targetSlot: "gpu_slot",
  },
  {
    id: "psu",
    name: "Power Supply Unit",
    indonesian: "Catu Daya",
    description: "Menyalurkan arus listrik ke seluruh komponen komputer.",
    icon: <Zap className="w-8 h-8 text-yellow-400" />,
    color: "from-yellow-500 to-amber-600",
    targetSlot: "psu_slot",
  },
  {
    id: "storage",
    name: "NVMe SSD",
    indonesian: "Penyimpanan SSD",
    description: "Media penyimpanan data permanen berkecepatan sangat tinggi.",
    icon: <HardDrive className="w-8 h-8 text-rose-400" />,
    color: "from-rose-500 to-red-600",
    targetSlot: "storage_slot",
  },
];

interface AssemblySimProps {
  onSuccess: () => void;
  onClose: () => void;
}

export default function AssemblySim({ onSuccess, onClose }: AssemblySimProps) {
  const [selectedPart, setSelectedPart] = useState<ComponentPart | null>(null);
  const [assembledParts, setAssembledParts] = useState<string[]>([]);
  const [booting, setBooting] = useState(false);
  const [bootLogs, setBootLogs] = useState<string[]>([]);
  const [bootSuccess, setBootSuccess] = useState(false);
  const [feedback, setFeedback] = useState<string>("Klik salah satu komponen dari rak kiri, lalu klik slot yang tepat pada casing PC di kanan.");

  const handleSelectPart = (part: ComponentPart) => {
    sfx.playClick();
    if (assembledParts.includes(part.id)) {
      setFeedback(`Komponen ${part.name} sudah terpasang!`);
      return;
    }
    // Check order prerequisites: Mobo must be installed before CPU, RAM, GPU, SSD
    if (part.id !== "mobo" && !assembledParts.includes("mobo")) {
      sfx.playError();
      setFeedback("Peringatan: Pasang Motherboard terlebih dahulu sebagai fondasi komponen lainnya!");
      return;
    }
    setSelectedPart(part);
    setFeedback(`Memilih ${part.name}. Tempatkan pada slot yang sesuai pada casing.`);
  };

  const handleSlotClick = (slotId: string) => {
    if (!selectedPart) {
      sfx.playError();
      setFeedback("Silakan pilih komponen terlebih dahulu di rak sebelah kiri.");
      return;
    }

    if (selectedPart.targetSlot === slotId) {
      const updated = [...assembledParts, selectedPart.id];
      sfx.playSuccess();
      setAssembledParts(updated);
      setSelectedPart(null);
      setFeedback(`Bagus! ${selectedPart.name} berhasil terpasang di tempatnya.`);
      
      if (updated.length === PARTS.length) {
        setFeedback("Semua komponen berhasil dirakit! Klik 'NYALAKAN PC' di bawah untuk melakukan uji coba BIOS.");
      }
    } else {
      sfx.playError();
      setFeedback(`Salah slot! ${selectedPart.name} tidak cocok dipasang pada slot tersebut. Coba cari letak yang logis.`);
    }
  };

  const handleBoot = () => {
    if (assembledParts.length < PARTS.length) {
      sfx.playError();
      setFeedback("Harap rakit semua komponen terlebih dahulu sebelum menyalakan PC!");
      return;
    }

    sfx.playClick();
    setBooting(true);
    setBootLogs(["Memulai sistem...", "Membaca konfigurasi NVRAM..."]);

    const logs = [
      "TKJ-BIOS v2.40 - Hak Cipta 2026",
      "Menguji Memori RAM: 16384 MB - OK",
      "Mendeteksi CPU: Intel Core i5 @ 3.40GHz - 6 Cores - OK",
      "Menginisialisasi GPU: NVIDIA GeForce RTX 3060 (12GB VRAM) - OK",
      "Membuka Media Penyimpanan: NVMe SSD 1TB - OK",
      "Memuat Sistem Operasi TKJ-OS...",
      "SYSTEM STATUS: BOOT SUCCESSFUL!"
    ];

    logs.forEach((log, index) => {
      setTimeout(() => {
        sfx.playClick();
        setBootLogs((prev) => [...prev, log]);
        if (index === logs.length - 1) {
          sfx.playQuestComplete();
          setBootSuccess(true);
          setFeedback("Keren! Komputer berhasil booting dan berfungsi penuh!");
        }
      }, (index + 1) * 800);
    });
  };

  const handleReset = () => {
    sfx.playClick();
    setAssembledParts([]);
    setSelectedPart(null);
    setBooting(false);
    setBootLogs([]);
    setBootSuccess(false);
    setFeedback("Klik salah satu komponen dari rak kiri, lalu klik slot yang tepat pada casing PC di kanan.");
  };

  const handleComplete = () => {
    sfx.playQuestComplete();
    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl rounded-xl shadow-2xl overflow-hidden flex flex-col h-[90vh]">
        {/* Header */}
        <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center">
          <div>
            <span className="text-xs font-mono px-2 py-1 bg-emerald-950 text-emerald-400 rounded border border-emerald-800 uppercase mr-2">
              Level 1
            </span>
            <h2 className="text-xl font-bold text-white inline-block">Simulasi: Merakit PC Sekolah</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded-md text-sm transition"
          >
            Keluar Game
          </button>
        </div>

        {/* Game Body */}
        <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto">
          {/* Left Column: Shelf of Parts */}
          <div className="lg:col-span-4 bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
              Rak Komponen PC
            </h3>
            <div className="grid grid-cols-1 gap-3 flex-1 overflow-y-auto pr-1">
              {PARTS.map((part) => {
                const isAssembled = assembledParts.includes(part.id);
                const isSelected = selectedPart?.id === part.id;
                return (
                  <button
                    key={part.id}
                    onClick={() => handleSelectPart(part)}
                    disabled={isAssembled || booting}
                    className={`p-3 rounded-lg border text-left transition flex items-center gap-3 relative overflow-hidden group ${
                      isAssembled
                        ? "bg-slate-900/40 border-slate-800 opacity-50 cursor-not-allowed"
                        : isSelected
                        ? "bg-indigo-950/60 border-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.2)]"
                        : "bg-slate-900 border-slate-800 hover:border-slate-700 cursor-pointer"
                    }`}
                  >
                    <div className={`p-2 rounded bg-gradient-to-br ${part.color} shadow-md`}>
                      {part.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{part.name}</span>
                        {isAssembled && (
                          <span className="text-xs text-emerald-400 font-mono bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-900">
                            TERPASANG
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 block line-clamp-1">
                        {part.description}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Center Column: Computer Chassis Map */}
          <div className="lg:col-span-5 bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col justify-between relative overflow-hidden">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-800 pb-2">
              Casing CPU Atx
            </h3>

            {/* Chassis Illustration */}
            <div className="relative aspect-[4/5] bg-slate-900 rounded-lg border-2 border-slate-700 p-4 flex items-center justify-center overflow-hidden my-auto max-h-[360px]">
              {/* Outer chassis design grids */}
              <div className="absolute inset-0 border-[6px] border-slate-800 rounded pointer-events-none opacity-40"></div>
              
              {/* Power Supply Spot (Bottom) */}
              <button
                id="psu_slot"
                onClick={() => handleSlotClick("psu_slot")}
                className={`absolute bottom-3 left-4 right-4 h-16 rounded border-2 border-dashed flex flex-col items-center justify-center transition ${
                  assembledParts.includes("psu")
                    ? "bg-amber-950/30 border-amber-500"
                    : selectedPart?.id === "psu"
                    ? "bg-indigo-950/40 border-indigo-400 animate-pulse"
                    : "bg-slate-950/50 border-slate-700 hover:border-slate-500"
                }`}
              >
                {assembledParts.includes("psu") ? (
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                    <Zap className="w-4 h-4" /> CATU DAYA (PSU) OK
                  </div>
                ) : (
                  <span className="text-xs font-mono text-slate-500">Slot Power Supply (PSU)</span>
                )}
              </button>

              {/* Motherboard Area (Large Middle) */}
              <div
                className={`absolute top-4 bottom-24 left-4 right-4 rounded-lg border-2 border-dashed p-3 flex flex-col justify-between transition ${
                  assembledParts.includes("mobo")
                    ? "bg-slate-950 border-emerald-500/80"
                    : selectedPart?.id === "mobo"
                    ? "bg-indigo-950/30 border-indigo-400 animate-pulse"
                    : "bg-slate-950/20 border-slate-800"
                }`}
              >
                {/* Click target for Motherboard itself */}
                {!assembledParts.includes("mobo") && (
                  <button
                    id="mobo_slot"
                    onClick={() => handleSlotClick("mobo_slot")}
                    className="absolute inset-0 flex flex-col items-center justify-center"
                  >
                    <span className="text-xs font-mono text-slate-500 p-2 text-center">
                      Pasang Motherboard Di Sini Terlebih Dahulu
                    </span>
                  </button>
                )}

                {/* If Mobo is installed, show its internal sockets */}
                {assembledParts.includes("mobo") && (
                  <div className="w-full h-full relative grid grid-cols-12 gap-2 p-1">
                    {/* CPU socket */}
                    <button
                      id="cpu_slot"
                      onClick={() => handleSlotClick("cpu_slot")}
                      className={`col-span-4 aspect-square rounded border-2 border-dashed flex flex-col items-center justify-center transition ${
                        assembledParts.includes("cpu")
                          ? "bg-sky-950/50 border-sky-400"
                          : selectedPart?.id === "cpu"
                          ? "bg-indigo-950/40 border-indigo-400 animate-pulse"
                          : "bg-slate-900 border-slate-700 hover:border-slate-500"
                      }`}
                    >
                      {assembledParts.includes("cpu") ? (
                        <Cpu className="w-6 h-6 text-sky-400" />
                      ) : (
                        <span className="text-[9px] font-mono text-slate-400 text-center">Slot CPU</span>
                      )}
                    </button>

                    {/* RAM Slots (Tall and narrow) */}
                    <button
                      id="ram_slot"
                      onClick={() => handleSlotClick("ram_slot")}
                      className={`col-span-3 h-20 rounded border-2 border-dashed flex items-center justify-center transition ${
                        assembledParts.includes("ram")
                          ? "bg-amber-950/50 border-amber-400"
                          : selectedPart?.id === "ram"
                          ? "bg-indigo-950/40 border-indigo-400 animate-pulse"
                          : "bg-slate-900 border-slate-700 hover:border-slate-500"
                      }`}
                    >
                      {assembledParts.includes("ram") ? (
                        <div className="rotate-90 text-[10px] text-amber-400 font-bold font-mono">RAM</div>
                      ) : (
                        <span className="text-[9px] font-mono text-slate-400 text-center rotate-90">RAM</span>
                      )}
                    </button>

                    {/* Storage SSD Slot (Horizontal small slot) */}
                    <button
                      id="storage_slot"
                      onClick={() => handleSlotClick("storage_slot")}
                      className={`col-span-5 h-8 rounded border-2 border-dashed flex items-center justify-center transition ${
                        assembledParts.includes("storage")
                          ? "bg-rose-950/50 border-rose-400"
                          : selectedPart?.id === "storage"
                          ? "bg-indigo-950/40 border-indigo-400 animate-pulse"
                          : "bg-slate-900 border-slate-700 hover:border-slate-500"
                      }`}
                    >
                      {assembledParts.includes("storage") ? (
                        <span className="text-[9px] font-bold text-rose-400 font-mono">NVMe SSD</span>
                      ) : (
                        <span className="text-[9px] font-mono text-slate-400">M.2 SSD</span>
                      )}
                    </button>

                    {/* GPU Slot (Large horizontal card slot at the bottom of motherboard) */}
                    <button
                      id="gpu_slot"
                      onClick={() => handleSlotClick("gpu_slot")}
                      className={`col-span-12 h-12 mt-auto rounded border-2 border-dashed flex items-center justify-center transition ${
                        assembledParts.includes("gpu")
                          ? "bg-fuchsia-950/50 border-fuchsia-400"
                          : selectedPart?.id === "gpu"
                          ? "bg-indigo-950/40 border-indigo-400 animate-pulse"
                          : "bg-slate-900 border-slate-700 hover:border-slate-500"
                      }`}
                    >
                      {assembledParts.includes("gpu") ? (
                        <div className="flex items-center gap-2 text-xs text-fuchsia-400 font-bold">
                          <Monitor className="w-4 h-4" /> GPU (PCIe) INSTALLED
                        </div>
                      ) : (
                        <span className="text-xs font-mono text-slate-400">Slot Kartu Grafis (PCIe GPU)</span>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Instruction Footer */}
            <div className="mt-4 p-3 bg-slate-900 rounded-lg border border-slate-800">
              <span className="text-xs text-slate-400 block font-mono">PANDUAN AKTIF:</span>
              <p className="text-sm text-slate-200 mt-1">{feedback}</p>
            </div>
          </div>

          {/* Right Column: BIOS monitor test logs */}
          <div className="lg:col-span-3 bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
                Monitor BIOS Uji Coba
              </h3>
              
              <div className="aspect-[4/3] bg-black rounded border border-slate-800 p-3 font-mono text-xs text-emerald-500 overflow-y-auto max-h-[220px]">
                {bootLogs.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-600 text-center">
                    Casing CPU belum diberi daya.<br />Menunggu rakitan lengkap...
                  </div>
                ) : (
                  <div className="space-y-1">
                    {bootLogs.map((log, i) => (
                      <p key={i} className={log.includes("OK") ? "text-emerald-400" : log.includes("SUCCESS") ? "text-cyan-400 font-bold animate-pulse" : "text-emerald-600"}>
                        {log}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Control buttons */}
            <div className="space-y-3 mt-6">
              {assembledParts.length === PARTS.length && !booting && (
                <button
                  onClick={handleBoot}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-lg shadow-lg hover:shadow-emerald-900/30 transition-all flex items-center justify-center gap-2"
                >
                  <Zap className="w-5 h-5 text-yellow-300 animate-bounce" /> NYALAKAN PC
                </button>
              )}

              {bootSuccess && (
                <button
                  onClick={handleComplete}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-lg hover:shadow-indigo-900/30 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" /> SELESAIKAN MISI
                </button>
              )}

              <button
                onClick={handleReset}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs rounded border border-slate-700 flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Ulangi Perakitan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
