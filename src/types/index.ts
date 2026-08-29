export type Role = "patient" | "staff";

export interface User {
  id: string;
  name: string;
  role: Role;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  avatarUrl?: string; // For lazy loading demonstration
}

export interface Appointment {
  id: string;
  doctorId: string;
  patientId: string;
  patientName: string;
  dateTimeUtc: string; // ISO 8601 UTC string
  status: "confirmed" | "cancelled";
}

export interface AuthResponse {
  token: string;
  user: User;
}
