/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { LocationId, SimulationType, Quest, NPC, GameState, Position2D } from "../types";
import { INITIAL_QUESTS, NPCS, MAPS } from "../gameData";

import GameCanvas from "./GameCanvas";
import QuestTracker from "./QuestTracker";
import DialogModal from "./DialogModal";

// Import Simulations
import AssemblySim from "./simulations/AssemblySim";
import CableSim from "./simulations/CableSim";
import TopologySim from "./simulations/TopologySim";
import RouterSim from "./simulations/RouterSim";
import IpTerminalSim from "./simulations/IpTerminalSim";

import { Monitor, Cpu, Sparkles, Trophy, Award, RefreshCw, Volume2, ShieldAlert } from "lucide-react";

export default function GameUI() {
  // Intro splash screen state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [isIntroSubmitted, setIsIntroSubmitted] = useState(false);

  // Core Game State
  const [gameState, setGameState] = useState<GameState>({
    currentLocation: LocationId.SEKOLAH,
    unlockedLocations: [LocationId.SEKOLAH],
    activeQuestId: "q_assembly",
    quests: INITIAL_QUESTS,
    inventory: [],
    score: 0,
    completedSimulations: [],
  });

  // Active overlays
  const [activeNPC, setActiveNPC] = useState<NPC | null>(null);
  const [dialogueType, setDialogueType] = useState<"start" | "during" | "success" | null>(null);
  const [activeSim, setActiveSim] = useState<SimulationType | null>(null);

  // Notifications
  const [systemMsg, setSystemMsg] = useState<string | null>(null);
  const [isGameWon, setIsGameWon] = useState(false);

  // Show auto-fading toast message
  const showToast = (msg: string) => {
    setSystemMsg(msg);
  };

  useEffect(() => {
    if (systemMsg) {
      const timer = setTimeout(() => {
        setSystemMsg(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [systemMsg]);

  // Handle talking to NPC
  const handleInteractNPC = (npcId: string) => {
    const npc = NPCS[npcId];
    if (!npc) return;

    // Determine dialogue category based on current quest progress
    const activeQuest = gameState.quests.find((q) => q.locationId === gameState.currentLocation);
    if (!activeQuest) return;

    setActiveNPC(npc);

    const isSimCompleted = gameState.completedSimulations.includes(activeQuest.requiredSim);
    const isQuestCompleted = activeQuest.status === "completed";

    if (isQuestCompleted) {
      setDialogueType("success");
    } else if (isSimCompleted) {
      // The simulation was completed, so the NPC greets them with the success/completion lines!
      setDialogueType("success");
    } else {
      // Check if they already started it
      const isFirstTalk = activeQuest.status === "active" && gameState.completedSimulations.length === 0 && gameState.inventory.length === 0;
      setDialogueType(isFirstTalk ? "start" : "during");
    }
  };

  // Complete Dialogue
  const handleDialogueComplete = () => {
    if (!activeNPC || !dialogueType) return;

    const activeQuest = gameState.quests.find((q) => q.locationId === gameState.currentLocation);
    
    // If we just finished a "success" dialogue, perform quest rewards & unlocking the next room
    if (dialogueType === "success" && activeQuest && activeQuest.status !== "completed") {
      const currentLocIdx = Object.values(LocationId).indexOf(gameState.currentLocation);
      const nextLocationId = Object.values(LocationId)[currentLocIdx + 1] as LocationId | undefined;

      // Update quests array
      const updatedQuests = gameState.quests.map((q) => {
        if (q.id === activeQuest.id) {
          return { ...q, status: "completed" as const };
        }
        // Unlock the next quest in order
        if (nextLocationId && q.locationId === nextLocationId) {
          return { ...q, status: "active" as const };
        }
        return q;
      });

      // Update inventory and unlock status
      const updatedInventory = [...gameState.inventory];
      if (activeQuest.rewardItem && !updatedInventory.includes(activeQuest.rewardItem)) {
        updatedInventory.push(activeQuest.rewardItem);
      }

      const updatedUnlocked = [...gameState.unlockedLocations];
      if (nextLocationId && !updatedUnlocked.includes(nextLocationId)) {
        updatedUnlocked.push(nextLocationId);
      }

      setGameState((prev) => ({
        ...prev,
        quests: updatedQuests,
        inventory: updatedInventory,
        unlockedLocations: updatedUnlocked,
        score: prev.score + 150, // Reward 150 XP per level
        activeQuestId: nextLocationId ? updatedQuests.find(q => q.locationId === nextLocationId)?.id || null : null
      }));

      showToast(`🏆 Misi Selesai! Kamu menerima: [${activeQuest.rewardItem}] & +150 XP!`);

      // If it was the final level, trigger overall game win!
      if (gameState.currentLocation === LocationId.DATA_CENTER) {
        setIsGameWon(true);
      }
    }

    // Reset overlay state
    setActiveNPC(null);
    setDialogueType(null);
  };

  // Open simulation screen
  const handleInteractDevice = (simType: SimulationType) => {
    setActiveSim(simType);
  };

  // Simulation Success Trigger
  const handleSimulationSuccess = () => {
    if (!activeSim) return;

    if (!gameState.completedSimulations.includes(activeSim)) {
      setGameState((prev) => ({
        ...prev,
        completedSimulations: [...prev.completedSimulations, activeSim],
        score: prev.score + 100, // Reward 100 XP for solving the puzzle
      }));
    }

    showToast("⚙️ Sistem Diperbaiki! Sekarang bicaralah dengan NPC di ruangan ini untuk mengambil hadiah.");
    setActiveSim(null);
  };

  // Handle map portals
  const handleTransitionLocation = (target: LocationId, spawnPoint: Position2D) => {
    setGameState((prev) => ({
      ...prev,
      currentLocation: target,
    }));
  };

  // Restart the game completely
  const handleRestartGame = () => {
    setGameState({
      currentLocation: LocationId.SEKOLAH,
      unlockedLocations: [LocationId.SEKOLAH],
      activeQuestId: "q_assembly",
      quests: INITIAL_QUESTS.map(q => q.id === "q_assembly" ? { ...q, status: "active" } : { ...q, status: "locked" }),
      inventory: [],
      score: 0,
      completedSimulations: [],
    });
    setIsGameWon(false);
    setIsPlaying(false);
    setIsIntroSubmitted(false);
    setPlayerName("");
    setActiveNPC(null);
    setDialogueType(null);
    setActiveSim(null);
  };

  // Render Splash Screen / Title
  if (!isPlaying) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Hologram neon lines backgrounds */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.15),transparent_70%)] pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent animate-pulse" />

        <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl relative text-center space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-950 text-indigo-400 border border-indigo-800 rounded-full text-xs font-mono font-bold uppercase tracking-wider">
              <Monitor className="w-4 h-4 text-sky-400 animate-pulse" />
              TKJ HTML5 Canvas RPG
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 tracking-tight leading-none uppercase">
              Network Adventure
            </h1>
            <div className="text-xs font-mono font-bold text-amber-400 tracking-widest uppercase py-1">
              GAMEJar Oleh Nana Permana
            </div>
            <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
              Petualangan edukasi interaktif 2D khusus siswa Teknik Komputer & Jaringan (TKJ). Belajar praktek, simulasi kabel, konfigurasi router, dan perbaikan server!
            </p>
          </div>

          {!isIntroSubmitted ? (
            <div className="space-y-4 max-w-sm mx-auto">
              <div className="space-y-2 text-left">
                <label className="text-xs font-mono font-bold text-slate-500 uppercase block">Masukkan Nama Teknisi:</label>
                <input
                  type="text"
                  maxLength={16}
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Ketik namamu..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono text-sm outline-none focus:border-indigo-500 transition shadow-inner"
                />
              </div>

              <button
                disabled={!playerName.trim()}
                onClick={() => setIsIntroSubmitted(true)}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg hover:shadow-indigo-900/30 transition disabled:opacity-50 disabled:cursor-not-allowed uppercase font-mono text-sm tracking-wide"
              >
                Lanjutkan &rarr;
              </button>
            </div>
          ) : (
            <div className="space-y-6 max-w-md mx-auto">
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850 text-xs text-slate-300 text-left space-y-3">
                <span className="font-bold text-indigo-400 font-mono block">📜 ATURAN AGEN TKJ:</span>
                <p>1. 🚫 Tidak ada ujian kuis / pilihan ganda. Pelajaran dilakukan murni melalui pemecahan masalah langsung.</p>
                <p>2. 🛠️ Selesaikan tantangan hardware, crimping kabel, arsitektur topologi, dan CLI router.</p>
                <p>3. 🚪 Kumpulkan peralatan TKJ dalam inventory untuk membuka gerbang area server berikutnya.</p>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-slate-500 font-mono">Teknisi Siap: <span className="text-indigo-400 font-bold">{playerName}</span></p>
                <button
                  onClick={() => setIsPlaying(true)}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg hover:shadow-emerald-900/30 transition-all uppercase tracking-wider text-sm animate-pulse cursor-pointer"
                >
                  🚀 Mulai Petualangan Jaringan
                </button>
              </div>
            </div>
          )}

          <div className="border-t border-slate-850 pt-4 flex justify-between items-center text-[10px] font-mono text-slate-500">
            <span>Kurikulum Merdeka SMK TKJ</span>
            <span>Versi Edukasi v1.2</span>
          </div>
        </div>
      </div>
    );
  }

  // Render final victory screen
  if (isGameWon) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.12),transparent_70%)] pointer-events-none" />

        <div className="w-full max-w-2xl bg-slate-900 border-2 border-emerald-500 rounded-2xl p-6 md:p-8 shadow-[0_0_50px_rgba(16,185,129,0.15)] relative text-center space-y-6">
          <div className="inline-flex p-3 rounded-full bg-emerald-950 border border-emerald-800 animate-bounce">
            <Trophy className="w-12 h-12 text-emerald-400" />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight uppercase">
              Selamat, {playerName}!
            </h1>
            <p className="text-sm text-slate-400">
              Kamu berhasil mendiagnosis dan memulihkan seluruh sistem jaringan mulai dari sekolah hingga Mega Data Center!
            </p>
          </div>

          {/* Certificate Board */}
          <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-left relative overflow-hidden select-none">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
            
            {/* Certificate Header */}
            <div className="flex justify-between items-start border-b border-slate-800 pb-3 mb-4">
              <div>
                <span className="text-[10px] text-slate-500 font-mono uppercase block">SMK TKJ AWARD 2026</span>
                <h3 className="font-bold text-white text-base">SERTIFIKAT KELULUSAN</h3>
              </div>
              <Award className="w-8 h-8 text-amber-500" />
            </div>

            <div className="space-y-3 font-mono text-xs">
              <p className="text-slate-400">Dengan ini menyatakan bahwa:</p>
              <p className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500 tracking-wide uppercase">
                {playerName}
              </p>
              <p className="text-slate-400 leading-relaxed">
                Telah membuktikan kecakapan teknis luar biasa dan dinyatakan lulus sertifikasi sebagai:
              </p>
              <p className="text-emerald-400 font-bold text-sm uppercase tracking-wider">
                👑 NETWORK INFRASTRUCTURE LEGEND (SMK TKJ)
              </p>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800 text-[10px] text-slate-500">
                <div>
                  <span className="block">SCORE XP DIRAIH:</span>
                  <span className="text-white font-bold text-sm font-mono">{gameState.score} XP</span>
                </div>
                <div>
                  <span className="block">SERTIFIKASI:</span>
                  <span className="text-emerald-400 font-bold">100% TERVERIFIKASI</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 max-w-sm mx-auto">
            <button
              onClick={handleRestartGame}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 uppercase tracking-wider text-xs cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" /> Mainkan Kembali
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active dialogue line details
  const activeQuest = gameState.quests.find((q) => q.locationId === gameState.currentLocation);
  const activeDialogues = activeNPC && dialogueType ? activeNPC.dialogues[dialogueType] : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none relative">
      
      {/* 1. Header Toolbar */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-indigo-950 border border-indigo-800 flex items-center justify-center">
            <Cpu className="w-5 h-5 text-indigo-400 animate-pulse" />
          </div>
          <div>
            <h1 className="text-md font-extrabold text-white tracking-tight uppercase">Network Adventure</h1>
            <span className="text-[10px] font-mono text-indigo-400 block uppercase font-bold">GAMEJar Oleh Nana Permana</span>
          </div>
        </div>

        {/* Global info tags */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-[10px] text-slate-500 font-mono">TEKNISI:</span>
            <span className="text-xs font-bold text-white">{playerName}</span>
          </div>

          <button
            onClick={handleRestartGame}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition flex items-center justify-center cursor-pointer"
            title="Mulai Ulang Game"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start overflow-y-auto">
        {/* Left Grid: Game world viewport map (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <GameCanvas
            currentLocation={gameState.currentLocation}
            unlockedLocations={gameState.unlockedLocations}
            quests={gameState.quests}
            onInteractNPC={handleInteractNPC}
            onInteractDevice={handleInteractDevice}
            onTransitionLocation={handleTransitionLocation}
            onShowMessage={showToast}
            isKeyboardDisabled={activeNPC !== null || activeSim !== null}
          />
        </div>

        {/* Right Grid: Quest progression and Backpack inventory (4 cols) */}
        <div className="lg:col-span-4">
          <QuestTracker
            quests={gameState.quests}
            inventory={gameState.inventory}
            score={gameState.score}
            currentLocation={gameState.currentLocation}
          />
        </div>
      </main>

      {/* 3. SYSTEM TOASTS WARNING */}
      {systemMsg && (
        <div className="fixed bottom-24 right-4 z-50 bg-slate-900 border-2 border-indigo-500/80 p-3.5 rounded-xl shadow-2xl max-w-xs animate-[slideLeft_0.3s_ease-out] flex gap-2.5 items-start">
          <ShieldAlert className="w-5 h-5 text-indigo-400 flex-shrink-0 animate-pulse" />
          <p className="text-xs text-slate-200 leading-relaxed">{systemMsg}</p>
        </div>
      )}

      {/* 4. DIALOG MODAL LAYOUT */}
      {activeNPC && activeDialogues && (
        <DialogModal
          npcName={activeNPC.name}
          npcRole={activeNPC.role}
          npcAvatar={activeNPC.avatar}
          dialogues={activeDialogues}
          onComplete={handleDialogueComplete}
        />
      )}

      {/* 5. INTERACTIVE SIMULATION MODALS OVERLAY */}
      {activeSim === SimulationType.ASSEMBLY && (
        <AssemblySim
          onSuccess={handleSimulationSuccess}
          onClose={() => setActiveSim(null)}
        />
      )}

      {activeSim === SimulationType.CABLE && (
        <CableSim
          onSuccess={handleSimulationSuccess}
          onClose={() => setActiveSim(null)}
        />
      )}

      {activeSim === SimulationType.TOPOLOGY && (
        <TopologySim
          onSuccess={handleSimulationSuccess}
          onClose={() => setActiveSim(null)}
        />
      )}

      {activeSim === SimulationType.ROUTER && (
        <RouterSim
          onSuccess={handleSimulationSuccess}
          onClose={() => setActiveSim(null)}
        />
      )}

      {activeSim === SimulationType.IP_CONFIG && (
        <IpTerminalSim
          onSuccess={handleSimulationSuccess}
          onClose={() => setActiveSim(null)}
        />
      )}
    </div>
  );
}
