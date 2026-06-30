/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum LocationId {
  SEKOLAH = "sekolah",
  LABORATORIUM = "laboratorium",
  KANTOR = "kantor",
  RUANG_SERVER = "ruang_server",
  DATA_CENTER = "data_center",
}

export enum SimulationType {
  ASSEMBLY = "assembly",
  CABLE = "cable",
  TOPOLOGY = "topology",
  ROUTER = "router",
  IP_CONFIG = "ip_config",
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  objective: string;
  locationId: LocationId;
  requiredSim: SimulationType;
  status: "locked" | "active" | "completed";
  rewardItem?: string;
  hint: string;
}

export interface NPC {
  id: string;
  name: string;
  role: string;
  avatar: string;
  dialogues: {
    start: string[];
    during: string[];
    success: string[];
  };
}

export interface GameState {
  currentLocation: LocationId;
  unlockedLocations: LocationId[];
  activeQuestId: string | null;
  quests: Quest[];
  inventory: string[];
  score: number;
  completedSimulations: SimulationType[];
}

export interface Position2D {
  x: number;
  y: number;
}

export interface MapElement {
  id: string;
  name: string;
  type: "npc" | "device" | "decor" | "door";
  x: number;
  y: number;
  width: number;
  height: number;
  npcId?: string;
  simType?: SimulationType;
  targetLocation?: LocationId;
  color?: string;
  symbol?: string;
}

export interface MapConfig {
  id: LocationId;
  name: string;
  description: string;
  width: number; // grid width (e.g. 16 cols)
  height: number; // grid height (e.g. 12 rows)
  tileSize: number;
  backgroundColor: string;
  elements: MapElement[];
  spawnPoint: Position2D;
}
