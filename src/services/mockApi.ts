import type { User, Doctor, Appointment, AuthResponse } from "../types";
import { format, parseISO } from "date-fns";

const DOCTORS_KEY = "booking_doctors";
const APPOINTMENTS_KEY = "booking_appointments";

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

// Utility to simulate network delay
const delay = (ms: number = 800) =>
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
  }

  // --- Auth ---
  async login(role: "patient" | "staff", name: string): Promise<AuthResponse> {
    await delay();
    const user: User = {
      id: `u_${crypto.randomUUID()}`,
      name,
      role,
    };
    // Mock JWT token (base64 encoded JSON)
    const token = btoa(JSON.stringify({ userId: user.id, role: user.role }));
    return { token, user };
  }

  // --- Doctors ---
  async getDoctors(): Promise<Doctor[]> {
    await delay();
    return JSON.parse(localStorage.getItem(DOCTORS_KEY) || "[]");
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
    await delay(400);
    const allSlots = [
      "09:00",
      "09:30",
      "10:00",
      "11:30",
      "13:00",
      "14:30",
      "16:00",
    ];

    // Fetch all existing appointments
    const appointments = await this.getAppointments();

    // Find confirmed appointments for this doctor on the selected local date
    const bookedTimes = appointments
      .filter((apt) => apt.doctorId === doctorId && apt.status === "confirmed")
      .map((apt) => {
        const localDate = parseISO(apt.dateTimeUtc);
        // If the appointment is on the requested date, extract the time
        if (format(localDate, "yyyy-MM-dd") === dateStr) {
          return format(localDate, "HH:mm");
        }
        return null;
      })
      .filter(Boolean) as string[];

    // Return only the slots that have not been booked
    return allSlots.filter((slot) => !bookedTimes.includes(slot));
  }

  async bookAppointment(
    appointment: Omit<Appointment, "id" | "status">,
  ): Promise<Appointment> {
    await delay();
    const newAppointment: Appointment = {
      ...appointment,
      id: `apt_${crypto.randomUUID()}`,
      status: "confirmed",
    };
    const appointments = await this.getAppointments();
    appointments.push(newAppointment);
    localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(appointments));
    return newAppointment;
  }

  async cancelAppointment(id: string): Promise<void> {
    // Intentionally removed artificial delay for cancel action
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
    // Artificial delays removed for instant response
    const rawDoctors = localStorage.getItem(DOCTORS_KEY);
    const doctors: Doctor[] = rawDoctors
      ? JSON.parse(rawDoctors)
      : MOCK_DOCTORS;
    const lowerSymptoms = symptoms.toLowerCase();

    let doc = doctors[0]; // default to GP
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
