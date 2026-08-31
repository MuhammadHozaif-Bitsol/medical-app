import { format, parseISO } from "date-fns";
import type { User, Doctor, Appointment, AuthResponse } from "../types";

const DOCTORS_KEY = "booking_doctors";
const APPOINTMENTS_KEY = "booking_appointments";
const USERS_KEY = "booking_users";
const SCHEDULES_KEY = "booking_schedules";

const MOCK_DOCTORS: Doctor[] = [
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

const MOCK_STAFF = {
  id: "s1",
  name: "Admin Staff",
  email: "staff@clinic.com",
  password: "password123",
  role: "staff",
};

const delay = (ms: number = 200) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export class MockApiService {
  constructor() {
    this.initializeData();
  }

  private initializeData() {
    if (!localStorage.getItem(DOCTORS_KEY)) {
      localStorage.setItem(DOCTORS_KEY, JSON.stringify(MOCK_DOCTORS));
    }
    if (!localStorage.getItem(APPOINTMENTS_KEY)) {
      localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(USERS_KEY)) {
      localStorage.setItem(USERS_KEY, JSON.stringify([MOCK_STAFF]));
    }
    if (!localStorage.getItem(SCHEDULES_KEY)) {
      localStorage.setItem(SCHEDULES_KEY, JSON.stringify({}));
    }
  }

  // --- Auth ---
  async login(email: string, password: string): Promise<AuthResponse> {
    await delay();
    const users: any[] = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    const normalizedEmail = email.toLowerCase().trim();

    const user = users.find(
      (u) =>
        u.email.toLowerCase().trim() === normalizedEmail &&
        u.password === password,
    );
    if (!user) {
      throw new Error("Invalid email or password");
    }

    const authUser: User = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    const token = `mock_token_${crypto.randomUUID()}`;
    return { token, user: authUser };
  }

  async registerPatient(
    name: string,
    email: string,
    password: string,
  ): Promise<AuthResponse> {
    await delay();
    const users: any[] = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    const normalizedEmail = email.toLowerCase().trim();

    if (users.some((u) => u.email.toLowerCase().trim() === normalizedEmail)) {
      throw new Error("Email is already registered");
    }

    const newUser = {
      id: `u_${crypto.randomUUID()}`,
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: "patient" as const,
    };

    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    const authUser: User = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    };
    const token = `mock_token_${crypto.randomUUID()}`;
    return { token, user: authUser };
  }

  // --- Doctors ---
  async getDoctors(): Promise<Doctor[]> {
    await delay();
    return JSON.parse(localStorage.getItem(DOCTORS_KEY) || "[]");
  }

  async addDoctor(doctor: Omit<Doctor, "id">): Promise<Doctor> {
    await delay();
    const doctors = await this.getDoctors();
    const newDoc = { ...doctor, id: `d_${crypto.randomUUID()}` };
    doctors.push(newDoc);
    localStorage.setItem(DOCTORS_KEY, JSON.stringify(doctors));
    return newDoc;
  }

  async removeDoctor(doctorId: string): Promise<void> {
    await delay();
    const doctors = await this.getDoctors();
    const filtered = doctors.filter((d) => d.id !== doctorId);
    localStorage.setItem(DOCTORS_KEY, JSON.stringify(filtered));
  }

  // --- Schedules ---
  async getDoctorSchedule(doctorId: string): Promise<string[]> {
    await delay(100);
    const schedules = JSON.parse(localStorage.getItem(SCHEDULES_KEY) || "{}");
    const defaultSlots = [
      "09:00",
      "09:30",
      "10:00",
      "11:30",
      "13:00",
      "14:30",
      "16:00",
    ];
    return schedules[doctorId] || defaultSlots;
  }

  async updateDoctorSchedule(doctorId: string, slots: string[]): Promise<void> {
    await delay(300);
    const schedules = JSON.parse(localStorage.getItem(SCHEDULES_KEY) || "{}");
    schedules[doctorId] = slots;
    localStorage.setItem(SCHEDULES_KEY, JSON.stringify(schedules));
  }

  // --- Appointments ---
  async getAppointments(): Promise<Appointment[]> {
    await delay();
    return JSON.parse(localStorage.getItem(APPOINTMENTS_KEY) || "[]");
  }

  async getAvailableSlots(
    doctorId: string,
    dateStr: string,
  ): Promise<string[]> {
    await delay(100);
    const allSlots = await this.getDoctorSchedule(doctorId);
    const appointments = await this.getAppointments();

    const bookedTimes = appointments
      .filter((apt) => apt.doctorId === doctorId && apt.status === "confirmed")
      .map((apt) => {
        const localDate = parseISO(apt.dateTimeUtc);
        if (format(localDate, "yyyy-MM-dd") === dateStr) {
          return format(localDate, "HH:mm");
        }
        return null;
      })
      .filter(Boolean) as string[];

    return allSlots.filter((slot) => !bookedTimes.includes(slot));
  }

  async bookAppointment(
    appointment: Omit<Appointment, "id" | "status">,
  ): Promise<Appointment> {
    await delay();
    const appointments = await this.getAppointments();

    const isTaken = appointments.some(
      (apt) =>
        apt.doctorId === appointment.doctorId &&
        apt.dateTimeUtc === appointment.dateTimeUtc &&
        apt.status === "confirmed",
    );

    if (isTaken) {
      throw new Error("This time slot is already booked by another patient.");
    }

    const newAppointment: Appointment = {
      ...appointment,
      id: `apt_${crypto.randomUUID()}`,
      status: "confirmed",
    };
    appointments.push(newAppointment);
    localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(appointments));
    return newAppointment;
  }

  async cancelAppointment(id: string): Promise<void> {
    const raw = localStorage.getItem(APPOINTMENTS_KEY) || "[]";
    const appointments: Appointment[] = JSON.parse(raw);
    const updated = appointments.map((apt) =>
      apt.id === id ? { ...apt, status: "cancelled" as const } : apt,
    );
    localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(updated));
  }

  // --- AI Assistant ---
  async askAIAssistant(
    symptoms: string,
  ): Promise<{ suggestion: string; reason: string }> {
    const rawDoctors = localStorage.getItem(DOCTORS_KEY);
    const doctors: Doctor[] = rawDoctors
      ? JSON.parse(rawDoctors)
      : MOCK_DOCTORS;
    const lowerSymptoms = symptoms.toLowerCase();

    let doc = doctors[0];
    if (lowerSymptoms.includes("heart") || lowerSymptoms.includes("chest")) {
      doc = doctors.find((d) => d.specialty === "Cardiology") || doc;
    } else if (
      lowerSymptoms.includes("head") ||
      lowerSymptoms.includes("brain")
    ) {
      doc = doctors.find((d) => d.specialty === "Neurology") || doc;
    }

    return {
      suggestion: doc.id,
      reason: `Based on your symptoms, a specialist in ${doc.specialty} (${doc.name}) might be suitable.`,
    };
  }
}

export const mockApi = new MockApiService();
