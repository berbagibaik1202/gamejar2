/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect, FormEvent, KeyboardEvent } from "react";
import { CheckCircle, HelpCircle, Terminal, Cpu } from "lucide-react";
import { sfx } from "../../utils/audio";

interface TerminalLine {
  text: string;
  type: "input" | "output" | "error" | "system";
}

interface RouterSimProps {
  onSuccess: () => void;
  onClose: () => void;
}

export default function RouterSim({ onSuccess, onClose }: RouterSimProps) {
  const [terminalHistory, setTerminalHistory] = useState<TerminalLine[]>([
    { text: "=== KONEKSI CONSOLE DI-MULA ===", type: "system" },
    { text: "Membuka sesi serial pada interface /dev/ttyUSB0 (9600 baud)...", type: "system" },
    { text: "Router utama berhasil terhubung. Tekan 'ENTER' untuk memulai CLI.", type: "output" },
  ]);
  const [currentPrompt, setCurrentPrompt] = useState<string>("Router>");
  const [inputValue, setInputValue] = useState<string>("");
  const [commandState, setCommandState] = useState<"user" | "privileged" | "config" | "config_if">("user");
  const [ipConfigured, setIpConfigured] = useState<boolean>(false);
  const [interfaceUp, setInterfaceUp] = useState<boolean>(false);
  const [inputHistory, setInputHistory] = useState<string[]>([]);
  const [historyPointer, setHistoryPointer] = useState<number>(-1);
  const [feedback, setFeedback] = useState<string>("Masukkan CLI Router. Lihat panduan perintah di kanan jika kamu bingung.");

  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalHistory]);

  const handleCommandSubmit = (e: FormEvent) => {
    e.preventDefault();
    const command = inputValue.trim();
    if (!command) {
      // Empty enter
      setTerminalHistory((prev) => [...prev, { text: `${currentPrompt}`, type: "input" }]);
      setInputValue("");
      return;
    }

    // Append to input history
    setInputHistory((prev) => [command, ...prev]);
    setHistoryPointer(-1);

    // Print command to screen
    const fullPromptInput = `${currentPrompt} ${command}`;
    setTerminalHistory((prev) => [...prev, { text: fullPromptInput, type: "input" }]);

    const cmdLower = command.toLowerCase();

    // Process Cisco IOS commands
    setTimeout(() => {
      let response: TerminalLine[] = [];
      let newPrompt = currentPrompt;
      let newState = commandState;
      let isSuccess = false;
      let isError = false;

      if (cmdLower === "help" || cmdLower === "?") {
        isSuccess = true;
        response = [
          { text: "Daftar Perintah yang Tersedia:", type: "system" },
          { text: "  enable (atau 'en') - Masuk ke Privileged mode", type: "output" },
          { text: "  configure terminal (atau 'conf t') - Masuk ke Global config", type: "output" },
          { text: "  interface eth0 (atau 'int eth0') - Masuk ke config interface eth0", type: "output" },
          { text: "  ip address [ip] [netmask] - Atur IP Address port", type: "output" },
          { text: "  no shutdown (atau 'no shut') - Hidupkan port interface", type: "output" },
          { text: "  exit - Keluar atau mundur satu tingkat mode", type: "output" },
          { text: "  show running-config (atau 'sh run') - Tampilkan konfigurasi berjalan", type: "output" },
        ];
      } else if (cmdLower === "exit") {
        isSuccess = true;
        if (commandState === "privileged") {
          newState = "user";
          newPrompt = "Router>";
          response = [{ text: "Keluar dari mode administrator.", type: "output" }];
        } else if (commandState === "config") {
          newState = "privileged";
          newPrompt = "Router#";
          response = [{ text: "Keluar dari mode konfigurasi global.", type: "output" }];
        } else if (commandState === "config_if") {
          newState = "config";
          newPrompt = "Router(config)#";
          response = [{ text: "Keluar dari mode konfigurasi interface.", type: "output" }];
        } else {
          response = [{ text: "Sudah berada di mode terluar. Sesi console tetap berjalan.", type: "output" }];
        }
      } else if (commandState === "user") {
        // User Exec Mode
        if (cmdLower === "enable" || cmdLower === "en") {
          isSuccess = true;
          newState = "privileged";
          newPrompt = "Router#";
          response = [{ text: "Memasuki mode Privileged Exec.", type: "output" }];
        } else {
          isError = true;
          response = [{ text: `% Unknown command or computer error: '${command}'. Ketik 'enable' untuk memulai.`, type: "error" }];
        }
      } else if (commandState === "privileged") {
        // Privileged Exec Mode
        if (cmdLower === "configure terminal" || cmdLower === "conf t" || cmdLower === "config t") {
          isSuccess = true;
          newState = "config";
          newPrompt = "Router(config)#";
          response = [{ text: "Memasuki mode konfigurasi global. Ketik 'exit' untuk kembali.", type: "output" }];
        } else if (cmdLower === "show running-config" || cmdLower === "sh run") {
          isSuccess = true;
          response = [
            { text: "Building configuration...", type: "system" },
            { text: "Current configuration : 1024 bytes", type: "output" },
            { text: "!", type: "output" },
            { text: "hostname Router", type: "output" },
            { text: `interface FastEthernet0/1 (eth0)`, type: "output" },
            { text: `  ip address ${ipConfigured ? "192.168.1.1 255.255.255.0" : "unassigned"}`, type: "output" },
            { text: `  shutdown state: ${interfaceUp ? "NO SHUTDOWN (UP)" : "SHUTDOWN (DOWN)"}`, type: "output" },
            { text: "!", type: "output" },
            { text: "end", type: "output" },
          ];
        } else {
          isError = true;
          response = [{ text: `% Unknown or incomplete command: '${command}'. Ketik 'configure terminal' untuk konfig.`, type: "error" }];
        }
      } else if (commandState === "config") {
        // Global Config Mode
        if (cmdLower === "interface eth0" || cmdLower === "int eth0" || cmdLower === "interface fastethernet0/1") {
          isSuccess = true;
          newState = "config_if";
          newPrompt = "Router(config-if)#";
          response = [{ text: "Memasuki konfigurasi FastEthernet0/1 (eth0).", type: "output" }];
        } else {
          isError = true;
          response = [{ text: `% Invalid command at this level. Ketik 'interface eth0' untuk config ethernet.`, type: "error" }];
        }
      } else if (commandState === "config_if") {
        // Interface Config Mode
        if (cmdLower.startsWith("ip address ") || cmdLower.startsWith("ip add ")) {
          // Check for correct IP 192.168.1.1 255.255.255.0
          const parts = command.split(/\s+/);
          const ip = parts[2];
          const mask = parts[3];

          if (ip === "192.168.1.1" && mask === "255.255.255.0") {
            isSuccess = true;
            setIpConfigured(true);
            response = [{ text: `IP Address eth0 diset ke: 192.168.1.1 dengan netmask 255.255.255.0`, type: "output" }];
            setFeedback("IP terpasang dengan benar! Sekarang ketik 'no shutdown' untuk menyalakan interface.");
          } else {
            isError = true;
            response = [
              { text: "% Invalid IP address or netmask format.", type: "error" },
              { text: "Format: ip address [192.168.1.1] [255.255.255.0]", type: "system" }
            ];
          }
        } else if (cmdLower === "no shutdown" || cmdLower === "no shut") {
          if (!ipConfigured) {
            isError = true;
            response = [{ text: "% Error: Beri IP address pada interface terlebih dahulu sebelum menyalakan!", type: "error" }];
          } else {
            isSuccess = true;
            setInterfaceUp(true);
            response = [
              { text: "%LINK-5-CHANGED: Interface FastEthernet0/1, changed state to UP", type: "output" },
              { text: "%LINEPROTO-5-UPDOWN: Line protocol on Interface FastEthernet0/1, changed state to UP", type: "system" },
              { text: "Koneksi LAN kembali normal! Sinyal Router menyala hijau stabil.", type: "output" }
            ];
            setFeedback("Sempurna! Router kembali aktif dan internet sekolah menyala. Klik SELESAIKAN MISI.");
          }
        } else {
          isError = true;
          response = [{ text: `% Unknown interface command. Format IP: 'ip address 192.168.1.1 255.255.255.0'`, type: "error" }];
        }
      }

      if (isSuccess) {
        sfx.playSuccess();
      } else if (isError) {
        sfx.playError();
      } else {
        sfx.playClick();
      }

      setTerminalHistory((prev) => [...prev, ...response]);
      setCurrentPrompt(newPrompt);
      setCommandState(newState);
      setInputValue("");
    }, 150);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (inputHistory.length > 0 && historyPointer < inputHistory.length - 1) {
        const nextPtr = historyPointer + 1;
        setHistoryPointer(nextPtr);
        setInputValue(inputHistory[nextPtr]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyPointer > 0) {
        const nextPtr = historyPointer - 1;
        setHistoryPointer(nextPtr);
        setInputValue(inputHistory[nextPtr]);
      } else {
        setHistoryPointer(-1);
        setInputValue("");
      }
    }
  };

  const insertSuggestion = (suggestion: string) => {
    sfx.playClick();
    setInputValue(suggestion);
    setFeedback(`Klik Enter untuk menjalankan perintah: '${suggestion}'`);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl rounded-xl shadow-2xl overflow-hidden flex flex-col h-[90vh]">
        {/* Header */}
        <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center">
          <div>
            <span className="text-xs font-mono px-2 py-1 bg-emerald-950 text-emerald-400 rounded border border-emerald-800 uppercase mr-2">
              Level 4
            </span>
            <h2 className="text-xl font-bold text-white inline-block">Simulasi: CLI Cisco Router Configuration</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded-md text-sm transition"
          >
            Keluar Game
          </button>
        </div>

        {/* Workspace Grid */}
        <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto">
          
          {/* Left Column: Command prompt Terminal */}
          <div className="lg:col-span-8 bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col h-[60vh] lg:h-auto">
            {/* Terminal Window Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono font-bold text-slate-400">console@cisco_router_fa0_1</span>
              </div>
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              </div>
            </div>

            {/* Terminal Output Stream */}
            <div className="flex-1 bg-black p-4 rounded border border-slate-800 font-mono text-sm overflow-y-auto select-text">
              <div className="space-y-1">
                {terminalHistory.map((line, idx) => {
                  let colorClass = "text-slate-300";
                  if (line.type === "input") colorClass = "text-white font-bold";
                  else if (line.type === "error") colorClass = "text-red-400";
                  else if (line.type === "system") colorClass = "text-indigo-400 text-xs italic";
                  else if (line.type === "output") {
                    colorClass = line.text.includes("UP") ? "text-emerald-400 font-bold" : "text-emerald-500";
                  }

                  return (
                    <p key={idx} className={`${colorClass} whitespace-pre-wrap`}>
                      {line.text}
                    </p>
                  );
                })}
                <div ref={terminalEndRef} />
              </div>
            </div>

            {/* Terminal Input Form */}
            <form onSubmit={handleCommandSubmit} className="mt-3 flex items-center bg-black border border-slate-800 p-2 rounded">
              <span className="text-emerald-500 font-mono font-bold mr-2 select-none">{currentPrompt}</span>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent border-none text-white font-mono text-sm outline-none focus:ring-0 p-0"
                placeholder="Ketik perintah di sini... (Ketik '?' untuk bantuan)"
                autoFocus
              />
            </form>
          </div>

          {/* Right Column: Reference Guides & Simulation state */}
          <div className="lg:col-span-4 bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2 border-b border-slate-800 pb-2">
                  <Cpu className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                    Status Router Aktif
                  </h3>
                </div>

                {/* Simulated hardware state block */}
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 grid grid-cols-2 gap-4 text-xs font-mono">
                  <div className="flex flex-col">
                    <span className="text-slate-500">PORT STATUS:</span>
                    <span className={`font-bold ${interfaceUp ? "text-emerald-400 animate-pulse" : "text-red-500"}`}>
                      {interfaceUp ? "● NO SHUTDOWN (UP)" : "● SHUTDOWN (DOWN)"}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-500">INTERFACE IP:</span>
                    <span className="text-slate-200 font-bold">
                      {ipConfigured ? "192.168.1.1" : "NOT SET"}
                    </span>
                  </div>
                  <div className="col-span-2 flex flex-col pt-2 border-t border-slate-800">
                    <span className="text-slate-500">NETMASK:</span>
                    <span className="text-slate-400">{ipConfigured ? "255.255.255.0" : "-"}</span>
                  </div>
                </div>
              </div>

              {/* Suggestions quick tap for help */}
              <div>
                <span className="text-xs text-indigo-400 font-bold uppercase block mb-2">💡 Langkah Pintar & Cheat:</span>
                
                <div className="grid grid-cols-1 gap-2 text-xs">
                  {commandState === "user" && (
                    <button
                      onClick={() => insertSuggestion("enable")}
                      className="p-2 bg-slate-900 border border-slate-800 hover:border-indigo-500 text-left rounded text-indigo-300 transition"
                    >
                      <span className="font-bold block text-white">Langkah 1:</span>
                      Ketik <code className="text-yellow-400 font-mono">enable</code> untuk masuk administrator.
                    </button>
                  )}

                  {commandState === "privileged" && (
                    <button
                      onClick={() => insertSuggestion("configure terminal")}
                      className="p-2 bg-slate-900 border border-slate-800 hover:border-indigo-500 text-left rounded text-indigo-300 transition"
                    >
                      <span className="font-bold block text-white">Langkah 2:</span>
                      Ketik <code className="text-yellow-400 font-mono">configure terminal</code> untuk config global.
                    </button>
                  )}

                  {commandState === "config" && (
                    <button
                      onClick={() => insertSuggestion("interface eth0")}
                      className="p-2 bg-slate-900 border border-slate-800 hover:border-indigo-500 text-left rounded text-indigo-300 transition"
                    >
                      <span className="font-bold block text-white">Langkah 3:</span>
                      Ketik <code className="text-yellow-400 font-mono">interface eth0</code> untuk masuk setting port.
                    </button>
                  )}

                  {commandState === "config_if" && !ipConfigured && (
                    <button
                      onClick={() => insertSuggestion("ip address 192.168.1.1 255.255.255.0")}
                      className="p-2 bg-slate-900 border border-slate-800 hover:border-indigo-500 text-left rounded text-indigo-300 transition"
                    >
                      <span className="font-bold block text-white">Langkah 4:</span>
                      Ketik <code className="text-yellow-400 font-mono">ip address 192.168.1.1 255.255.255.0</code> untuk atur IP.
                    </button>
                  )}

                  {commandState === "config_if" && ipConfigured && !interfaceUp && (
                    <button
                      onClick={() => insertSuggestion("no shutdown")}
                      className="p-2 bg-slate-900 border border-slate-800 hover:border-indigo-500 text-left rounded text-indigo-300 transition"
                    >
                      <span className="font-bold block text-white">Langkah 5 (Terakhir):</span>
                      Ketik <code className="text-yellow-400 font-mono">no shutdown</code> untuk menyalakan sinyal kabel!
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Instruction Guidance Panel Footer */}
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 mt-4 space-y-2">
              <span className="text-xs text-slate-400 block font-mono">PANDUAN AKTIF:</span>
              <p className="text-xs text-slate-300 leading-relaxed">{feedback}</p>

              {interfaceUp && ipConfigured && (
                <button
                  onClick={() => { sfx.playQuestComplete(); onSuccess(); }}
                  className="w-full mt-2 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded shadow-md text-sm transition-all flex items-center justify-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" /> SELESAIKAN MISI
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
