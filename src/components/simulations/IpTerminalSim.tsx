/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect, FormEvent } from "react";
import { CheckCircle, Network, Terminal as TermIcon, Monitor, Settings, X } from "lucide-react";
import { sfx } from "../../utils/audio";

interface TerminalLine {
  text: string;
  type: "input" | "output" | "error" | "system";
}

interface IpTerminalSimProps {
  onSuccess: () => void;
  onClose: () => void;
}

export default function IpTerminalSim({ onSuccess, onClose }: IpTerminalSimProps) {
  // OS Windows States
  const [activeWindow, setActiveWindow] = useState<"ip" | "terminal" | null>("ip");
  
  // IP Config State
  const [ipAddress, setIpAddress] = useState("");
  const [subnetMask, setSubnetMask] = useState("");
  const [gateway, setGateway] = useState("");
  const [isIpSaved, setIsIpSaved] = useState(false);
  const [ipError, setIpError] = useState("");

  // Terminal State
  const [terminalHistory, setTerminalHistory] = useState<TerminalLine[]>([
    { text: "DC-OS Diagnostics Core Terminal [Version 4.1.2026]", type: "system" },
    { text: "Hak Cipta (c) Mega Data Center Corp. Semua hak dilindungi.", type: "system" },
    { text: "Ketik 'help' untuk daftar perintah.", type: "output" },
    { text: "", type: "output" },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [pingSuccess, setPingSuccess] = useState(false);
  const [isPingRunning, setIsPingRunning] = useState(false);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalHistory]);

  const handleSaveIp = (e: FormEvent) => {
    e.preventDefault();
    setIpError("");

    if (ipAddress !== "10.0.0.100") {
      sfx.playError();
      setIpError("IP Address salah! Data Center Server Diagnostik harus menggunakan IP statis cadangan '10.0.0.100'");
      setIsIpSaved(false);
      return;
    }
    if (subnetMask !== "255.255.255.0") {
      sfx.playError();
      setIpError("Subnet Mask salah! Gunakan subnet default Kelas C '255.255.255.0'");
      setIsIpSaved(false);
      return;
    }
    if (gateway !== "10.0.0.1") {
      sfx.playError();
      setIpError("Gateway salah! Gateway Utama Data Center berada pada IP '10.0.0.1'");
      setIsIpSaved(false);
      return;
    }

    sfx.playSuccess();
    setIsIpSaved(true);
    setTerminalHistory((prev) => [
      ...prev,
      { text: `[SYSTEM]: Adaptor Jaringan 'eth0' dihubungkan kembali.`, type: "system" },
      { text: `[SYSTEM]: Konfigurasi IP baru tersimpan: IP=${ipAddress} Mask=${subnetMask} GW=${gateway}`, type: "system" },
    ]);
  };

  const handleTerminalCommand = (e: FormEvent) => {
    e.preventDefault();
    const command = inputValue.trim();
    if (!command) return;

    sfx.playClick();
    setTerminalHistory((prev) => [...prev, { text: `C:\\Users\\Administrator> ${command}`, type: "input" }]);
    const cmdLower = command.toLowerCase();
    setInputValue("");

    if (cmdLower === "help" || cmdLower === "?") {
      setTimeout(() => {
        sfx.playClick();
        setTerminalHistory((prev) => [
          ...prev,
          { text: "Perintah Konsol Diagnostik:", type: "system" },
          { text: "  ipconfig  - Menampilkan ringkasan konfigurasi adapter LAN", type: "output" },
          { text: "  ping [ip] - Menguji konektivitas antar host jaringan", type: "output" },
          { text: "  cls       - Membersihkan baris terminal", type: "output" },
          { text: "  sysinfo   - Menampilkan spesifikasi sistem server", type: "output" },
        ]);
      }, 100);
    } else if (cmdLower === "cls" || cmdLower === "clear") {
      setTerminalHistory([]);
    } else if (cmdLower === "sysinfo") {
      setTimeout(() => {
        sfx.playClick();
        setTerminalHistory((prev) => [
          ...prev,
          { text: "--- DIAGNOSTICS SYSTEM INFO ---", type: "system" },
          { text: "Model: DC-DIAGNOSTIC-FRAME-02", type: "output" },
          { text: "OS: Enterprise DC-OS v4.1 (Linux Core)", type: "output" },
          { text: "Uptime: 247 hari, 12 jam", type: "output" },
          { text: "Koneksi NIC: Ethernet RJ45 (10Gbps Link)", type: "output" },
        ]);
      }, 100);
    } else if (cmdLower === "ipconfig" || cmdLower === "ifconfig") {
      setTimeout(() => {
        sfx.playClick();
        if (!isIpSaved) {
          setTerminalHistory((prev) => [
            ...prev,
            { text: "Adaptor Ethernet eth0 (Local LAN):", type: "output" },
            { text: "  Status Koneksi: Terputus / Unconfigured", type: "error" },
            { text: "  IP Address.................: 0.0.0.0", type: "output" },
            { text: "  Subnet Mask................: 0.0.0.0", type: "output" },
            { text: "  Default Gateway............: 0.0.0.0", type: "output" },
          ]);
        } else {
          setTerminalHistory((prev) => [
            ...prev,
            { text: "Adaptor Ethernet eth0 (Local LAN):", type: "output" },
            { text: "  Status Koneksi: Terhubung", type: "system" },
            { text: `  IP Address.................: ${ipAddress}`, type: "output" },
            { text: `  Subnet Mask................: ${subnetMask}`, type: "output" },
            { text: `  Default Gateway............: ${gateway}`, type: "output" },
          ]);
        }
      }, 150);
    } else if (cmdLower.startsWith("ping ")) {
      const pingTarget = command.substring(5).trim();
      setIsPingRunning(true);

      setTimeout(() => {
        sfx.playClick();
        setTerminalHistory((prev) => [...prev, { text: `Melakukan ping ke ${pingTarget} dengan 32 byte data:`, type: "output" }]);

        let pings = [1, 2, 3, 4];
        pings.forEach((num, index) => {
          setTimeout(() => {
            if (isIpSaved && pingTarget === "10.0.0.1") {
              sfx.playClick();
              setTerminalHistory((prev) => [
                ...prev,
                { text: `Balasan dari ${pingTarget}: byte=32 waktu=${1 + index}ms TTL=64`, type: "output" }
              ]);

              if (num === 4) {
                setTimeout(() => {
                  sfx.playSuccess();
                  setTerminalHistory((prev) => [
                    ...prev,
                    { text: `--- Statistik Ping untuk ${pingTarget} ---`, type: "system" },
                    { text: ` Paket: Terkirim = 4, Diterima = 4, Hilang = 0 (0% kehilangan)`, type: "system" },
                    { text: `SUCCESS! Ping ke Gateway Utama Sukses! Downtime Data Center Pulih!`, type: "system" },
                  ]);
                  setPingSuccess(true);
                  setIsPingRunning(false);
                }, 400);
              }
            } else {
              sfx.playError();
              setTerminalHistory((prev) => [
                ...prev,
                { text: `RTO: Request timed out. (Tujuan tidak dapat dijangkau)`, type: "error" }
              ]);

              if (num === 4) {
                setTimeout(() => {
                  sfx.playError();
                  setTerminalHistory((prev) => [
                    ...prev,
                    { text: `--- Statistik Ping untuk ${pingTarget} ---`, type: "system" },
                    { text: ` Paket: Terkirim = 4, Diterima = 0, Hilang = 4 (100% kehilangan)`, type: "error" },
                    { text: `Gagal menjangkau host. Pastikan IP statis dan Gateway Anda sudah benar!`, type: "error" },
                  ]);
                  setIsPingRunning(false);
                }, 400);
              }
            }
          }, (index + 1) * 600);
        });
      }, 200);
    } else {
      setTimeout(() => {
        sfx.playError();
        setTerminalHistory((prev) => [
          ...prev,
          { text: `% Perintah '${command}' tidak dikenali oleh system. Ketik 'help' untuk daftar perintah.`, type: "error" }
        ]);
      }, 100);
    }
  };

  const handleReset = () => {
    setIpAddress("");
    setSubnetMask("");
    setGateway("");
    setIsIpSaved(false);
    setPingSuccess(false);
    setIpError("");
    setTerminalHistory([
      { text: "DC-OS Diagnostics Core Terminal [Version 4.1.2026]", type: "system" },
      { text: "Hak Cipta (c) Mega Data Center Corp. Semua hak dilindungi.", type: "system" },
      { text: "Ketik 'help' untuk daftar perintah.", type: "output" },
      { text: "", type: "output" },
    ]);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl rounded-xl shadow-2xl overflow-hidden flex flex-col h-[90vh]">
        {/* Header */}
        <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center">
          <div>
            <span className="text-xs font-mono px-2 py-1 bg-red-950 text-red-400 rounded border border-red-800 uppercase mr-2 animate-pulse">
              FINAL LEVEL
            </span>
            <h2 className="text-xl font-bold text-white inline-block">Simulasi: Diagnostic Terminal Data Center</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded-md text-sm transition"
          >
            Keluar Game
          </button>
        </div>

        {/* Operating System Desktop Mockup */}
        <div className="flex-1 bg-slate-950 p-6 flex flex-col lg:flex-row gap-6 relative overflow-y-auto">
          {/* Grid Background */}
          <div className="absolute inset-0 bg-[radial-gradient(rgba(14,165,233,0.07)_1.5px,transparent_1.5px)] bg-[size:24px_24px] pointer-events-none" />

          {/* Desktop Left Side panel: App Launchers */}
          <div className="lg:w-44 flex flex-row lg:flex-col gap-4 z-10 border-b lg:border-b-0 lg:border-r border-slate-800/80 pb-4 lg:pb-0 lg:pr-4">
            <button
              onClick={() => setActiveWindow("ip")}
              className={`flex-1 lg:flex-initial p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-center ${
                activeWindow === "ip"
                  ? "bg-sky-950/60 border-sky-500 text-sky-400 shadow-[0_0_12px_rgba(14,165,233,0.15)]"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300 hover:border-slate-700"
              }`}
            >
              <Settings className="w-8 h-8" />
              <span className="text-[11px] font-bold tracking-tight">Konfigurasi IP (GUI)</span>
            </button>

            <button
              onClick={() => setActiveWindow("terminal")}
              className={`flex-1 lg:flex-initial p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-center ${
                activeWindow === "terminal"
                  ? "bg-sky-950/60 border-sky-500 text-sky-400 shadow-[0_0_12px_rgba(14,165,233,0.15)]"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300 hover:border-slate-700"
              }`}
            >
              <TermIcon className="w-8 h-8" />
              <span className="text-[11px] font-bold tracking-tight">Terminal CLI</span>
            </button>

            <div className="hidden lg:block mt-auto bg-slate-900/30 p-3 rounded-lg border border-slate-800/60 text-[10px] font-mono text-slate-500">
              <span className="text-[11px] text-sky-400 font-bold block mb-1">TARGET SERVER:</span>
              <p>IP: 10.0.0.100</p>
              <p>Net: 255.255.255.0</p>
              <p>GW: 10.0.0.1</p>
            </div>
          </div>

          {/* Desktop Workspace: Active App Window */}
          <div className="flex-1 flex flex-col z-10 bg-slate-900/40 rounded-xl border border-slate-800 p-4 relative min-h-[380px]">
            
            {/* 1. IP CONFIGURATION GUI WINDOW */}
            {activeWindow === "ip" && (
              <div className="flex-1 flex flex-col">
                {/* Window Titlebar */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-4">
                  <div className="flex items-center gap-2 text-sky-400">
                    <Settings className="w-4 h-4" />
                    <span className="text-xs font-bold font-mono">Control Panel - Adaptor Adapter Properties</span>
                  </div>
                  <button onClick={() => setActiveWindow(null)} className="text-slate-500 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Properties Form */}
                <form onSubmit={handleSaveIp} className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto items-center">
                  <div className="space-y-4">
                    <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800 text-xs text-slate-400 space-y-1.5">
                      <span className="font-bold text-sky-400 block">TUGAS:</span>
                      <p>Koneksi server cadangan di Data Center putus total.</p>
                      <p>Konfigurasikan IP Statis IPv4 untuk server agar berada dalam subnet Gateway (10.0.0.1).</p>
                    </div>

                    {ipError && (
                      <div className="p-3 bg-red-950/40 border border-red-900 rounded text-xs text-red-400">
                        {ipError}
                      </div>
                    )}

                    {isIpSaved && (
                      <div className="p-3 bg-emerald-950/40 border border-emerald-900 rounded text-xs text-emerald-400 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" /> Konfigurasi IP tersimpan di Adaptor!
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3 shadow-md">
                    <span className="text-[11px] font-mono text-slate-400 block border-b border-slate-800 pb-1.5 uppercase font-bold">
                      Ethernet Adapter Properties
                    </span>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-500 block">IP ADDRESS (STATIS IPv4)</label>
                      <input
                        type="text"
                        value={ipAddress}
                        onChange={(e) => { setIpAddress(e.target.value); setIsIpSaved(false); }}
                        className="w-full bg-black border border-slate-800 rounded px-2.5 py-1.5 text-sm text-sky-400 font-mono outline-none focus:border-sky-500"
                        placeholder="Contoh: 10.0.0.5"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-500 block">SUBNET MASK</label>
                      <input
                        type="text"
                        value={subnetMask}
                        onChange={(e) => { setSubnetMask(e.target.value); setIsIpSaved(false); }}
                        className="w-full bg-black border border-slate-800 rounded px-2.5 py-1.5 text-sm text-sky-400 font-mono outline-none focus:border-sky-500"
                        placeholder="Contoh: 255.255.255.0"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-500 block">DEFAULT GATEWAY</label>
                      <input
                        type="text"
                        value={gateway}
                        onChange={(e) => { setGateway(e.target.value); setIsIpSaved(false); }}
                        className="w-full bg-black border border-slate-800 rounded px-2.5 py-1.5 text-sm text-sky-400 font-mono outline-none focus:border-sky-500"
                        placeholder="Contoh: 10.0.0.1"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isIpSaved}
                      className="w-full mt-2 py-2 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white text-xs font-bold rounded shadow transition"
                    >
                      Terapkan Konfigurasi
                    </button>
                  </div>
                </form>

                <div className="mt-auto border-t border-slate-800/50 pt-3 flex justify-between text-xs text-slate-500">
                  <span>Sistem: Adaptor ethernet eth0 diidentifikasi.</span>
                  {isIpSaved && (
                    <button
                      onClick={() => setActiveWindow("terminal")}
                      className="text-sky-400 font-bold hover:underline"
                    >
                      Buka Terminal dan lakukan ping ke Gateway &rarr;
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* 2. CORE TERMINAL CLI WINDOW */}
            {activeWindow === "terminal" && (
              <div className="flex-1 flex flex-col h-full">
                {/* Window Titlebar */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                  <div className="flex items-center gap-2 text-sky-400">
                    <TermIcon className="w-4 h-4" />
                    <span className="text-xs font-bold font-mono">DC-OS Shell Terminal - Cmd.exe</span>
                  </div>
                  <button onClick={() => setActiveWindow(null)} className="text-slate-500 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Output console log screen */}
                <div className="flex-1 bg-black rounded p-3 font-mono text-xs text-sky-500 border border-slate-800 overflow-y-auto max-h-[220px]">
                  <div className="space-y-1">
                    {terminalHistory.map((line, idx) => {
                      let styleClass = "text-sky-500";
                      if (line.type === "input") styleClass = "text-white font-bold";
                      else if (line.type === "error") styleClass = "text-red-400";
                      else if (line.type === "system") styleClass = "text-indigo-400 italic";

                      return (
                        <p key={idx} className={styleClass}>
                          {line.text}
                        </p>
                      );
                    })}
                    <div ref={terminalEndRef} />
                  </div>
                </div>

                {/* Input cmd shell bar */}
                <form onSubmit={handleTerminalCommand} className="mt-3 flex items-center bg-black border border-slate-800 p-2 rounded">
                  <span className="text-sky-500 font-mono font-bold mr-2 select-none">C:\Users\Administrator&gt;</span>
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    disabled={isPingRunning}
                    className="flex-1 bg-transparent border-none text-white font-mono text-xs outline-none focus:ring-0 p-0"
                    placeholder={isPingRunning ? "Menunggu respon ICMP..." : "Ketik 'ipconfig' atau 'ping 10.0.0.1'..."}
                    autoFocus
                  />
                </form>

                {/* Quick helpers for testing */}
                <div className="mt-3 flex gap-2 flex-wrap text-[10px] font-mono">
                  <button
                    onClick={() => { sfx.playClick(); setInputValue("ipconfig"); }}
                    className="px-2 py-1 bg-slate-800 border border-slate-700 text-slate-300 rounded hover:bg-slate-700 transition"
                  >
                    ipconfig
                  </button>
                  <button
                    onClick={() => { sfx.playClick(); setInputValue("ping 10.0.0.1"); }}
                    className="px-2 py-1 bg-slate-800 border border-slate-700 text-slate-300 rounded hover:bg-slate-700 transition"
                  >
                    ping 10.0.0.1
                  </button>
                  <button
                    onClick={() => { sfx.playClick(); setInputValue("sysinfo"); }}
                    className="px-2 py-1 bg-slate-800 border border-slate-700 text-slate-300 rounded hover:bg-slate-700 transition"
                  >
                    sysinfo
                  </button>
                </div>
              </div>
            )}

            {/* 3. BOTH WINDOWS CLOSED */}
            {activeWindow === null && (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-600">
                <Monitor className="w-16 h-16 text-slate-700 mb-2" />
                <span className="text-sm font-bold font-mono">OS DESKTOP KOSONG</span>
                <p className="text-xs max-w-xs mt-1">Silakan klik salah satu ikon di sebelah kiri untuk membuka aplikasi konfigurasi diagnostic.</p>
              </div>
            )}
          </div>
        </div>

        {/* Global actions at bottom */}
        <div className="bg-slate-950 p-4 border-t border-slate-800 flex justify-between items-center">
          <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${pingSuccess ? "bg-emerald-400 animate-ping" : "bg-red-500"}`} />
            <span>KONEKTIVITAS DATA CENTER: {pingSuccess ? "ONLINE (RESTORED)" : "OFFLINE (CRITICAL)"}</span>
          </div>

          <div className="flex gap-2">
            {pingSuccess && (
              <button
                onClick={() => { sfx.playQuestComplete(); onSuccess(); }}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold rounded-lg text-sm transition shadow-md flex items-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4 animate-bounce" /> SELESAIKAN MISI FINAL
              </button>
            )}

            <button
              onClick={() => { sfx.playClick(); handleReset(); }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs rounded border border-slate-700"
            >
              Reset OS Workspace
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
