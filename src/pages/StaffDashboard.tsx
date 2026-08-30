import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useMockApi } from "../hooks/useMockApi";
import type { Appointment, Doctor } from "../types";
import { AppointmentCard } from "../components/ui/AppointmentCard";
import { Modal } from "../components/ui/Modal";
import { Button } from "../components/ui/Button";

const POSSIBLE_SLOTS = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
];

export const StaffDashboard: React.FC = () => {
  const { user } = useAuth();
  const { api, execute, error } = useMockApi();

  const [activeTab, setActiveTab] = useState<
    "appointments" | "doctors" | "schedules"
  >("appointments");

  // Global Data
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Appointments Tab State
  const [cancelId, setCancelId] = useState<string | null>(null);

  // Schedules Tab State
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [doctorSchedule, setDoctorSchedule] = useState<string[]>([]);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [isScheduleSaved, setIsScheduleSaved] = useState(false);

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
        setDoctors(res.docs);
        const sortedApts = [...res.apts].sort(
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

  const doctorsMap = doctors.reduce(
    (acc, d) => ({ ...acc, [d.id]: d.name }),
    {} as Record<string, string>,
  );

  // --- Appointments Handlers ---
  const confirmCancel = async () => {
    if (!cancelId) return;
    const success = await execute(() => api.cancelAppointment(cancelId));
    if (success !== null) {
      setCancelId(null);
      fetchData();
    }
  };

  // --- Schedules Handlers ---
  useEffect(() => {
    if (selectedDoctorId && activeTab === "schedules") {
      execute(() => api.getDoctorSchedule(selectedDoctorId)).then((res) => {
        if (res) setDoctorSchedule(res);
      });
    }
  }, [selectedDoctorId, activeTab, api, execute]);

  const toggleSlot = (slot: string) => {
    setDoctorSchedule((prev) =>
      prev.includes(slot)
        ? prev.filter((s) => s !== slot)
        : [...prev, slot].sort((a, b) => a.localeCompare(b)),
    );
  };

  const handleSaveSchedule = async () => {
    if (!selectedDoctorId) return;
    setIsSavingSchedule(true);
    await execute(() =>
      api.updateDoctorSchedule(selectedDoctorId, doctorSchedule),
    );
    setIsSavingSchedule(false);
    setIsScheduleSaved(true);
    setTimeout(() => setIsScheduleSaved(false), 3000);
  };

  let appointmentsContent;
  if (isLoading && appointments.length === 0) {
    appointmentsContent = (
      <div className="text-center py-10">
        <p className="text-slate-500 animate-pulse">Loading appointments...</p>
      </div>
    );
  } else if (appointments.length > 0) {
    appointmentsContent = (
      <div className="space-y-4">
        {appointments.map((apt) => (
          <AppointmentCard
            key={apt.id}
            appointment={apt}
            doctorName={doctorsMap[apt.doctorId]}
            isStaffView={true}
            onCancelClick={(id) => setCancelId(id)}
          />
        ))}
      </div>
    );
  } else {
    appointmentsContent = (
      <div className="text-center py-10 bg-slate-50 rounded-lg border border-slate-100">
        <p className="text-slate-500">
          There are no appointments booked in the system yet.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Staff Dashboard</h1>
        <p className="text-slate-600">
          Welcome, {user?.name}. Manage clinic operations below.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg mb-6 w-full sm:w-auto overflow-x-auto">
        <button
          type="button"
          className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${activeTab === "appointments" ? "bg-white shadow-sm text-slate-800" : "text-slate-600 hover:text-slate-800"}`}
          onClick={() => setActiveTab("appointments")}
        >
          Appointments
        </button>
        <button
          type="button"
          className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${activeTab === "doctors" ? "bg-white shadow-sm text-slate-800" : "text-slate-600 hover:text-slate-800"}`}
          onClick={() => setActiveTab("doctors")}
        >
          Doctors & Departments
        </button>
        <button
          type="button"
          className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${activeTab === "schedules" ? "bg-white shadow-sm text-slate-800" : "text-slate-600 hover:text-slate-800"}`}
          onClick={() => setActiveTab("schedules")}
        >
          Time Slots & Schedules
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm min-h-[400px]">
        {/* ================= TAB: APPOINTMENTS ================= */}
        {activeTab === "appointments" && (
          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-6">
              All Appointments
            </h2>
            {appointmentsContent}
          </div>
        )}

        {/* ================= TAB: DOCTORS ================= */}
        {activeTab === "doctors" && (
          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-6">
              Manage Doctors
            </h2>

            {/* Doctors List */}

            {/* Doctors List */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-100 text-slate-800">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg rounded-bl-lg">
                      Name
                    </th>
                    <th className="px-4 py-3 rounded-tr-lg rounded-br-lg">
                      Specialty
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {doctors.map((doc) => (
                    <tr
                      key={doc.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3 font-medium text-slate-800">
                          {doc.avatarUrl && (
                            <img
                              src={doc.avatarUrl}
                              alt=""
                              className="w-8 h-8 rounded-full bg-slate-200 object-cover"
                            />
                          )}
                          {doc.name}
                        </div>
                      </td>
                      <td className="px-4 py-4">{doc.specialty}</td>
                    </tr>
                  ))}
                  {doctors.length === 0 && (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-4 py-8 text-center text-slate-500"
                      >
                        No doctors found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB: SCHEDULES ================= */}
        {activeTab === "schedules" && (
          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-6">
              Manage Time Slots
            </h2>

            <div className="flex flex-col md:flex-row gap-8">
              {/* Doctor Selection Sidebar */}
              <div className="w-full md:w-1/3">
                <h3 className="font-semibold text-slate-700 mb-3">
                  Select Doctor
                </h3>
                <div className="flex flex-col gap-2">
                  {doctors.map((doc) => (
                    <button
                      type="button"
                      key={doc.id}
                      onClick={() => setSelectedDoctorId(doc.id)}
                      className={`text-left px-4 py-3 rounded-lg border transition-colors ${selectedDoctorId === doc.id ? "bg-blue-50 border-blue-200 text-blue-800 font-medium" : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"}`}
                    >
                      {doc.name}{" "}
                      <span className="text-xs text-slate-500 block">
                        {doc.specialty}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Schedule Editor */}
              <div className="w-full md:w-2/3">
                {!selectedDoctorId ? (
                  <div className="h-full flex items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-xl">
                    <p className="text-slate-500">
                      Please select a doctor to manage their schedule.
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold text-slate-800">
                        Available Time Slots for {doctorsMap[selectedDoctorId]}
                      </h3>
                    </div>
                    <p className="text-sm text-slate-500 mb-6">
                      Check the boxes below to make those times available for
                      patients to book.
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
                      {POSSIBLE_SLOTS.map((slot) => {
                        const isSelected = doctorSchedule.includes(slot);
                        return (
                          <button
                            type="button"
                            key={slot}
                            onClick={() => toggleSlot(slot)}
                            className={`px-3 py-2 rounded-md border text-sm font-medium transition-colors flex items-center justify-center gap-2
                              ${isSelected ? "bg-blue-600 border-blue-600 text-white shadow-sm" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"}`}
                          >
                            {isSelected && (
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                            {slot}
                          </button>
                        );
                      })}
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-4">
                      {isScheduleSaved && (
                        <span className="text-sm font-medium text-green-600 animate-in fade-in zoom-in duration-300">
                          Saved successfully!
                        </span>
                      )}
                      <Button
                        onClick={handleSaveSchedule}
                        isLoading={isSavingSchedule}
                      >
                        Save Schedule
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cancel Appointment Modal */}
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
