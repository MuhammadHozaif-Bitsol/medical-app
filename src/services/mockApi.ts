import type { User, Doctor, Appointment, AuthResponse } from '../types';

const DOCTORS_KEY = 'booking_doctors';
const APPOINTMENTS_KEY = 'booking_appointments';

const MOCK_DOCTORS: Doctor[] = [
  { id: 'd1', name: 'Dr. Ayesha', specialty: 'General Practice', avatarUrl: 'https://i.pravatar.cc/150?u=d1' },
  { id: 'd2', name: 'Dr. Ali', specialty: 'Cardiology', avatarUrl: 'https://i.pravatar.cc/150?u=d2' },
  { id: 'd3', name: 'Dr. Ahmed', specialty: 'Neurology', avatarUrl: 'https://i.pravatar.cc/150?u=d3' },
];

// Utility to simulate network delay
const delay = (ms: number = 800) => new Promise((resolve) => setTimeout(resolve, ms));

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
  async login(role: 'patient' | 'staff', name: string): Promise<AuthResponse> {
    await delay();
    const user: User = {
      id: `u_${Math.random().toString(36).substr(2, 9)}`,
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
    return JSON.parse(localStorage.getItem(DOCTORS_KEY) || '[]');
  }
 
  // --- Appointments ---
  async getAppointments(): Promise<Appointment[]> {
    await delay();
    return JSON.parse(localStorage.getItem(APPOINTMENTS_KEY) || '[]');
  }

  async getAvailableSlots(doctorId: string, date: string): Promise<string[]> {
    await delay(400); // Simulate network check
    // In a real app, this would filter out already booked slots from the database.
    // For this frontend phase, we return a static mock array of times.
    return ['09:00', '09:30', '10:00', '11:30', '13:00', '14:30', '16:00'];
  }

  async bookAppointment(appointment: Omit<Appointment, 'id' | 'status'>): Promise<Appointment> {
    await delay();
    const newAppointment: Appointment = {
      ...appointment,
      id: `apt_${Math.random().toString(36).substr(2, 9)}`,
      status: 'confirmed',
    };
    const appointments = await this.getAppointments();
    appointments.push(newAppointment);
    localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(appointments));
    return newAppointment;
  }

  async cancelAppointment(id: string): Promise<void> {
    await delay();
    const appointments = await this.getAppointments();
    const updated = appointments.map(apt => 
      apt.id === id ? { ...apt, status: 'cancelled' as const } : apt
    );
    localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(updated));
  }

  // --- AI Assistant ---
  async askAIAssistant(symptoms: string): Promise<{ suggestion: string; reason: string }> {
    await delay(1200); // slightly longer delay for AI feeling
    const doctors = await this.getDoctors();
    const lowerSymptoms = symptoms.toLowerCase();
    
    let doc = doctors[0]; // default to GP
    if (lowerSymptoms.includes('heart') || lowerSymptoms.includes('chest')) {
      doc = doctors.find(d => d.specialty === 'Cardiology') || doc;
    } else if (lowerSymptoms.includes('head') || lowerSymptoms.includes('brain')) {
      doc = doctors.find(d => d.specialty === 'Neurology') || doc;
    }

    return {
      suggestion: doc.id,
      reason: `Based on your symptoms, a specialist in ${doc.specialty} (${doc.name}) might be suitable.`
    };
  }
}

export const mockApi = new MockApiService();
