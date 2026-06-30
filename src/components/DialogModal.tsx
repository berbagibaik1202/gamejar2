/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { MessageSquare, ArrowRight, Check } from "lucide-react";
import { sfx } from "../utils/audio";

interface DialogModalProps {
  npcName: string;
  npcRole: string;
  npcAvatar: string;
  dialogues: string[];
  onComplete: () => void;
}

export default function DialogModal({
  npcName,
  npcRole,
  npcAvatar,
  dialogues,
  onComplete,
}: DialogModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Play hologram sound when dialog modal pops up
  useEffect(() => {
    sfx.playHologram();
  }, [npcName]);

  const handleNext = () => {
    sfx.playClick();
    if (currentIndex < dialogues.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  const isLastLine = currentIndex === dialogues.length - 1;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent p-6 pb-8 flex justify-center items-end">
      <div className="w-full max-w-4xl bg-slate-900 border-2 border-indigo-950 rounded-2xl shadow-2xl overflow-hidden p-5 flex gap-5 md:gap-6 items-start relative border-t-indigo-500/80 animate-[slideUp_0.3s_ease-out]">
        
        {/* Glow behind box */}
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl blur opacity-30 pointer-events-none" />

        {/* NPC Avatar Big Bubble */}
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-indigo-900 to-indigo-950 flex items-center justify-center text-4xl md:text-5xl border border-indigo-800 shadow-inner flex-shrink-0 relative select-none">
          {npcAvatar}
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-slate-900 rounded-full" />
        </div>

        {/* Conversation Body */}
        <div className="flex-1 space-y-2">
          {/* Header row */}
          <div className="flex flex-wrap gap-2 items-center">
            <h3 className="font-bold text-white text-base md:text-lg tracking-tight">
              {npcName}
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-indigo-950 text-indigo-400 border border-indigo-900 rounded-full font-bold uppercase tracking-wider">
              {npcRole}
            </span>
          </div>

          {/* Dialog Bubble text */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850 min-h-[70px] flex items-center shadow-inner">
            <p className="text-sm md:text-base text-slate-100 leading-relaxed font-sans">
              {dialogues[currentIndex]}
            </p>
          </div>

          {/* Controls Footer */}
          <div className="flex justify-between items-center pt-2">
            <span className="text-[10px] font-mono text-slate-500">
              Baris {currentIndex + 1} dari {dialogues.length}
            </span>

            <button
              onClick={handleNext}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow ${
                isLastLine
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white"
              }`}
            >
              {isLastLine ? (
                <>
                  <span>Siap Mulai Praktik</span>
                  <Check className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <span>Lanjut Dialog</span>
                  <ArrowRight className="w-3.5 h-3.5 animate-pulse" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
