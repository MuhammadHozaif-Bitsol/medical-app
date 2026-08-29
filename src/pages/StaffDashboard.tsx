import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useMockApi } from "../hooks/useMockApi";
import type { Appointment } from "../types";
import { AppointmentCard } from "../components/ui/AppointmentCard";
import { Modal } from "../components/ui/Modal";
import { Button } from "../components/ui/Button";

export const StaffDashboard: React.FC = () => {
  const { user } = useAuth();
  const { api, execute, error } = useMockApi();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctorsMap, setDoctorsMap] = useState<Record<string, string>>({});
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(() => {
    setIsLoading(true);
    execute(async () => {
      const [apts, docs] = await Promise.all([
        api.getAppointments(),
        api.getDoctors(),
      ]);
      return { apts, docs };
    }).then((res) => {
      if (res) {
        // Map doctors
        const dMap: Record<string, string> = {};
        res.docs.forEach((d) => (dMap[d.id] = d.name));
        setDoctorsMap(dMap);

        // Sort all appointments (most recent / upcoming first)
        const sortedApts = res.apts.sort(
          (a, b) =>
            new Date(a.dateTimeUtc).getTime() -
            new Date(b.dateTimeUtc).getTime(),
        );
        setAppointments(sortedApts);
      }
      setIsLoading(false);
    });
  }, [api, execute]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const requestCancel = (appointmentId: string) => {
    setCancelId(appointmentId);
  };

  const confirmCancel = async () => {
    if (!cancelId) return;
    const success = await execute(() => api.cancelAppointment(cancelId));
    if (success !== null) {
      setCancelId(null);
      fetchData();
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Staff Dashboard</h1>
        <p className="text-slate-600">
          Welcome, {user?.name}. Manage clinic appointments below.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 mb-6">
          All Appointments
        </h2>

        {isLoading && appointments.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-slate-500 animate-pulse">
              Loading clinic data...
            </p>
          </div>
        ) : appointments.length > 0 ? (
          <div className="space-y-4">
            {appointments.map((apt) => (
              <AppointmentCard
                key={apt.id}
                appointment={apt}
                doctorName={doctorsMap[apt.doctorId]}
                isStaffView={true}
                onCancelClick={requestCancel}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-slate-50 rounded-lg border border-slate-100">
            <p className="text-slate-500">
              There are no appointments booked in the system yet.
            </p>
          </div>
        )}
      </div>

      <Modal
        isOpen={!!cancelId}
        onClose={() => setCancelId(null)}
        title="Cancel Patient Appointment"
      >
        <div className="space-y-4">
          <p className="text-slate-600">
            Are you sure you want to cancel this appointment? The patient will
            no longer be able to attend this slot.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setCancelId(null)}>
              No, Keep it
            </Button>
            <Button variant="danger" onClick={confirmCancel}>
              Yes, Cancel Appointment
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
