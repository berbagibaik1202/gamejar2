/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, CSSProperties } from "react";
import { Hammer, CheckCircle, RotateCcw, AlertTriangle, ArrowRightLeft } from "lucide-react";
import { sfx } from "../../utils/audio";

interface Wire {
  id: string;
  nameInd: string;
  nameEng: string;
  colorClass: string; // Tailwind class for colored stripes
  bgStyle: CSSProperties; // custom css gradient for realistic striped wires
}

const T568B_STANDARD: string[] = [
  "w_orange", // Putih Oranye
  "orange",   // Oranye
  "w_green",  // Putih Hijau
  "blue",     // Biru
  "w_blue",   // Putih Biru
  "green",    // Hijau
  "w_brown",  // Putih Cokelat
  "brown"     // Cokelat
];

const WIRE_DATA: Record<string, Wire> = {
  w_orange: {
    id: "w_orange",
    nameInd: "Putih-Oranye",
    nameEng: "White-Orange",
    colorClass: "bg-orange-100",
    bgStyle: { backgroundImage: "repeating-linear-gradient(45deg, #fef3c7, #fef3c7 5px, #f97316 5px, #f97316 10px)" }
  },
  orange: {
    id: "orange",
    nameInd: "Oranye",
    nameEng: "Orange",
    colorClass: "bg-orange-500",
    bgStyle: { backgroundColor: "#ea580c" }
  },
  w_green: {
    id: "w_green",
    nameInd: "Putih-Hijau",
    nameEng: "White-Green",
    colorClass: "bg-green-100",
    bgStyle: { backgroundImage: "repeating-linear-gradient(45deg, #f0fdf4, #f0fdf4 5px, #22c55e 5px, #22c55e 10px)" }
  },
  blue: {
    id: "blue",
    nameInd: "Biru",
    nameEng: "Blue",
    colorClass: "bg-blue-600",
    bgStyle: { backgroundColor: "#2563eb" }
  },
  w_blue: {
    id: "w_blue",
    nameInd: "Putih-Biru",
    nameEng: "White-Blue",
    colorClass: "bg-blue-100",
    bgStyle: { backgroundImage: "repeating-linear-gradient(45deg, #eff6ff, #eff6ff 5px, #3b82f6 5px, #3b82f6 10px)" }
  },
  green: {
    id: "green",
    nameInd: "Hijau",
    nameEng: "Green",
    colorClass: "bg-green-600",
    bgStyle: { backgroundColor: "#16a34a" }
  },
  w_brown: {
    id: "w_brown",
    nameInd: "Putih-Cokelat",
    nameEng: "White-Brown",
    colorClass: "bg-amber-100",
    bgStyle: { backgroundImage: "repeating-linear-gradient(45deg, #fafaf9, #fafaf9 5px, #78350f 5px, #78350f 10px)" }
  },
  brown: {
    id: "brown",
    nameInd: "Cokelat",
    nameEng: "Brown",
    colorClass: "bg-amber-800",
    bgStyle: { backgroundColor: "#451a03" }
  }
};

interface CableSimProps {
  onSuccess: () => void;
  onClose: () => void;
}

export default function CableSim({ onSuccess, onClose }: CableSimProps) {
  // Current order of wires on screen
  const [currentOrder, setCurrentOrder] = useState<string[]>([]);
  const [selectedWireIndex, setSelectedWireIndex] = useState<number | null>(null);
  const [isCrimped, setIsCrimped] = useState(false);
  const [testerRunning, setTesterRunning] = useState(false);
  const [testerIndex, setTesterIndex] = useState<number>(-1); // Pin being tested (0-7)
  const [testerResults, setTesterResults] = useState<boolean[]>([]); // true = success, false = fail
  const [feedback, setFeedback] = useState<string>("Bantu lab merakit kabel LAN! Waspada, kabel bawaan acak. Klik satu kabel lalu klik kabel lainnya untuk menukar posisi.");
  const [testerSuccess, setTesterSuccess] = useState(false);

  // Initialize randomly shuffled wires
  useEffect(() => {
    shuffleWires();
  }, []);

  const shuffleWires = () => {
    // Generate a shuffled copy of T568B
    const shuffled = [...T568B_STANDARD];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    // Check if randomly got exact matching order, if so, shuffle again
    let isStandard = true;
    for (let i = 0; i < shuffled.length; i++) {
      if (shuffled[i] !== T568B_STANDARD[i]) {
        isStandard = false;
        break;
      }
    }
    if (isStandard) {
      // reshuffle
      [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
    }

    setCurrentOrder(shuffled);
    setSelectedWireIndex(null);
    setIsCrimped(false);
    setTesterRunning(false);
    setTesterIndex(-1);
    setTesterResults([]);
    setTesterSuccess(false);
    setFeedback("Kabel diatur acak. Tukar posisi kabel hingga urutan warnanya memenuhi standar T568B.");
  };

  const handleWireClick = (index: number) => {
    if (isCrimped) {
      sfx.playError();
      return;
    }

    sfx.playClick();
    if (selectedWireIndex === null) {
      setSelectedWireIndex(index);
      setFeedback(`Kabel ${WIRE_DATA[currentOrder[index]].nameInd} dipilih. Klik kabel lain untuk menukar tempat.`);
    } else if (selectedWireIndex === index) {
      // Deselect
      setSelectedWireIndex(null);
      setFeedback("Pilihan dibatalkan.");
    } else {
      // Swap positions
      const newOrder = [...currentOrder];
      const temp = newOrder[selectedWireIndex];
      newOrder[selectedWireIndex] = newOrder[index];
      newOrder[index] = temp;
      
      setCurrentOrder(newOrder);
      setSelectedWireIndex(null);
      setFeedback("Kabel berhasil ditukar posisinya! Cek keselarasan urutan.");
    }
  };

  const handleCrimp = () => {
    sfx.playClick();
    setIsCrimped(true);
    setFeedback("Kabel telah dikunci ke konektor RJ45! Sekarang hubungkan ke LAN Tester.");
  };

  const runTester = () => {
    if (!isCrimped) {
      sfx.playError();
      return;
    }
    sfx.playClick();
    setTesterRunning(true);
    setTesterIndex(0);
    setTesterResults([]);
    setFeedback("Menghubungkan kabel... Mengalirkan sinyal listrik pin-demi-pin...");
  };

  // LAN Tester Sequencer Effect
  useEffect(() => {
    if (!testerRunning) return;

    if (testerIndex >= 0 && testerIndex < 8) {
      const timer = setTimeout(() => {
        // Evaluate active pin
        const currentWire = currentOrder[testerIndex];
        const expectedWire = T568B_STANDARD[testerIndex];
        const isCorrect = currentWire === expectedWire;

        if (isCorrect) {
          sfx.playClick();
        } else {
          sfx.playError();
        }

        setTesterResults((prev) => [...prev, isCorrect]);
        
        if (testerIndex < 7) {
          setTesterIndex((prev) => prev + 1);
        } else {
          // Completed testing all 8 pins
          setTesterIndex(8);
        }
      }, 700);

      return () => clearTimeout(timer);
    } else if (testerIndex === 8) {
      // Check overall success
      const allPassed = testerResults.every((res) => res === true);
      setTesterRunning(false);

      if (allPassed) {
        sfx.playSuccess();
        setTesterSuccess(true);
        setFeedback("Lampu LAN Tester berkedip hijau berurutan dari 1 s/d 8 secara sinkron! Misi Sukses!");
      } else {
        sfx.playError();
        setTesterSuccess(false);
        setIsCrimped(false); // Let them fix it
        setTesterIndex(-1);
        setFeedback("Aduh! Lampu tester menyala merah/silang. Ada pin yang tertukar posisinya. Silakan perbaiki urutan!");
      }
    }
  }, [testerRunning, testerIndex, currentOrder, testerResults]);

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
              Level 2
            </span>
            <h2 className="text-xl font-bold text-white inline-block">Simulasi: Penyusunan Kabel UTP T568B</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded-md text-sm transition"
          >
            Keluar Game
          </button>
        </div>

        {/* Main Workspace */}
        <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto">
          
          {/* Left Column: T568B Reference and Instructions */}
          <div className="lg:col-span-4 bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-800 pb-2">
                Standar Pengkabelan T568B
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Kabel Straight-Through disusun mengikuti standar industri internasional <strong className="text-indigo-400">T568B</strong> untuk menghubungkan komputer workstation ke switch di laboratorium.
              </p>

              <div className="bg-indigo-950/30 border border-indigo-900/80 p-4 rounded-xl text-xs text-indigo-200 space-y-3 shadow-inner">
                <span className="font-bold text-indigo-400 block uppercase font-mono tracking-wider">🧠 TANTANGAN MANDIRI TKJ:</span>
                <p className="leading-relaxed">
                  Petunjuk urutan warna standar telah disembunyikan! Sebagai calon Network Engineer handal, urutkan kedelapan kabel warna-warni tersebut berdasarkan pengetahuan pengkabelan crimping yang telah dipelajari di sekolah.
                </p>
                <div className="p-2.5 bg-slate-900 rounded border border-slate-800 text-[11px] text-amber-300/90 leading-relaxed">
                  <span className="font-bold text-amber-400 block mb-0.5">💡 PETUNJUK AWAL:</span>
                  Urutan pin nomor 1 di sebelah kiri diawali dengan warna <strong className="underline">Putih-Oranye</strong>, dan diakhiri di pin nomor 8 dengan warna <strong className="underline">Cokelat</strong>. Silakan susun sisa kabel di antaranya!
                </div>
              </div>
            </div>

            <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800 mt-4">
              <span className="text-xs text-slate-400 block font-mono">STATUS KABEL:</span>
              <p className="text-sm text-slate-200 mt-1">{feedback}</p>
            </div>
          </div>

          {/* Middle Column: Interactive RJ45 Crimp Area */}
          <div className="lg:col-span-5 bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col justify-between relative overflow-hidden">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-800 pb-2">
              Konektor RJ45 & UTP
            </h3>

            {/* RJ45 Connector Visualization */}
            <div className="relative flex-1 bg-slate-900/60 rounded-lg border border-slate-800 p-4 flex flex-col justify-center items-center my-auto min-h-[300px]">
              {/* RJ45 Body shell outline */}
              <div className="relative w-72 bg-slate-950/40 border-[3px] border-slate-600 rounded-2xl p-4 shadow-xl flex flex-col items-center">
                {/* Gold Pins (top contacts) */}
                <div className="grid grid-cols-8 gap-1.5 w-full border-b border-slate-800 pb-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((pin) => (
                    <div key={pin} className="flex flex-col items-center">
                      <div className="w-4 h-6 bg-yellow-400 rounded-sm border border-yellow-200 shadow-inner" />
                      <span className="text-[9px] font-mono font-bold text-slate-400 mt-1">{pin}</span>
                    </div>
                  ))}
                </div>

                {/* Cable entries (The interactive swapped wires) */}
                <div className="grid grid-cols-8 gap-1.5 w-full h-32 pt-3 px-1 items-end relative">
                  {/* Clip cover over wires */}
                  <div className="absolute inset-x-0 bottom-0 h-8 bg-slate-800/80 border-t border-slate-600 rounded-b opacity-90 z-10 flex items-center justify-center font-mono text-[9px] text-slate-400 tracking-widest uppercase">
                    PENGUNCI RJ45
                  </div>

                  {currentOrder.map((wireId, index) => {
                    const wire = WIRE_DATA[wireId];
                    const isSelected = selectedWireIndex === index;
                    return (
                      <button
                        key={`${wireId}-${index}`}
                        onClick={() => handleWireClick(index)}
                        disabled={isCrimped}
                        className={`h-24 w-full rounded-t-sm border shadow-md transition-all flex flex-col justify-between items-center relative group ${
                          isCrimped ? "cursor-not-allowed border-slate-800" : ""
                        } ${
                          isSelected
                            ? "border-indigo-400 ring-2 ring-indigo-500 scale-105 z-20 shadow-[0_0_15px_rgba(99,102,241,0.4)]"
                            : "border-slate-600 hover:border-slate-400 hover:scale-102"
                        }`}
                        style={wire.bgStyle}
                        title={wire.nameInd}
                      >
                        {/* Little helper to show active state */}
                        {isSelected && (
                          <div className="absolute -top-6 inset-x-0 mx-auto w-5 h-5 rounded-full bg-indigo-600 border border-indigo-400 flex items-center justify-center text-white text-[9px] shadow font-bold">
                            <ArrowRightLeft className="w-3 h-3" />
                          </div>
                        )}
                        <span className="text-[7px] font-mono font-black text-white bg-black/60 rounded px-0.5 mt-1">
                          {index + 1}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cable Outer Jacket / Insulation */}
              <div className="w-40 h-20 bg-slate-700 rounded-b-xl border-x-4 border-b-4 border-slate-600 shadow-inner flex items-center justify-center">
                <span className="text-slate-400 font-mono text-xs uppercase tracking-widest">Kabel UTP Cat5e</span>
              </div>
            </div>

            {/* Action panel */}
            <div className="mt-4 flex gap-3">
              {!isCrimped ? (
                <button
                  onClick={handleCrimp}
                  disabled={currentOrder.length === 0}
                  className="w-full py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold rounded-lg shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Hammer className="w-5 h-5" /> CRIMP KABEL SEKARANG
                </button>
              ) : (
                <button
                  onClick={runTester}
                  disabled={testerRunning || testerSuccess}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-lg shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  🔋 UJI DENGAN LAN TESTER
                </button>
              )}
            </div>
          </div>

          {/* Right Column: LAN Tester Display */}
          <div className="lg:col-span-3 bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
                LAN Tester RJ45
              </h3>

              {/* Tester Device mockup */}
              <div className="grid grid-cols-2 gap-4 bg-slate-900 border-2 border-slate-800 p-4 rounded-xl shadow-lg font-mono">
                {/* Master Side */}
                <div className="bg-slate-950 p-3 rounded border border-slate-800 flex flex-col items-center">
                  <span className="text-[10px] text-slate-500 font-bold mb-3 uppercase tracking-wider">MASTER</span>
                  <div className="space-y-2 w-full">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => {
                      const idx = num - 1;
                      const isActive = testerIndex === idx;
                      const isTested = idx < testerResults.length;
                      const result = testerResults[idx];
                      
                      let ledColor = "bg-slate-800 border-slate-900";
                      if (isActive) ledColor = "bg-amber-400 shadow-[0_0_8px_#f59e0b] animate-ping";
                      else if (isTested) {
                        ledColor = result ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-red-500 shadow-[0_0_8px_#ef4444]";
                      }

                      return (
                        <div key={num} className="flex items-center justify-between px-1.5 py-0.5 bg-slate-900 rounded border border-slate-800/40">
                          <span className="text-xs font-bold text-slate-400">{num}</span>
                          <div className={`w-3.5 h-3.5 rounded-full border ${ledColor} transition-all duration-300`} />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Remote Side */}
                <div className="bg-slate-950 p-3 rounded border border-slate-800 flex flex-col items-center">
                  <span className="text-[10px] text-slate-500 font-bold mb-3 uppercase tracking-wider">REMOTE</span>
                  <div className="space-y-2 w-full">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => {
                      const idx = num - 1;
                      const isActive = testerIndex === idx;
                      const isTested = idx < testerResults.length;
                      const result = testerResults[idx];

                      let ledColor = "bg-slate-800 border-slate-900";
                      if (isActive) ledColor = "bg-amber-400 shadow-[0_0_8px_#f59e0b] animate-ping";
                      else if (isTested) {
                        ledColor = result ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-red-500 shadow-[0_0_8px_#ef4444]";
                      }

                      return (
                        <div key={num} className="flex items-center justify-between px-1.5 py-0.5 bg-slate-900 rounded border border-slate-800/40">
                          <span className="text-xs font-bold text-slate-400">{num}</span>
                          <div className={`w-3.5 h-3.5 rounded-full border ${ledColor} transition-all duration-300`} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Completion or Retry button */}
            <div className="mt-6 space-y-3">
              {testerSuccess && (
                <button
                  onClick={handleComplete}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold rounded-lg shadow-lg hover:shadow-emerald-900/30 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" /> SELESAIKAN MISI
                </button>
              )}

              <button
                onClick={shuffleWires}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs rounded border border-slate-700 flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Acak & Ulangi Kabel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
