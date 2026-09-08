import { format, parseISO } from "date-fns";
import type { User, Doctor, Appointment, AuthResponse } from "../types";

const BASE_URL = "/api";

export class MockApiService {
  // --- Auth ---
  async login(email: string, password: string): Promise<AuthResponse> {
    const normalizedEmail = email.toLowerCase().trim();
    const cleanPassword = password.trim();

    const res = await fetch(
      `${BASE_URL}/users?email=${encodeURIComponent(normalizedEmail)}&password=${encodeURIComponent(cleanPassword)}`,
    );
    if (!res.ok) {
      throw new Error("Failed to connect to authentication service");
    }
    const users: Array<User & { password?: string }> = await res.json();

    const user = users[0];
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
    const normalizedEmail = email.toLowerCase().trim();
    const cleanName = name.trim();
    const cleanPassword = password.trim();

    const checkRes = await fetch(
      `${BASE_URL}/users?email=${encodeURIComponent(normalizedEmail)}`,
    );
    if (checkRes.ok) {
      const existing: User[] = await checkRes.json();
      if (existing.length > 0) {
        throw new Error("Email is already registered");
      }
    }

    const newUser = {
      id: `u_${crypto.randomUUID()}`,
      name: cleanName,
      email: normalizedEmail,
      password: cleanPassword,
      role: "patient" as const,
    };

    const res = await fetch(`${BASE_URL}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    });

    if (!res.ok) {
      throw new Error("Failed to register user");
    }

    const created: User = await res.json();
    const authUser: User = {
      id: created.id,
      name: created.name,
      email: created.email,
      role: created.role,
    };
    const token = `mock_token_${crypto.randomUUID()}`;
    return { token, user: authUser };
  }

  // --- Doctors ---
  async getDoctors(): Promise<Doctor[]> {
    const res = await fetch(`${BASE_URL}/doctors`);
    if (!res.ok) {
      throw new Error("Failed to load doctors");
    }
    return res.json();
  }

  async addDoctor(doctor: Omit<Doctor, "id">): Promise<Doctor> {
    const newDoc = { ...doctor, id: `d_${crypto.randomUUID()}` };
    const res = await fetch(`${BASE_URL}/doctors`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newDoc),
    });
    if (!res.ok) {
      throw new Error("Failed to add doctor");
    }
    return res.json();
  }

  async removeDoctor(doctorId: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/doctors/${doctorId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      throw new Error("Failed to remove doctor");
    }
  }

  // --- Schedules ---
  async getDoctorSchedule(doctorId: string): Promise<string[]> {
    const defaultSlots = [
      "09:00",
      "09:30",
      "10:00",
      "11:30",
      "13:00",
      "14:30",
      "16:00",
    ];
    try {
      const res = await fetch(`${BASE_URL}/schedules/${doctorId}`);
      if (!res.ok) {
        return defaultSlots;
      }
      const data = await res.json();
      return data.slots || defaultSlots;
    } catch {
      return defaultSlots;
    }
  }

  async updateDoctorSchedule(doctorId: string, slots: string[]): Promise<void> {
    const checkRes = await fetch(`${BASE_URL}/schedules/${doctorId}`);
    if (checkRes.ok) {
      const res = await fetch(`${BASE_URL}/schedules/${doctorId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: doctorId, doctorId, slots }),
      });
      if (!res.ok) {
        throw new Error("Failed to update schedule");
      }
    } else {
      const res = await fetch(`${BASE_URL}/schedules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: doctorId, doctorId, slots }),
      });
      if (!res.ok) {
        throw new Error("Failed to update schedule");
      }
    }
  }

  // --- Appointments ---
  async getAppointments(): Promise<Appointment[]> {
    const res = await fetch(`${BASE_URL}/appointments`);
    if (!res.ok) {
      throw new Error("Failed to load appointments");
    }
    return res.json();
  }

  async getAvailableSlots(
    doctorId: string,
    dateStr: string,
  ): Promise<string[]> {
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

    const res = await fetch(`${BASE_URL}/appointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newAppointment),
    });

    if (!res.ok) {
      throw new Error("Failed to book appointment");
    }

    return res.json();
  }

  async cancelAppointment(id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled" }),
    });

    if (!res.ok) {
      throw new Error("Failed to cancel appointment");
    }
  }

  // --- AI Assistant ---
  async askAIAssistant(
    symptoms: string,
  ): Promise<{ suggestion: string; reason: string }> {
    const doctors = await this.getDoctors();
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
