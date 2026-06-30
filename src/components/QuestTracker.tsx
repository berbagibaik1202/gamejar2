/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LocationId, Quest } from "../types";
import { Award, Backpack, MapPin, CheckCircle, HelpCircle, KeyRound } from "lucide-react";

interface QuestTrackerProps {
  quests: Quest[];
  inventory: string[];
  score: number;
  currentLocation: LocationId;
}

const LOCATION_LABELS: Record<LocationId, string> = {
  [LocationId.SEKOLAH]: "1. Kelas TKJ",
  [LocationId.LABORATORIUM]: "2. Lab Komputer",
  [LocationId.KANTOR]: "3. Ruang Kantor",
  [LocationId.RUANG_SERVER]: "4. Ruang Server",
  [LocationId.DATA_CENTER]: "5. Data Center",
};

export default function QuestTracker({
  quests,
  inventory,
  score,
  currentLocation,
}: QuestTrackerProps) {
  const activeQuest = quests.find((q) => q.status === "active");

  return (
    <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl flex flex-col gap-6 h-full shadow-lg">
      {/* 1. Player Info & Score */}
      <div className="flex justify-between items-center bg-slate-950 p-3 rounded-lg border border-slate-800">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-400 animate-bounce" />
          <div>
            <span className="text-[10px] text-slate-500 font-mono block">SERFITIKSASI TKJ</span>
            <span className="text-sm font-black text-white">Junior Network Engineer</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-500 font-mono block">SKOR XP</span>
          <span className="text-base font-black text-emerald-400 font-mono">{score} pts</span>
        </div>
      </div>

      {/* 2. Current Active Quest */}
      <div className="bg-slate-950 p-4 rounded-lg border-l-4 border-indigo-500 border-y border-r border-slate-800">
        <span className="text-xs font-mono font-bold text-indigo-400 uppercase block tracking-wider mb-1.5">
          Quest Aktif
        </span>

        {activeQuest ? (
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white">{activeQuest.title}</h4>
            <p className="text-xs text-slate-400 leading-relaxed">{activeQuest.description}</p>
            
            <div className="bg-indigo-950/30 p-2.5 rounded border border-indigo-900/60 text-xs text-indigo-200">
              <span className="font-bold text-indigo-300 block">🎯 OBYEKTIF:</span>
              <p className="mt-0.5 leading-relaxed">{activeQuest.objective}</p>
            </div>

            <div className="p-2 bg-slate-900 rounded text-[11px] text-slate-400 flex items-start gap-1.5 leading-relaxed border border-slate-850">
              <HelpCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span>
                <strong className="text-slate-300">Tips: </strong>
                {activeQuest.hint}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-500 italic py-2 text-center">
            Semua quest berhasil diselesaikan! Kamu telah menamatkan game.
          </div>
        )}
      </div>

      {/* 3. Level Timeline Progress */}
      <div className="space-y-2">
        <span className="text-[10px] text-slate-500 font-mono uppercase block font-bold tracking-wider">
          Peta Perjalanan TKJ
        </span>
        <div className="space-y-1.5 text-xs">
          {Object.entries(LOCATION_LABELS).map(([locId, label]) => {
            const locQuests = quests.filter((q) => q.locationId === locId);
            const isCompleted = locQuests.every((q) => q.status === "completed");
            const isActive = currentLocation === locId;

            let badgeColor = "bg-slate-950 text-slate-600 border-slate-900";
            if (isActive) badgeColor = "bg-indigo-950 border-indigo-900 text-indigo-300 font-bold ring-1 ring-indigo-500/50";
            else if (isCompleted) badgeColor = "bg-emerald-950 border-emerald-900 text-emerald-400";

            return (
              <div
                key={locId}
                className={`p-2 rounded border flex justify-between items-center transition-colors ${badgeColor}`}
              >
                <span className="flex items-center gap-1.5">
                  <MapPin className={`w-3.5 h-3.5 ${isActive ? "text-indigo-400" : isCompleted ? "text-emerald-400" : "text-slate-600"}`} />
                  {label}
                </span>

                {isCompleted ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : isActive ? (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 bg-indigo-900 text-indigo-300 rounded uppercase">
                    Eksplorasi
                  </span>
                ) : (
                  <KeyRound className="w-3.5 h-3.5 text-slate-700" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Equipment Inventory */}
      <div className="space-y-2 mt-auto">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 mb-2">
          <Backpack className="w-4 h-4 text-amber-400" />
          <span className="text-[10px] text-slate-500 font-mono uppercase block font-bold tracking-wider">
            Kantong Peralatan TKJ ({inventory.length})
          </span>
        </div>

        {inventory.length === 0 ? (
          <div className="text-xs text-slate-500 italic p-3 text-center border border-dashed border-slate-800 rounded bg-slate-950/30">
            Belum membawa perkakas apa pun. Selesaikan misi untuk mendapatkannya!
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 text-xs">
            {inventory.map((item, idx) => (
              <div
                key={idx}
                className="p-2 bg-slate-950 border border-slate-800 rounded-lg flex items-center gap-1.5 text-slate-200 text-center font-bold font-sans hover:border-slate-700 hover:text-white transition"
              >
                <span className="text-base select-none">
                  {item.includes("Tester")
                    ? "🔌"
                    : item.includes("Obeng")
                    ? "🛠️"
                    : item.includes("Console")
                    ? "🛰️"
                    : item.includes("Access")
                    ? "💳"
                    : "🎓"}
                </span>
                <span className="line-clamp-1">{item}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
