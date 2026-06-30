/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from "react";
import { LocationId, MapConfig, MapElement, Position2D, Quest, SimulationType } from "../types";
import { MAPS } from "../gameData";
import { Compass, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Hand } from "lucide-react";
import { sfx } from "../utils/audio";

interface GameCanvasProps {
  currentLocation: LocationId;
  unlockedLocations: LocationId[];
  quests: Quest[];
  onInteractNPC: (npcId: string) => void;
  onInteractDevice: (simType: SimulationType) => void;
  onTransitionLocation: (target: LocationId, spawnPoint: Position2D) => void;
  onShowMessage: (msg: string) => void;
  isKeyboardDisabled?: boolean;
}

export default function GameCanvas({
  currentLocation,
  unlockedLocations,
  quests,
  onInteractNPC,
  onInteractDevice,
  onTransitionLocation,
  onShowMessage,
  isKeyboardDisabled = false,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const frameCounterRef = useRef<number>(0);
  const map: MapConfig = MAPS[currentLocation];
  
  // Player state
  const [playerPos, setPlayerPos] = useState<Position2D>(map.spawnPoint);
  const [playerDir, setPlayerDir] = useState<"up" | "down" | "left" | "right">("down");

  // Keep player local position updated when location changes
  useEffect(() => {
    setPlayerPos(map.spawnPoint);
    setPlayerDir("down");
  }, [currentLocation, map.spawnPoint]);

  // Handle key listeners for grid-based movement
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If a dialog or active simulation is open, completely bypass technician movement!
      if (isKeyboardDisabled) {
        return;
      }

      let dx = 0;
      let dy = 0;
      let newDir: "up" | "down" | "left" | "right" | null = null;

      const key = e.key.toLowerCase();
      if (key === "arrowup" || key === "w") {
        dy = -1;
        newDir = "up";
      } else if (key === "arrowdown" || key === "s") {
        dy = 1;
        newDir = "down";
      } else if (key === "arrowleft" || key === "a") {
        dx = -1;
        newDir = "left";
      } else if (key === "arrowright" || key === "d") {
        dx = 1;
        newDir = "right";
      } else if (e.key === " " || key === "e") {
        e.preventDefault();
        triggerInteract();
        return;
      }

      if (dx !== 0 || dy !== 0) {
        e.preventDefault();
        movePlayer(dx, dy, newDir!);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [playerPos, currentLocation, unlockedLocations, quests, isKeyboardDisabled]);

  // Check if grid coordinates are solid/blocked
  const isBlocked = (x: number, y: number): boolean => {
    if (x < 0 || x >= map.width || y < 0 || y >= map.height) {
      return true;
    }

    return map.elements.some((el) => {
      if (el.type === "door") return false; // Doors are passable
      
      const withinX = x >= el.x && x < el.x + el.width;
      const withinY = y >= el.y && y < el.y + el.height;
      return withinX && withinY;
    });
  };

  const movePlayer = (dx: number, dy: number, dir: "up" | "down" | "left" | "right") => {
    setPlayerDir(dir);
    const targetX = playerPos.x + dx;
    const targetY = playerPos.y + dy;

    if (!isBlocked(targetX, targetY)) {
      const door = map.elements.find(
        (el) => el.type === "door" && el.x === targetX && el.y === targetY
      );

      if (door && door.targetLocation) {
        const isUnlocked = unlockedLocations.includes(door.targetLocation);
        if (isUnlocked) {
          const destMap = MAPS[door.targetLocation];
          sfx.playSuccess();
          onTransitionLocation(door.targetLocation, destMap.spawnPoint);
          onShowMessage(`Berhasil berpindah ke: ${destMap.name}`);
        } else {
          sfx.playError();
          const activeQuest = quests.find(q => q.locationId === currentLocation && q.status === "active");
          onShowMessage(`🔒 Pintu Terkunci! Selesaikan misi aktif [${activeQuest?.title || "TKJ"}] terlebih dahulu!`);
        }
        return;
      }

      sfx.playFootstep();
      setPlayerPos({ x: targetX, y: targetY });
    } else {
      sfx.playError();
    }
  };

  const getAdjacentElement = (): MapElement | null => {
    const offsets = [
      { dx: 0, dy: -1 }, // Up
      { dx: 0, dy: 1 },  // Down
      { dx: -1, dy: 0 }, // Left
      { dx: 1, dy: 0 }   // Right
    ];

    for (const offset of offsets) {
      const checkX = playerPos.x + offset.dx;
      const checkY = playerPos.y + offset.dy;

      const element = map.elements.find((el) => {
        const withinX = checkX >= el.x && checkX < el.x + el.width;
        const withinY = checkY >= el.y && checkY < el.y + el.height;
        return withinX && withinY;
      });

      if (element && (element.type === "npc" || element.type === "device")) {
        return element;
      }
    }
    return null;
  };

  const triggerInteract = () => {
    const adj = getAdjacentElement();
    if (!adj) {
      sfx.playError();
      onShowMessage("Dekati Guru, Asisten, atau komputer yang rusak untuk berinteraksi!");
      return;
    }

    sfx.playClick();
    if (adj.type === "npc" && adj.npcId) {
      onInteractNPC(adj.npcId);
    } else if (adj.type === "device" && adj.simType) {
      const currentActiveQuest = quests.find(q => q.locationId === currentLocation);
      if (currentActiveQuest && currentActiveQuest.status === "active") {
        onInteractDevice(adj.simType);
      } else if (currentActiveQuest && currentActiveQuest.status === "completed") {
        onShowMessage("✅ Simulasi ini sudah kamu selesaikan sempurna!");
      } else {
        onShowMessage("Bicara dengan NPC di ruangan ini dulu untuk mendapatkan instruksi!");
      }
    }
  };

  // 60FPS continuous render loop for animations, blinking lights and visual enhancements
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      frameCounterRef.current++;
      const frame = frameCounterRef.current;

      // Draw Grid tiles and authentic floors depending on room
      for (let x = 0; x < map.width; x++) {
        for (let y = 0; y < map.height; y++) {
          const tx = x * map.tileSize;
          const ty = y * map.tileSize;
          const sz = map.tileSize;

          if (currentLocation === LocationId.SEKOLAH) {
            // Classroom: Polished wooden floorboards
            ctx.fillStyle = (x + y) % 2 === 0 ? "#1e293b" : "#1b2434";
            ctx.fillRect(tx, ty, sz, sz);
            
            // Planks joints
            ctx.strokeStyle = "#111827";
            ctx.lineWidth = 1;
            ctx.strokeRect(tx, ty, sz, sz);
            
            // Wood grain highlight
            ctx.strokeStyle = "rgba(255, 255, 255, 0.01)";
            ctx.beginPath();
            ctx.moveTo(tx + 4, ty + sz / 2);
            ctx.lineTo(tx + sz - 4, ty + sz / 2);
            ctx.stroke();
          } else if (currentLocation === LocationId.LABORATORIUM) {
            // Computer Lab: Raised anti-static grey tech boards
            ctx.fillStyle = (x + y) % 2 === 0 ? "#0f172a" : "#111c30";
            ctx.fillRect(tx, ty, sz, sz);
            
            // Metal panels
            ctx.strokeStyle = "#312e81";
            ctx.lineWidth = 0.8;
            ctx.strokeRect(tx, ty, sz, sz);
            
            // Rivets on corners
            ctx.fillStyle = "rgba(67, 56, 202, 0.4)";
            ctx.fillRect(tx + 2, ty + 2, 2, 2);
            ctx.fillRect(tx + sz - 4, ty + 2, 2, 2);
            ctx.fillRect(tx + 2, ty + sz - 4, 2, 2);
            ctx.fillRect(tx + sz - 4, ty + sz - 4, 2, 2);
          } else if (currentLocation === LocationId.KANTOR) {
            // Office: Deep royal indigo office carpeting
            ctx.fillStyle = (x + y) % 2 === 0 ? "#111e3b" : "#0d172e";
            ctx.fillRect(tx, ty, sz, sz);
            
            // Soft carpet squares
            ctx.strokeStyle = "rgba(29, 78, 216, 0.15)";
            ctx.lineWidth = 1;
            ctx.strokeRect(tx, ty, sz, sz);
          } else if (currentLocation === LocationId.RUANG_SERVER) {
            // Ruang Server: Dark perforated floor panels + glowing cold air conduits
            ctx.fillStyle = "#020617";
            ctx.fillRect(tx, ty, sz, sz);
            
            ctx.strokeStyle = "#1d4ed8";
            ctx.lineWidth = 0.5;
            ctx.strokeRect(tx, ty, sz, sz);
            
            // Fine ventilation holes
            ctx.fillStyle = "rgba(59, 130, 246, 0.08)";
            for (let dx = 8; dx < sz; dx += 12) {
              for (let dy = 8; dy < sz; dy += 12) {
                ctx.beginPath();
                ctx.arc(tx + dx, ty + dy, 1, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          } else if (currentLocation === LocationId.DATA_CENTER) {
            // Mega Data Center: Cybernetically active hexagon grid + optical trace lines
            ctx.fillStyle = "#02040a";
            ctx.fillRect(tx, ty, sz, sz);
            
            ctx.strokeStyle = "#0f172a";
            ctx.lineWidth = 1;
            ctx.strokeRect(tx, ty, sz, sz);

            // Flowing data circuit traces along the floor grid
            if (x % 3 === 0 && y % 4 === 1) {
              ctx.strokeStyle = "rgba(6, 182, 212, 0.3)";
              ctx.lineWidth = 1.2;
              ctx.beginPath();
              ctx.moveTo(tx, ty + sz / 2);
              ctx.lineTo(tx + sz, ty + sz / 2);
              ctx.stroke();
              
              // Animated packet glow
              const t = (frame % 60) / 60;
              ctx.fillStyle = "#22d3ee";
              ctx.beginPath();
              ctx.arc(tx + sz * t, ty + sz / 2, 2, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }

      // Draw Map elements realistically
      map.elements.forEach((el) => {
        const rx = el.x * map.tileSize;
        const ry = el.y * map.tileSize;
        const rw = el.width * map.tileSize;
        const rh = el.height * map.tileSize;
        const sz = map.tileSize;

        ctx.save();

        if (el.type === "decor") {
          if (el.id.includes("wall")) {
            // Realistic metal panel partitions with depth shadows
            const wallGrad = ctx.createLinearGradient(rx, ry, rx, ry + rh);
            wallGrad.addColorStop(0, "#334155");
            wallGrad.addColorStop(1, "#0f172a");

            ctx.fillStyle = wallGrad;
            ctx.fillRect(rx, ry, rw, rh);

            // Metallic seams
            ctx.strokeStyle = "#1e293b";
            ctx.lineWidth = 2;
            ctx.strokeRect(rx, ry, rw, rh);

            // Tech conduits / pipelines on walls
            ctx.strokeStyle = "#475569";
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(rx, ry + rh - 6);
            ctx.lineTo(rx + rw, ry + rh - 6);
            ctx.stroke();

            // Tiny wall studs
            ctx.fillStyle = "#94a3b8";
            ctx.fillRect(rx + 6, ry + 4, 3, 3);
            ctx.fillRect(rx + rw - 9, ry + 4, 3, 3);
          } else if (el.id.includes("board")) {
            // Classroom blackboard / whiteboard
            ctx.fillStyle = "#064e3b"; // Forest green blackboard
            ctx.fillRect(rx + 4, ry + 4, rw - 8, rh - 8);

            // Wooden border
            ctx.strokeStyle = "#78350f";
            ctx.lineWidth = 3.5;
            ctx.strokeRect(rx + 4, ry + 4, rw - 8, rh - 8);

            // White chalk text annotations
            ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
            ctx.font = "bold 8px monospace";
            ctx.textAlign = "left";
            ctx.textBaseline = "top";
            ctx.fillText("KURIKULUM TKJ JUNIOR", rx + 14, ry + 8);
            ctx.fillText("1. MERAKIT PC GURU", rx + 14, ry + 16);
            ctx.fillText("2. LAN CABLE (T568B)", rx + 14, ry + 24);
          } else if (el.id.includes("desk") || el.id.includes("table")) {
            // Elegant 3D wooden desk with computer accessories
            ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
            ctx.fillRect(rx + 4, ry + 8, rw - 4, rh - 4); // table base shadow

            // Wooden tabletop
            const isTeacher = el.id.includes("teacher");
            ctx.fillStyle = isTeacher ? "#451a03" : "#1e293b";
            ctx.fillRect(rx + 2, ry + 2, rw - 4, rh - 6);

            // Wood / Metal rim
            ctx.strokeStyle = isTeacher ? "#78350f" : "#475569";
            ctx.lineWidth = 2;
            ctx.strokeRect(rx + 2, ry + 2, rw - 4, rh - 6);

            // Keyboards & mice on desk
            ctx.fillStyle = "#0f172a";
            ctx.fillRect(rx + rw / 2 - 12, ry + rh - 12, 24, 3);
            ctx.fillRect(rx + rw / 2 + 15, ry + rh - 11, 2, 2); // mouse

            // 3D Flat panel monitor facing forward
            ctx.fillStyle = "#020617";
            ctx.fillRect(rx + rw / 2 - 16, ry + 4, 32, 4); // stand base
            ctx.fillStyle = "#64748b";
            ctx.fillRect(rx + rw / 2 - 1.5, ry + 6, 3, 3); // column

            // Holographic screens glowing
            const solved = quests.some(q => q.locationId === currentLocation && q.status === "completed");
            ctx.fillStyle = solved ? "rgba(34, 197, 94, 0.65)" : "rgba(30, 41, 59, 0.85)";
            ctx.fillRect(rx + rw / 2 - 14, ry + 2, 28, 2);
          } else if (el.id.includes("rack")) {
            // Deep technical rack closets with blinking ethernet packet lights
            ctx.fillStyle = "#0f172a";
            ctx.fillRect(rx + 2, ry + 2, rw - 4, rh - 4);
            ctx.strokeStyle = "#475569";
            ctx.lineWidth = 2.5;
            ctx.strokeRect(rx + 2, ry + 2, rw - 4, rh - 4);

            // 1U / 2U server blade slots
            const blades = Math.floor(rh / 8);
            for (let b = 0; b < blades; b++) {
              const by = ry + 4 + b * 8;
              if (by + 6 < ry + rh) {
                ctx.fillStyle = "#1e293b";
                ctx.fillRect(rx + 4, by, rw - 8, 5);

                // Aluminum handles
                ctx.fillStyle = "#94a3b8";
                ctx.fillRect(rx + 5, by + 1, 2, 3);
                ctx.fillRect(rx + rw - 7, by + 1, 2, 3);

                // Animated blinking network traffic indicators
                const seed = (b * 93) % 100;
                const linkSpeed = 8 + (seed % 10);
                const isBlinking = (frame + seed) % linkSpeed < 3;

                ctx.beginPath();
                ctx.arc(rx + 12, by + 2.5, 1.2, 0, Math.PI * 2);
                ctx.fillStyle = isBlinking ? "#3b82f6" : "#1d4ed8"; // Link Blue
                ctx.fill();

                const isBlinking2 = (frame + seed + 20) % (linkSpeed + 4) < 3;
                ctx.beginPath();
                ctx.arc(rx + 18, by + 2.5, 1.2, 0, Math.PI * 2);
                ctx.fillStyle = isBlinking2 ? "#22c55e" : "#15803d"; // Activity Green
                ctx.fill();
              }
            }
          } else if (el.id.includes("mainframe")) {
            // Supercomputer cylindrical cluster nodes
            ctx.fillStyle = "#020617";
            ctx.fillRect(rx + 4, ry + 4, rw - 8, rh - 8);
            ctx.strokeStyle = "#0ea5e9";
            ctx.lineWidth = 3;
            ctx.strokeRect(rx + 4, ry + 4, rw - 8, rh - 8);

            // Glowing liquid tubes with flowing bubbles
            ctx.fillStyle = "rgba(14, 165, 233, 0.1)";
            ctx.fillRect(rx + 8, ry + 8, rw - 16, rh - 16);

            // Glowing lines scrolling down
            const pulseLine = (frame * 1.5) % (rh - 16);
            ctx.fillStyle = "rgba(14, 165, 233, 0.4)";
            ctx.fillRect(rx + 8, ry + 8 + pulseLine, rw - 16, 2.5);
          } else if (el.id.includes("sofa")) {
            // Corporate admin waiting sofas
            ctx.fillStyle = "#1e3a8a";
            ctx.fillRect(rx + 2, ry + 2, rw - 4, rh - 4);
            ctx.strokeStyle = "#2563eb";
            ctx.lineWidth = 2.5;
            ctx.strokeRect(rx + 2, ry + 2, rw - 4, rh - 4);

            // Seat divisions
            ctx.fillStyle = "#172554";
            ctx.fillRect(rx + 6, ry + rh - 12, rw - 12, 6);
          } else if (el.id.includes("ac_") || el.id.includes("battery")) {
            // Server room A/C blowers and giant backup battery modules
            ctx.fillStyle = el.id.includes("ac") ? "#0f172a" : "#b45309";
            ctx.fillRect(rx + 2, ry + 2, rw - 4, rh - 4);
            ctx.strokeStyle = el.id.includes("ac") ? "#38bdf8" : "#fbbf24";
            ctx.lineWidth = 2;
            ctx.strokeRect(rx + 2, ry + 2, rw - 4, rh - 4);

            // Air conditioning fan rotation
            const angle = (frame * 0.12) % (Math.PI * 2);
            ctx.save();
            ctx.translate(rx + rw / 2, ry + rh / 2);
            ctx.rotate(angle);
            
            ctx.strokeStyle = el.id.includes("ac") ? "#0284c7" : "#78350f";
            ctx.lineWidth = 2;
            for (let blade = 0; blade < 4; blade++) {
              ctx.rotate(Math.PI / 2);
              ctx.beginPath();
              ctx.moveTo(0, 0);
              ctx.lineTo(0, -rw * 0.3);
              ctx.stroke();
            }
            ctx.restore();
          } else {
            if (el.color) {
              ctx.fillStyle = el.color;
              ctx.fillRect(rx, ry, rw, rh);
              ctx.strokeStyle = "rgba(0,0,0,0.2)";
              ctx.strokeRect(rx, ry, rw, rh);
            }
          }
        } else if (el.type === "door") {
          // Steel hydraulic sliding security door
          const isUnlocked = unlockedLocations.includes(el.targetLocation || LocationId.SEKOLAH);

          ctx.fillStyle = "#3f3f46";
          ctx.fillRect(rx, ry, rw, rh);
          
          ctx.strokeStyle = "#18181b";
          ctx.lineWidth = 3;
          ctx.strokeRect(rx, ry, rw, rh);

          // Diagonal security yellow caution stripes
          ctx.strokeStyle = "#fbbf24";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          for (let pyLines = ry + 6; pyLines < ry + rh - 4; pyLines += 12) {
            ctx.moveTo(rx + 4, pyLines);
            ctx.lineTo(rx + rw - 4, pyLines + 5);
          }
          ctx.stroke();

          // Biometric access card indicator panel
          ctx.beginPath();
          ctx.arc(rx + rw / 2, ry + rh / 2, 4.5, 0, Math.PI * 2);
          ctx.fillStyle = isUnlocked ? "#22c55e" : "#ef4444";
          ctx.fill();
          
          // Outer led ring
          ctx.strokeStyle = isUnlocked ? "#4ade80" : "#fca5a5";
          ctx.lineWidth = 1;
          ctx.stroke();
        } else if (el.type === "device") {
          // Interactive Practical Workbench Devices
          const isCompleted = quests.find(q => q.locationId === currentLocation)?.status === "completed";

          // Tech work desk
          ctx.fillStyle = "#1e293b";
          ctx.fillRect(rx + 2, ry + 2, rw - 4, rh - 4);
          ctx.strokeStyle = "#475569";
          ctx.lineWidth = 2.5;
          ctx.strokeRect(rx + 2, ry + 2, rw - 4, rh - 4);

          // Exposed motherboard fiber-glass green
          ctx.fillStyle = "#064e3b";
          ctx.fillRect(rx + 6, ry + 4, rw - 12, rh - 8);

          // Gold electrical paths (bus lines)
          ctx.strokeStyle = "rgba(245, 158, 11, 0.45)";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(rx + 8, ry + 8);
          ctx.lineTo(rx + rw - 8, ry + rh - 8);
          ctx.stroke();

          // Capacitors
          ctx.fillStyle = "#dc2626";
          ctx.fillRect(rx + 10, ry + 6, 3, 3);
          ctx.fillStyle = "#2563eb";
          ctx.fillRect(rx + rw - 14, ry + rh - 10, 4, 4);

          // Pulsating "practical required" indicator
          ctx.save();
          ctx.shadowBlur = 10;
          ctx.shadowColor = isCompleted ? "#22c55e" : "#fbbf24";
          ctx.fillStyle = isCompleted ? "#22c55e" : "#fbbf24";
          ctx.beginPath();
          ctx.arc(rx + rw / 2, ry + rh / 2, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          if (!isCompleted) {
            const pulseRadius = 5 + Math.sin(frame * 0.1) * 3;
            ctx.strokeStyle = "rgba(245, 158, 11, 0.65)";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(rx + rw / 2, ry + rh / 2, pulseRadius + 4, 0, Math.PI * 2);
            ctx.stroke();
          }
        } else if (el.type === "npc") {
          // Circular Hologram Communicator platform
          const bobbingY = Math.sin(frame * 0.06) * 4;

          // Pedestal Base
          ctx.fillStyle = "#334155";
          ctx.fillRect(rx + 4, ry + rh - 8, rw - 8, 6);
          ctx.strokeStyle = "#475569";
          ctx.lineWidth = 2;
          ctx.strokeRect(rx + 4, ry + rh - 8, rw - 8, 6);

          // Glowing blue laser transmission column
          const beam = ctx.createLinearGradient(0, ry, 0, ry + rh);
          beam.addColorStop(0, "rgba(56, 189, 248, 0.35)");
          beam.addColorStop(0.7, "rgba(56, 189, 248, 0.08)");
          beam.addColorStop(1, "rgba(56, 189, 248, 0.0)");

          ctx.fillStyle = beam;
          ctx.beginPath();
          ctx.moveTo(rx + rw / 2 - 12, ry);
          ctx.lineTo(rx + rw / 2 + 12, ry);
          ctx.lineTo(rx + rw - 6, ry + rh - 8);
          ctx.lineTo(rx + 6, ry + rh - 8);
          ctx.closePath();
          ctx.fill();

          // Cyber floating avatar
          ctx.save();
          ctx.shadowBlur = 12;
          ctx.shadowColor = "#38bdf8";

          // Head node
          ctx.beginPath();
          ctx.arc(rx + rw / 2, ry + rh / 2 - 4 + bobbingY, 6.5, 0, Math.PI * 2);
          ctx.fillStyle = "#0284c7";
          ctx.fill();

          // Base capsule
          ctx.beginPath();
          ctx.ellipse(rx + rw / 2, ry + rh / 2 + 5 + bobbingY, 9, 5, 0, 0, Math.PI, true);
          ctx.fillStyle = "#0369a1";
          ctx.fill();

          ctx.restore();
        }

        // Render standard emojis/symbols above platforms to maintain game consistency
        if (el.symbol) {
          ctx.font = `${map.tileSize * 0.52}px Arial`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";

          const bob = el.type === "npc" ? Math.sin(frame * 0.06) * 4 : 0;
          ctx.fillText(el.symbol, rx + rw / 2, ry + rh / 2 + bob);
        }

        ctx.restore();
      });

      // Draw Player technician with realistic gear, toolbelts, high-vis safety jacket and goggles
      const px = playerPos.x * map.tileSize + map.tileSize / 2;
      const py = playerPos.y * map.tileSize + map.tileSize / 2;
      const radius = map.tileSize * 0.42;
      const breathing = Math.sin(frame * 0.1) * 0.6;

      ctx.save();

      // 1. SHADOW (ambient occlusion beneath the boots)
      ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
      ctx.beginPath();
      ctx.ellipse(px, py + radius - 2, radius * 0.85, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // 2. BOOTS / FEET (Rugged dark work boots)
      ctx.fillStyle = "#1e293b";
      ctx.strokeStyle = "#09090b";
      ctx.lineWidth = 1;
      if (playerDir === "down" || playerDir === "up") {
        // Left shoe
        ctx.fillRect(px - 7, py + radius - 5, 5, 4);
        ctx.strokeRect(px - 7, py + radius - 5, 5, 4);
        // Right shoe
        ctx.fillRect(px + 2, py + radius - 5, 5, 4);
        ctx.strokeRect(px + 2, py + radius - 5, 5, 4);
      } else if (playerDir === "left") {
        ctx.fillRect(px - 9, py + radius - 5, 6, 4);
        ctx.strokeRect(px - 9, py + radius - 5, 6, 4);
        ctx.fillRect(px - 4, py + radius - 4, 6, 4);
        ctx.strokeRect(px - 4, py + radius - 4, 6, 4);
      } else if (playerDir === "right") {
        ctx.fillRect(px + 3, py + radius - 5, 6, 4);
        ctx.strokeRect(px + 3, py + radius - 5, 6, 4);
        ctx.fillRect(px - 2, py + radius - 4, 6, 4);
        ctx.strokeRect(px - 2, py + radius - 4, 6, 4);
      }

      // 3. LEGS & PANTS (Dark grey cargo uniform trousers)
      ctx.fillStyle = "#334155";
      ctx.fillRect(px - 6, py + radius * 0.2 + breathing, 12, radius * 0.6);
      
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px, py + radius * 0.2 + breathing);
      ctx.lineTo(px, py + radius * 0.75 + breathing);
      ctx.stroke();

      // 4. LEATHER TOOLBELT (Brown belt with detailed tools hanging)
      ctx.fillStyle = "#78350f";
      ctx.fillRect(px - 7.5, py + radius * 0.15 + breathing, 15, 3.5);
      
      // Silver buckle
      ctx.fillStyle = "#cbd5e1";
      ctx.fillRect(px - 2, py + radius * 0.15 - 0.5 + breathing, 4, 4.5);

      // Hanging screwdriver
      ctx.fillStyle = "#94a3b8";
      ctx.fillRect(px - 4.5, py + radius * 0.15 + 3.5 + breathing, 1.5, 5);
      ctx.fillStyle = "#dc2626";
      ctx.fillRect(px - 5.5, py + radius * 0.15 + 3.5 + breathing, 3.5, 2);

      // Hanging multimeter / walkie pouch
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(px + 2.5, py + radius * 0.15 + 3.5 + breathing, 3.2, 5.5);
      ctx.fillStyle = "#22c55e";
      ctx.fillRect(px + 3.5, py + radius * 0.15 + 4.5 + breathing, 1, 1);

      // 5. TORSO & SHIRT (Blue tech long-sleeve under yellow-lime reflective safety vest)
      ctx.fillStyle = "#2563eb";
      ctx.fillRect(px - 7, py - radius * 0.4 + breathing, 14, radius * 0.6);

      // High-visibility Safety Vest (Neon Lime Green)
      ctx.fillStyle = "#a3e635";
      ctx.fillRect(px - 6.5, py - radius * 0.35 + breathing, 13, radius * 0.55);

      // Silver reflective stripes
      ctx.fillStyle = "#e2e8f0";
      ctx.fillRect(px - 4.5, py - radius * 0.35 + breathing, 1.8, radius * 0.55);
      ctx.fillRect(px + 2.7, py - radius * 0.35 + breathing, 1.8, radius * 0.55);
      ctx.fillRect(px - 6.5, py - radius * 0.05 + breathing, 13, 2);

      // 6. ARMS (Slightly bobbing in opposite sync with breathing)
      ctx.fillStyle = "#2563eb";
      const armBob = Math.sin(frame * 0.1) * 0.4;
      
      if (playerDir === "down" || playerDir === "up") {
        ctx.fillRect(px - 9.5, py - radius * 0.35 + breathing, 2.5, radius * 0.5 + armBob);
        ctx.fillRect(px + 7, py - radius * 0.35 + breathing, 2.5, radius * 0.5 - armBob);
        
        ctx.fillStyle = "#f1c27d"; // Flesh hand color
        ctx.fillRect(px - 9.5, py - radius * 0.35 + radius * 0.5 + armBob + breathing, 2.5, 2.5);
        ctx.fillRect(px + 7, py - radius * 0.35 + radius * 0.5 - armBob + breathing, 2.5, 2.5);
      } else if (playerDir === "left") {
        ctx.fillRect(px - 2, py - radius * 0.35 + breathing, 3, radius * 0.6);
        ctx.fillStyle = "#f1c27d";
        ctx.fillRect(px - 2, py - radius * 0.35 + radius * 0.6 + breathing, 3, 2.5);
      } else if (playerDir === "right") {
        ctx.fillRect(px - 1, py - radius * 0.35 + breathing, 3, radius * 0.6);
        ctx.fillStyle = "#f1c27d";
        ctx.fillRect(px - 1, py - radius * 0.35 + radius * 0.6 + breathing, 3, 2.5);
      }

      // 7. HUMAN HEAD & FACE
      const hy = py - radius * 0.75 + breathing;
      ctx.fillStyle = "#f1c27d"; // Realistic warm skin tone
      ctx.beginPath();
      ctx.arc(px, hy, 5.5, 0, Math.PI * 2);
      ctx.fill();

      // Ears
      if (playerDir === "down" || playerDir === "up") {
        ctx.beginPath();
        ctx.arc(px - 5.5, hy, 1.5, 0, Math.PI * 2);
        ctx.arc(px + 5.5, hy, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Neat technician hair under helmet
      ctx.fillStyle = "#27272a"; // Deep brown/black
      if (playerDir === "up") {
        ctx.beginPath();
        ctx.arc(px, hy, 5.5, Math.PI, 0, false);
        ctx.fill();
        ctx.fillRect(px - 5.5, hy, 11, 4.5);
      } else if (playerDir === "down") {
        ctx.fillRect(px - 5.5, hy - 4, 1.5, 4); // Left sideburn
        ctx.fillRect(px + 4, hy - 4, 1.5, 4); // Right sideburn
        ctx.beginPath();
        ctx.arc(px, hy - 3, 5, Math.PI, 0, false);
        ctx.fill();
      } else if (playerDir === "left") {
        ctx.beginPath();
        ctx.arc(px + 1, hy, 5.5, Math.PI * 1.5, Math.PI * 0.5);
        ctx.fill();
        ctx.fillRect(px, hy - 2, 5, 5);
      } else if (playerDir === "right") {
        ctx.beginPath();
        ctx.arc(px - 1, hy, 5.5, Math.PI * 0.5, Math.PI * 1.5);
        ctx.fill();
        ctx.fillRect(px - 5, hy - 2, 5, 5);
      }

      // Friendly smile & glowing smart HUD goggles
      if (playerDir === "down") {
        ctx.strokeStyle = "#7c2d12";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(px, hy + 1.5, 2, 0, Math.PI, false);
        ctx.stroke();

        ctx.fillStyle = "#22d3ee"; // Neon cyan goggles
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#06b6d4";
        ctx.fillRect(px - 4, hy - 1.5, 3, 2.5);
        ctx.fillRect(px + 1, hy - 1.5, 3, 2.5);
        
        ctx.strokeStyle = "#0891b2";
        ctx.lineWidth = 0.5;
        ctx.strokeRect(px - 4, hy - 1.5, 3, 2.5);
        ctx.strokeRect(px + 1, hy - 1.5, 3, 2.5);
        
        ctx.beginPath();
        ctx.moveTo(px - 1, hy - 0.5);
        ctx.lineTo(px + 1, hy - 0.5);
        ctx.stroke();
      } else if (playerDir === "left") {
        ctx.fillStyle = "#22d3ee";
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#06b6d4";
        ctx.fillRect(px - 4.5, hy - 1.5, 3.2, 2.5);
      } else if (playerDir === "right") {
        ctx.fillStyle = "#22d3ee";
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#06b6d4";
        ctx.fillRect(px + 1.3, hy - 1.5, 3.2, 2.5);
      }

      ctx.shadowBlur = 0; // Reset glows

      // 8. ENGINEER SAFETY HELMET (Hard hat with visor brim and forehead headlamp)
      ctx.fillStyle = "#fbbf24"; // Bright safety yellow
      ctx.beginPath();
      ctx.arc(px, hy - 4, 5.5, Math.PI, 0, false);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#eab308";
      if (playerDir === "down" || playerDir === "up") {
        ctx.fillRect(px - 7, hy - 4.8, 14, 1.8);
      } else if (playerDir === "left") {
        ctx.fillRect(px - 8.5, hy - 4.8, 14, 1.8);
      } else if (playerDir === "right") {
        ctx.fillRect(px - 5.5, hy - 4.8, 14, 1.8);
      }

      // Top safety ridge
      ctx.fillStyle = "#fef08a";
      ctx.fillRect(px - 1.2, hy - 9.5, 2.4, 5);

      if (playerDir === "down") {
        ctx.fillStyle = "#cbd5e1";
        ctx.fillRect(px - 2, hy - 7.5, 4, 3);
        ctx.fillStyle = "#22c55e"; // Glowing headlight LED
        ctx.fillRect(px - 1, hy - 6.5, 2, 1.5);
      }

      ctx.restore();

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [playerPos, playerDir, currentLocation, map, quests, unlockedLocations]);

  const adjElement = getAdjacentElement();

  return (
    <div className="flex flex-col items-center gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
      {/* Visual map indicators */}
      <div className="w-full flex justify-between items-center px-2">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-emerald-400 animate-spin-slow" />
          <span className="text-sm font-bold text-white tracking-wide">{map.name}</span>
        </div>
        <span className="text-xs text-slate-400 font-mono">Gunakan Keyboard W,A,S,D / ARROW</span>
      </div>

      {/* Main Canvas view */}
      <div className="relative border-4 border-slate-950 rounded-lg shadow-2xl overflow-hidden bg-slate-950">
        <canvas
          ref={canvasRef}
          width={map.width * map.tileSize}
          height={map.height * map.tileSize}
          className="block max-w-full"
        />

        {/* Action Balloon popup */}
        {adjElement && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-indigo-600/95 text-white text-xs px-4 py-2 rounded-full font-bold shadow-lg flex items-center gap-2 animate-bounce border border-indigo-400">
            <Hand className="w-3.5 h-3.5" />
            <span>Ada [{adjElement.name}]. Klik SPACE atau tombol di bawah!</span>
          </div>
        )}
      </div>

      {/* Onscreen Controls for Touch & Mouse accessibility */}
      <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-4 items-center border-t border-slate-800/60 pt-4">
        
        {/* Mobile virtual joystick arrow keys */}
        <div className="md:col-span-5 flex justify-center">
          <div className="grid grid-cols-3 gap-1.5 w-36 h-36">
            <div />
            <button
              onClick={() => movePlayer(0, -1, "up")}
              className="bg-slate-850 hover:bg-slate-750 border border-slate-700 active:bg-indigo-950 text-white p-2 rounded-xl flex items-center justify-center transition shadow active:scale-95 cursor-pointer"
            >
              <ArrowUp className="w-6 h-6" />
            </button>
            <div />

            <button
              onClick={() => movePlayer(-1, 0, "left")}
              className="bg-slate-850 hover:bg-slate-750 border border-slate-700 active:bg-indigo-950 text-white p-2 rounded-xl flex items-center justify-center transition shadow active:scale-95 cursor-pointer"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <button
              onClick={triggerInteract}
              className={`border p-2 rounded-xl flex flex-col items-center justify-center transition shadow text-[10px] font-bold uppercase active:scale-95 cursor-pointer ${
                adjElement
                  ? "bg-indigo-600 border-indigo-400 text-white animate-pulse"
                  : "bg-slate-950 border-slate-850 text-slate-500 cursor-not-allowed"
              }`}
            >
              Aksi
            </button>
            <button
              onClick={() => movePlayer(1, 0, "right")}
              className="bg-slate-850 hover:bg-slate-750 border border-slate-700 active:bg-indigo-950 text-white p-2 rounded-xl flex items-center justify-center transition shadow active:scale-95 cursor-pointer"
            >
              <ArrowRight className="w-6 h-6" />
            </button>

            <div />
            <button
              onClick={() => movePlayer(0, 1, "down")}
              className="bg-slate-850 hover:bg-slate-750 border border-slate-700 active:bg-indigo-950 text-white p-2 rounded-xl flex items-center justify-center transition shadow active:scale-95 cursor-pointer"
            >
              <ArrowDown className="w-6 h-6" />
            </button>
            <div />
          </div>
        </div>

        {/* Dynamic Action Trigger Panel */}
        <div className="md:col-span-7 flex flex-col gap-2 bg-slate-950/40 p-3 rounded-lg border border-slate-800/80">
          <span className="text-[10px] text-slate-500 font-mono uppercase block font-bold">Instruksi navigasi:</span>
          <p className="text-xs text-slate-300 leading-relaxed">
            Berjalan mendekati NPC untuk mendapatkan misi TKJ. Dekati komputer yang rusak dan klik tombol <span className="font-bold text-indigo-400">AKSI</span> untuk mulai praktik perbaikan sistem!
          </p>
          
          <div className="flex gap-2 mt-2">
            {adjElement && (
              <button
                onClick={triggerInteract}
                className="w-full py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-xs font-bold rounded-lg border border-indigo-400 hover:scale-101 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {adjElement.type === "npc" ? "💬 Bicara dengan NPC" : "🛠️ Perbaiki Perangkat"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
