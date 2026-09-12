import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.resolve(__dirname, "../db.json");

const DEFAULT_USERS = [
  {
    id: "s1",
    name: "Admin Staff",
    email: "staff@clinic.com",
    password: "password123",
    role: "staff",
  },
];

const DEFAULT_DOCTORS = [
  {
    id: "d1",
    name: "Dr. Ayesha",
    specialty: "General Practice",
    avatarUrl: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    id: "d2",
    name: "Dr. Bilal",
    specialty: "Cardiology",
    avatarUrl: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    id: "d3",
    name: "Dr. Sana",
    specialty: "Neurology",
    avatarUrl: "https://randomuser.me/api/portraits/women/68.jpg",
  },
  {
    id: "d4",
    name: "Dr. Usman",
    specialty: "Orthopedics",
    avatarUrl: "https://randomuser.me/api/portraits/men/75.jpg",
  },
  {
    id: "d5",
    name: "Dr. Fatima",
    specialty: "Pediatrics",
    avatarUrl: "https://randomuser.me/api/portraits/women/90.jpg",
  },
];

const DEFAULT_SLOTS = [
  "09:00",
  "09:30",
  "10:00",
  "11:30",
  "13:00",
  "14:30",
  "16:00",
];

function runSeed() {
  const isForce = process.argv.includes("--force") || process.argv.includes("--reset");

  if (!isForce && fs.existsSync(DB_PATH)) {
    console.log("[seed] Existing db.json found. Ready to serve.");
    return;
  }

  const schedules = DEFAULT_DOCTORS.map((doc) => ({
    id: doc.id,
    doctorId: doc.id,
    slots: [...DEFAULT_SLOTS],
  }));

  const initialData = {
    users: DEFAULT_USERS,
    doctors: DEFAULT_DOCTORS,
    appointments: [],
    schedules,
  };

  fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2) + "\n", "utf8");

  console.log(`[seed] ${isForce ? "Database reset" : "Database initialized"} successfully.`);
  console.log(`  - Users: ${initialData.users.length} (Staff only)`);
  console.log(`  - Doctors: ${initialData.doctors.length}`);
  console.log(`  - Schedules: ${initialData.schedules.length}`);
  console.log(`  - Appointments: ${initialData.appointments.length}`);
}

runSeed();
