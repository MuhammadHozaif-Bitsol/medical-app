import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useMockApi } from "../hooks/useMockApi";
import type { Appointment } from "../types";
import { AIAssistant } from "../features/assistant/AIAssistant";
import { AppointmentBookingForm } from "../features/appointments/AppointmentBookingForm";
import { AppointmentCard } from "../components/ui/AppointmentCard";
import { Modal } from "../components/ui/Modal";
import { Button } from "../components/ui/Button";

export const PatientPortal: React.FC = () => {
  const { user } = useAuth();
  const { api, execute, isLoading } = useMockApi();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctorsMap, setDoctorsMap] = useState<Record<string, string>>({});
  const [cancelId, setCancelId] = useState<string | null>(null);

  const fetchAppointments = useCallback(() => {
    if (!user) return;
    execute(async () => {
      const [apts, docs] = await Promise.all([
        api.getAppointments(),
        api.getDoctors(),
      ]);
      return { apts, docs };
    }).then((res) => {
      if (res) {
        const dMap: Record<string, string> = {};
        res.docs.forEach((d) => (dMap[d.id] = d.name));
        setDoctorsMap(dMap);

        const userApts = res.apts
          .filter((apt) => apt.patientId === user.id)
          .sort(
            (a, b) =>
              new Date(a.dateTimeUtc).getTime() -
              new Date(b.dateTimeUtc).getTime(),
          );
        setAppointments(userApts);
      }
    });
  }, [api, execute, user]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const requestCancel = (appointmentId: string) => {
    setCancelId(appointmentId);
  };

  const confirmCancel = async () => {
    if (!cancelId) return;
    const success = await execute(() => api.cancelAppointment(cancelId));
    if (success !== null) {
      setCancelId(null);
      fetchAppointments();
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">
          Welcome, {user?.name}
        </h1>
        <p className="text-slate-600">
          Manage your appointments and get AI assistance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Booking Form & Appointments */}
        <div className="lg:col-span-2 space-y-8">
          <section>
            <AppointmentBookingForm onSuccess={fetchAppointments} />
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              Your Appointments
            </h2>
            {isLoading && appointments.length === 0 ? (
              <p className="text-slate-500 animate-pulse">
                Loading appointments...
              </p>
            ) : appointments.length > 0 ? (
              <div className="space-y-4">
                {appointments.map((apt) => (
                  <AppointmentCard
                    key={apt.id}
                    appointment={apt}
                    doctorName={doctorsMap[apt.doctorId]}
                    onCancelClick={requestCancel}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white p-6 rounded-xl border border-slate-200 text-center text-slate-500 shadow-sm">
                You have no upcoming appointments.
              </div>
            )}
          </section>
        </div>

        {/* Right Column: AI Assistant */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <AIAssistant />
          </div>
        </div>
      </div>

      <Modal
        isOpen={!!cancelId}
        onClose={() => setCancelId(null)}
        title="Cancel Appointment"
      >
        <div className="space-y-4">
          <p className="text-slate-600">
            Are you sure you want to cancel this appointment? This action cannot
            be undone.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setCancelId(null)}>
              No, Keep it
            </Button>
            <Button
              variant="danger"
              onClick={confirmCancel}
              isLoading={isLoading}
            >
              Yes, Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
