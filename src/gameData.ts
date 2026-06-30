/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LocationId, SimulationType, Quest, NPC, MapConfig } from "./types";

export const INITIAL_QUESTS: Quest[] = [
  {
    id: "q_assembly",
    title: "Merakit PC Kelas",
    description: "Komputer guru di kelas TKJ mati total. Bantu Pak Nana Permana merakit kembali PC yang dibongkar agar pelajaran bisa dimulai kembali.",
    objective: "Bicara dengan Pak Nana Permana, lalu perbaiki Komputer Guru di sudut kanan atas.",
    locationId: LocationId.SEKOLAH,
    requiredSim: SimulationType.ASSEMBLY,
    status: "active",
    rewardItem: "LAN Tester",
    hint: "Dekati komputer yang terbuka di sudut kanan atas, lalu klik tombol 'Perbaiki' atau tekan SPACE."
  },
  {
    id: "q_cable",
    title: "Penyambungan Kabel UTP Lab",
    description: "Siswa di Laboratorium tidak bisa mengakses internet. Kak Ajang Wira Sutisna mencurigai ada kabel UTP yang rusak. Susun kabel UTP baru dengan standar T568B.",
    objective: "Bicara dengan Kak Ajang Wira Sutisna, lalu perbaiki Kabel LAN yang rusak di meja belakang.",
    locationId: LocationId.LABORATORIUM,
    requiredSim: SimulationType.CABLE,
    status: "locked",
    rewardItem: "Obeng Presisi",
    hint: "Urutan warna standar T568B: Putih Oranye, Oranye, Putih Hijau, Biru, Putih Biru, Hijau, Putih Cokelat, Cokelat."
  },
  {
    id: "q_topology",
    title: "Topologi Jaringan Kantor",
    description: "Kantor administrasi sekolah sedang renovasi. Bu Meli Rofiah meminta bantuan merancang jaringan topologi agar semua komputer tersambung ke Switch dan Router.",
    objective: "Bicara dengan Bu Meli Rofiah, lalu konfigurasikan skema topologi di meja desainer.",
    locationId: LocationId.KANTOR,
    requiredSim: SimulationType.TOPOLOGY,
    status: "locked",
    rewardItem: "Kabel Console",
    hint: "Hubungkan setiap PC ke Switch, lalu Switch ke Router menggunakan jenis kabel yang sesuai (Straight-Through)."
  },
  {
    id: "q_router",
    title: "Konfigurasi Router Server",
    description: "Router utama di Ruang Server kehilangan konfigurasinya setelah pemadaman listrik. Pak Ejang Hermawan butuh bantuanmu melakukan konfigurasi CLI.",
    objective: "Bicara dengan Pak Ejang Hermawan, lalu sambungkan kabel console ke Router Utama.",
    locationId: LocationId.RUANG_SERVER,
    requiredSim: SimulationType.ROUTER,
    status: "locked",
    rewardItem: "Access Card Premium",
    hint: "Gunakan perintah: 'enable', 'configure terminal', lalu konfigurasikan interface 'eth0' dengan IP 192.168.1.1."
  },
  {
    id: "q_ip_config",
    title: "Troubleshoot Data Center",
    description: "Terjadi pemadaman koneksi massal ke Server Cadangan di Data Center. Bantu Bu Siti Nurlaela mendiagnosis dan mengkonfigurasi IP Address server cadangan agar bisa di-ping.",
    objective: "Bicara dengan Bu Siti Nurlaela, lalu buka konsol terminal diagnostic.",
    locationId: LocationId.DATA_CENTER,
    requiredSim: SimulationType.IP_CONFIG,
    status: "locked",
    rewardItem: "Sertifikat Legend TKJ",
    hint: "Isi IP Address Server: 10.0.0.100, Netmask: 255.255.255.0, Gateway: 10.0.0.1. Jalankan 'ping 10.0.0.1' di Terminal."
  }
];

export const NPCS: Record<string, NPC> = {
  budi: {
    id: "budi",
    name: "Pak Nana Permana",
    role: "Guru Produktif TKJ",
    avatar: "👨‍🏫",
    dialogues: {
      start: [
        "Halo muridku! Selamat datang di petualangan jaringan.",
        "Komputer guru di depan kelas sedang dibongkar untuk praktik, tapi beberapa komponen belum terpasang dengan benar.",
        "Bisa tolong rakit kembali komputer itu? Pasang Motherboard, CPU, RAM, GPU, Harddisk, dan Power Supply di tempatnya agar menyala.",
        "Komputer yang rusak ada di meja sebelah kanan atas. Berdirilah di depannya dan klik 'Perbaiki'!"
      ],
      during: [
        "Ingat, pasang CPU dan RAM terlebih dahulu ke Motherboard sebelum memasang kartu grafis!",
        "Jika komputer sudah siap, coba nyalakan!"
      ],
      success: [
        "Wah luar biasa! Komputernya langsung menyala sempurna.",
        "Sebagai hadiah, bapak berikan 'LAN Tester' ini. Kamu pasti membutuhkannya di Laboratorium sebelah.",
        "Pintu ke Laboratorium sekarang sudah terbuka. Lanjutkan perjalananmu, nak!"
      ]
    }
  },
  deni: {
    id: "deni",
    name: "Kak Ajang Wira Sutisna",
    role: "Asisten Lab Komputer",
    avatar: "🧑‍💻",
    dialogues: {
      start: [
        "Aduh pusing sekali... Anak-anak tidak bisa ujian gara-gara internet putus.",
        "Ada satu kabel LAN utama dari Switch ke komputer client yang digigit tikus dan terkelupas.",
        "Tolong buatkan kabel UTP baru dengan standar T568B (Straight) menggunakan konektor RJ45.",
        "Gunakan alat crimping di meja belakang untuk menyusun kabel dan mengetesnya dengan LAN Tester!"
      ],
      during: [
        "Urutan warna T568B itu sangat penting. Jangan sampai ada warna yang tertukar, atau sinyalnya tidak akan sampai!",
        "Urutannya: Putih Oranye, Oranye, Putih Hijau, Biru, Putih Biru, Hijau, Putih Cokelat, Cokelat."
      ],
      success: [
        "Lampu LAN Tester menyala hijau semua dari pin 1 sampai 8! Sempurna!",
        "Internet di Lab sekarang sudah lancar kembali. Terima kasih banyak ya!",
        "Ini ambil 'Obeng Presisi' ini, bapak guru di Kantor Administrasi mungkin sedang membutuhkan bantuanmu.",
        "Pintu ke Kantor di sebelah kanan sekarang terbuka."
      ]
    }
  },
  sari: {
    id: "sari",
    name: "Bu Meli Rofiah",
    role: "Kepala Administrasi Kantor",
    avatar: "👩‍💼",
    dialogues: {
      start: [
        "Selamat datang! Kantor kami sedang kacau karena habis renovasi meja tata usaha.",
        "Kabel-kabel komputer tercabut dan kami bingung bagaimana menyusun topologi jaringan yang benar.",
        "Tolong rancang skema jaringan di meja arsitek itu agar semua Komputer Client terhubung ke Switch, dan Switch terhubung ke Router Utama.",
        "Gunakan kabel tipe Straight-Through untuk perangkat yang berbeda (PC ke Switch, Switch ke Router)."
      ],
      during: [
        "Gunakan kabel Straight untuk menghubungkan PC ke Switch, dan Switch ke Router.",
        "Pastikan semua kabel terhubung dengan lampu indikator menyala hijau!"
      ],
      success: [
        "Hebat! Sekarang semua komputer staf tata usaha bisa saling berkirim file dan mengakses internet.",
        "Ini bapak berikan 'Kabel Console' premium. Kabel ini sangat berguna jika kamu ingin masuk ke Ruang Server di lantai atas.",
        "Akses ke Ruang Server sekarang sudah dibuka. Hati-hati di sana!"
      ]
    }
  },
  juna: {
    id: "juna",
    name: "Pak Ejang Hermawan",
    role: "Administrator Jaringan Sekolah",
    avatar: "👨‍🔧",
    dialogues: {
      start: [
        "Waduh! Listrik padam semalam membuat memori NVRAM di Router Utama terhapus.",
        "Seluruh jaringan sekolah lumpuh karena router tidak tahu jalur routing ke DNS server.",
        "Saya butuh seseorang yang paham CLI Router Cisco untuk menyalakan interface and memberi IP Address.",
        "Sambungkan Kabel Console-mu ke Router Utama di rak tengah, lalu konfigurasikan via terminal!"
      ],
      during: [
        "Gunakan perintah 'enable' lalu 'configure terminal'.",
        "Masuk ke interface 'eth0' lalu ketik 'ip address 192.168.1.1 255.255.255.0' dan 'no shutdown'!"
      ],
      success: [
        "Luar biasa! Seluruh lampu indikator router kembali berkedip hijau stabil.",
        "Kamu memiliki bakat luar biasa di bidang jaringan. Ini ada 'Access Card Premium' untuk masuk ke Data Center pusat.",
        "Sampaikan salamku kepada Bu Siti Nurlaela di Data Center. Pintu gerbang utama sekarang terbuka!"
      ]
    }
  },
  diana: {
    id: "diana",
    name: "Bu Siti Nurlaela",
    role: "Chief Technology Officer Data Center",
    avatar: "👩‍🔬",
    dialogues: {
      start: [
        "Selamat datang di Jantung Data Center! Kami sedang mengalami serangan anomali jaringan.",
        "Server Diagnostik kami terputus dari Gateway Utama (10.0.0.1) karena konfigurasi IP internalnya terhapus.",
        "Bantu saya mengisi IP Address, Subnet Mask, dan Gateway yang benar pada Server Diagnostik tersebut.",
        "Setelah itu, buka Terminal CMD-nya dan lakukan test 'ping' ke Gateway untuk memulihkan routing!"
      ],
      during: [
        "Konfigurasi IP Server: IP 10.0.0.100, Netmask 255.255.255.0, Gateway 10.0.0.1.",
        "Setelah disimpan, masuk ke Terminal dan ketik 'ping 10.0.0.1'!"
      ],
      success: [
        "Ya Tuhan! PING sukses 100%! Data Center berhasil diselamatkan dari downtime raksasa!",
        "Kamu telah membuktikan bahwa siswa TKJ mampu mengelola infrastruktur kelas dunia.",
        "Dengan ini, saya anugerahkan 'Sertifikat Legend Jaringan TKJ' kepadamu. Selamat, kamu adalah pahlawan jaringan!"
      ]
    }
  }
};

export const MAPS: Record<LocationId, MapConfig> = {
  [LocationId.SEKOLAH]: {
    id: LocationId.SEKOLAH,
    name: "Sekolah (Ruang Kelas)",
    description: "Ruang kelas TKJ tempat kamu belajar dasar-dasar perangkat keras komputer.",
    width: 16,
    height: 12,
    tileSize: 40,
    backgroundColor: "#1e293b", // Slate-800
    spawnPoint: { x: 2, y: 6 },
    elements: [
      // Wall / borders handled implicitly or via blocks
      { id: "wall_top", name: "Wall Top", type: "decor", x: 0, y: 0, width: 16, height: 1, color: "#0f172a" },
      { id: "wall_left", name: "Wall Left", type: "decor", x: 0, y: 1, width: 1, height: 11, color: "#0f172a" },
      { id: "wall_right", name: "Wall Right", type: "decor", x: 15, y: 1, width: 1, height: 11, color: "#0f172a" },
      { id: "wall_bottom", name: "Wall Bottom", type: "decor", x: 0, y: 11, width: 16, height: 1, color: "#0f172a" },
      
      // Teacher Desk & Board
      { id: "board", name: "Papan Tulis TKJ", type: "decor", x: 6, y: 1, width: 4, height: 1, color: "#065f46", symbol: "📋" },
      { id: "teacher_desk", name: "Meja Guru", type: "decor", x: 11, y: 2, width: 2, height: 1, color: "#78350f", symbol: "🟫" },
      
      // NPC Budi
      { id: "npc_budi", name: "Pak Nana Permana", type: "npc", x: 11, y: 3, width: 1, height: 1, npcId: "budi", symbol: "👨‍🏫" },
      
      // Broken Computer
      { id: "dev_pc", name: "PC Guru Rusak", type: "device", x: 13, y: 2, width: 1, height: 1, simType: SimulationType.ASSEMBLY, symbol: "🖥️" },
      
      // Classroom desks for students
      { id: "desk_1", name: "Meja Siswa A", type: "decor", x: 3, y: 5, width: 2, height: 1, color: "#475569", symbol: "🪑" },
      { id: "desk_2", name: "Meja Siswa B", type: "decor", x: 7, y: 5, width: 2, height: 1, color: "#475569", symbol: "🪑" },
      { id: "desk_3", name: "Meja Siswa C", type: "decor", x: 3, y: 8, width: 2, height: 1, color: "#475569", symbol: "🪑" },
      { id: "desk_4", name: "Meja Siswa D", type: "decor", x: 7, y: 8, width: 2, height: 1, color: "#475569", symbol: "🪑" },

      // Door to Lab
      { id: "door_lab", name: "Pintu ke Lab", type: "door", x: 14, y: 6, width: 1, height: 2, targetLocation: LocationId.LABORATORIUM, symbol: "🚪" }
    ]
  },
  [LocationId.LABORATORIUM]: {
    id: LocationId.LABORATORIUM,
    name: "Laboratorium Komputer",
    description: "Lab tempat praktik instalasi kabel jaringan dan konfigurasi LAN lokal.",
    width: 16,
    height: 12,
    tileSize: 40,
    backgroundColor: "#0f172a", // Slate-900
    spawnPoint: { x: 1, y: 6 },
    elements: [
      { id: "wall_top", name: "Wall Top", type: "decor", x: 0, y: 0, width: 16, height: 1, color: "#1e1b4b" },
      { id: "wall_left", name: "Wall Left", type: "decor", x: 0, y: 1, width: 1, height: 11, color: "#1e1b4b" },
      { id: "wall_right", name: "Wall Right", type: "decor", x: 15, y: 1, width: 1, height: 11, color: "#1e1b4b" },
      { id: "wall_bottom", name: "Wall Bottom", type: "decor", x: 0, y: 11, width: 16, height: 1, color: "#1e1b4b" },
      
      // Computer rows in Lab
      { id: "lab_row1_1", name: "PC Lab 1", type: "decor", x: 3, y: 3, width: 1, height: 1, color: "#4f46e5", symbol: "💻" },
      { id: "lab_row1_2", name: "PC Lab 2", type: "decor", x: 4, y: 3, width: 1, height: 1, color: "#4f46e5", symbol: "💻" },
      { id: "lab_row1_3", name: "PC Lab 3", type: "decor", x: 5, y: 3, width: 1, height: 1, color: "#4f46e5", symbol: "💻" },
      
      { id: "lab_row2_1", name: "PC Lab 4", type: "decor", x: 3, y: 7, width: 1, height: 1, color: "#4f46e5", symbol: "💻" },
      { id: "lab_row2_2", name: "PC Lab 5", type: "decor", x: 4, y: 7, width: 1, height: 1, color: "#4f46e5", symbol: "💻" },
      { id: "lab_row2_3", name: "PC Lab 6", type: "decor", x: 5, y: 7, width: 1, height: 1, color: "#4f46e5", symbol: "💻" },

      // Switch rack on wall
      { id: "rack", name: "Rak Switch Jaringan", type: "decor", x: 8, y: 1, width: 2, height: 1, color: "#1e293b", symbol: "🎛️" },
      
      // NPC Deni
      { id: "npc_deni", name: "Kak Ajang Wira Sutisna", type: "npc", x: 8, y: 4, width: 1, height: 1, npcId: "deni", symbol: "🧑‍💻" },
      
      // Broken Cable desk
      { id: "dev_cable", name: "Meja Crimping LAN", type: "device", x: 12, y: 8, width: 2, height: 1, simType: SimulationType.CABLE, symbol: "🔌" },

      // Back door & Front doors
      { id: "door_school", name: "Pintu ke Kelas", type: "door", x: 1, y: 5, width: 1, height: 2, targetLocation: LocationId.SEKOLAH, symbol: "🚪" },
      { id: "door_office", name: "Pintu ke Kantor", type: "door", x: 14, y: 3, width: 1, height: 2, targetLocation: LocationId.KANTOR, symbol: "🚪" }
    ]
  },
  [LocationId.KANTOR]: {
    id: LocationId.KANTOR,
    name: "Kantor Administrasi",
    description: "Kantor pusat administrasi sekolah tempat kamu belajar tentang arsitektur topologi.",
    width: 16,
    height: 12,
    tileSize: 40,
    backgroundColor: "#172554", // Deep blue
    spawnPoint: { x: 1, y: 4 },
    elements: [
      { id: "wall_top", name: "Wall Top", type: "decor", x: 0, y: 0, width: 16, height: 1, color: "#030712" },
      { id: "wall_left", name: "Wall Left", type: "decor", x: 0, y: 1, width: 1, height: 11, color: "#030712" },
      { id: "wall_right", name: "Wall Right", type: "decor", x: 15, y: 1, width: 1, height: 11, color: "#030712" },
      { id: "wall_bottom", name: "Wall Bottom", type: "decor", x: 0, y: 11, width: 16, height: 1, color: "#030712" },
      
      // Desks for Admin staff
      { id: "admin_desk1", name: "Meja Staf 1", type: "decor", x: 4, y: 3, width: 2, height: 1, color: "#92400e", symbol: "🟫" },
      { id: "admin_desk2", name: "Meja Staf 2", type: "decor", x: 4, y: 6, width: 2, height: 1, color: "#92400e", symbol: "🟫" },
      
      // Sofa / Waiting area
      { id: "sofa", name: "Sofa Tamu", type: "decor", x: 11, y: 8, width: 3, height: 1, color: "#1e3a8a", symbol: "🛋️" },

      // NPC Bu Sari
      { id: "npc_sari", name: "Bu Meli Rofiah", type: "npc", x: 8, y: 5, width: 1, height: 1, npcId: "sari", symbol: "👩‍💼" },

      // Topology workspace desk
      { id: "dev_topology", name: "Meja Arsitek Jaringan", type: "device", x: 11, y: 2, width: 2, height: 1, simType: SimulationType.TOPOLOGY, symbol: "📐" },

      // Doors
      { id: "door_lab", name: "Pintu ke Lab", type: "door", x: 1, y: 3, width: 1, height: 2, targetLocation: LocationId.LABORATORIUM, symbol: "🚪" },
      { id: "door_server", name: "Pintu ke Ruang Server", type: "door", x: 14, y: 6, width: 1, height: 2, targetLocation: LocationId.RUANG_SERVER, symbol: "🚪" }
    ]
  },
  [LocationId.RUANG_SERVER]: {
    id: LocationId.RUANG_SERVER,
    name: "Ruang Server Utama",
    description: "Ruang pendingin bising dengan rak-rak server blade dan Router inti Cisco.",
    width: 16,
    height: 12,
    tileSize: 40,
    backgroundColor: "#050b14", // Very dark space
    spawnPoint: { x: 1, y: 7 },
    elements: [
      { id: "wall_top", name: "Wall Top", type: "decor", x: 0, y: 0, width: 16, height: 1, color: "#111827" },
      { id: "wall_left", name: "Wall Left", type: "decor", x: 0, y: 1, width: 1, height: 11, color: "#111827" },
      { id: "wall_right", name: "Wall Right", type: "decor", x: 15, y: 1, width: 1, height: 11, color: "#111827" },
      { id: "wall_bottom", name: "Wall Bottom", type: "decor", x: 0, y: 11, width: 16, height: 1, color: "#111827" },

      // Rack servers lining the room
      { id: "rack_1", name: "Rak Server 1", type: "decor", x: 3, y: 2, width: 1, height: 3, color: "#111827", symbol: "🗄️" },
      { id: "rack_2", name: "Rak Server 2", type: "decor", x: 5, y: 2, width: 1, height: 3, color: "#111827", symbol: "🗄️" },
      { id: "rack_3", name: "Rak Server 3", type: "decor", x: 7, y: 2, width: 1, height: 3, color: "#111827", symbol: "🗄️" },
      
      { id: "rack_4", name: "Rak Backup", type: "decor", x: 3, y: 7, width: 1, height: 3, color: "#111827", symbol: "🗄️" },

      // NPC Pak Juna
      { id: "npc_juna", name: "Pak Ejang Hermawan", type: "npc", x: 10, y: 5, width: 1, height: 1, npcId: "juna", symbol: "👨‍🔧" },

      // Broken Router requiring CLI
      { id: "dev_router", name: "Router Core Utama", type: "device", x: 12, y: 3, width: 1, height: 1, simType: SimulationType.ROUTER, symbol: "🎛️" },

      // Air Conditioner units (cooling)
      { id: "ac_1", name: "Server AC Unit", type: "decor", x: 13, y: 1, width: 1, height: 1, color: "#38bdf8", symbol: "❄️" },

      // Doors
      { id: "door_office", name: "Pintu ke Kantor", type: "door", x: 1, y: 6, width: 1, height: 2, targetLocation: LocationId.KANTOR, symbol: "🚪" },
      { id: "door_datacenter", name: "Gerbang Data Center", type: "door", x: 14, y: 8, width: 1, height: 2, targetLocation: LocationId.DATA_CENTER, symbol: "🚪" }
    ]
  },
  [LocationId.DATA_CENTER]: {
    id: LocationId.DATA_CENTER,
    name: "Mega Data Center",
    description: "Fasilitas berskala enterprise dengan interkoneksi global serat optik.",
    width: 16,
    height: 12,
    tileSize: 40,
    backgroundColor: "#020617", // Slate 950
    spawnPoint: { x: 1, y: 9 },
    elements: [
      { id: "wall_top", name: "Wall Top", type: "decor", x: 0, y: 0, width: 16, height: 1, color: "#020617" },
      { id: "wall_left", name: "Wall Left", type: "decor", x: 0, y: 1, width: 1, height: 11, color: "#020617" },
      { id: "wall_right", name: "Wall Right", type: "decor", x: 15, y: 1, width: 1, height: 11, color: "#020617" },
      { id: "wall_bottom", name: "Wall Bottom", type: "decor", x: 0, y: 11, width: 16, height: 1, color: "#020617" },

      // High-tech circular mainframe layout or clusters
      { id: "mainframe_1", name: "Mainframe Cluster A", type: "decor", x: 3, y: 3, width: 2, height: 2, color: "#0284c7", symbol: "💠" },
      { id: "mainframe_2", name: "Mainframe Cluster B", type: "decor", x: 7, y: 3, width: 2, height: 2, color: "#0284c7", symbol: "💠" },
      { id: "mainframe_3", name: "Fibre Distributor", type: "decor", x: 11, y: 3, width: 2, height: 2, color: "#22c55e", symbol: "🕸️" },

      // NPC Bu Diana
      { id: "npc_diana", name: "Bu Siti Nurlaela", type: "npc", x: 5, y: 7, width: 1, height: 1, npcId: "diana", symbol: "👩‍🔬" },

      // Diagnostic terminal console (IP config / ping terminal)
      { id: "dev_diagnostic", name: "Terminal Diagnostik", type: "device", x: 8, y: 8, width: 2, height: 1, simType: SimulationType.IP_CONFIG, symbol: "📟" },

      // Backup systems
      { id: "battery", name: "UPS Backup Power Bank", type: "decor", x: 12, y: 8, width: 2, height: 2, color: "#eab308", symbol: "🔋" },

      // Exit Door to server room
      { id: "door_server", name: "Gerbang ke Server", type: "door", x: 1, y: 8, width: 1, height: 2, targetLocation: LocationId.RUANG_SERVER, symbol: "🚪" }
    ]
  }
};
