import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { parse, formatISO } from "date-fns";
import { useMockApi } from "../../hooks/useMockApi";
import { useAuth } from "../../context/AuthContext";
import type { Doctor } from "../../types";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

interface BookingFormData {
  doctorId: string;
  date: string;
  time: string;
}

interface AppointmentBookingFormProps {
  onSuccess: () => void;
}

export const AppointmentBookingForm: React.FC<AppointmentBookingFormProps> = ({
  onSuccess,
}) => {
  const { user } = useAuth();
  const { api, execute, isLoading, error } = useMockApi();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isFetchingSlots, setIsFetchingSlots] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BookingFormData>();

  const selectedDoctorId = watch("doctorId");
  const selectedDate = watch("date");
  const selectedTime = watch("time");

  // Fetch doctors on mount
  useEffect(() => {
    execute(() => api.getDoctors()).then((res) => {
      if (res) setDoctors(res);
    });
  }, [api, execute]);

  // Fetch available slots when doctor AND date are selected
  useEffect(() => {
    if (selectedDoctorId && selectedDate) {
      setIsFetchingSlots(true);
      api
        .getAvailableSlots(selectedDoctorId, selectedDate)
        .then((slots) => {
          setAvailableSlots(slots);
          setValue("time", ""); // Reset time selection when slots change
        })
        .finally(() => setIsFetchingSlots(false));
    } else {
      setAvailableSlots([]);
    }
  }, [selectedDoctorId, selectedDate, api, setValue]);

  const onSubmit = async (data: BookingFormData) => {
    if (!user) return;

    // --- TIMEZONE HANDLING ---
    // 1. Parse the exact local date/time the user selected
    const localDateTime = parse(
      `${data.date} ${data.time}`,
      "yyyy-MM-dd HH:mm",
      new Date(),
    );

    // 2. Convert to ISO 8601 UTC string (required by PRD)
    // formatISO automatically includes the local offset, standardizing it for the backend
    const dateTimeUtc = formatISO(localDateTime);

    const appointmentPayload = {
      doctorId: data.doctorId,
      patientId: user.id,
      patientName: user.name,
      dateTimeUtc,
    };

    const result = await execute(() => api.bookAppointment(appointmentPayload));
    if (result) {
      onSuccess();
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <h2 className="text-xl font-bold text-slate-800 mb-6">
        Book an Appointment
      </h2>

      {error && (
        <p className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Doctor Selection */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">
            Select Specialist
          </label>
          <select
            {...register("doctorId", { required: "Please select a doctor" })}
            className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">-- Choose a doctor --</option>
            {doctors.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.name} ({doc.specialty})
              </option>
            ))}
          </select>
          {errors.doctorId && (
            <span className="text-sm text-red-500">
              {errors.doctorId.message}
            </span>
          )}
        </div>

        {/* Date Selection */}
        <Input
          type="date"
          label="Preferred Date"
          {...register("date", { required: "Please select a date" })}
          error={errors.date?.message}
          min={new Date().toISOString().split("T")[0]} // prevent past dates
          disabled={!selectedDoctorId}
        />

        {/* Time Slots (Conditionally rendered) */}
        {selectedDoctorId && selectedDate && (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700">
              Available Times
            </label>

            {isFetchingSlots ? (
              <div className="text-sm text-slate-500 animate-pulse">
                Loading slots...
              </div>
            ) : availableSlots.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {availableSlots.map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() =>
                      setValue("time", time, { shouldValidate: true })
                    }
                    className={`py-2 px-3 text-sm rounded-md border font-medium transition-colors ${
                      selectedTime === time
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-slate-700 border-slate-300 hover:border-blue-500 hover:bg-blue-50"
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-500 bg-slate-50 p-3 rounded border">
                No slots available on this date.
              </div>
            )}
            {/* Hidden input to register 'time' with react-hook-form */}
            <input
              type="hidden"
              {...register("time", { required: "Please select a time slot" })}
            />
            {errors.time && (
              <span className="text-sm text-red-500">
                {errors.time.message}
              </span>
            )}
          </div>
        )}

        <div className="pt-4 border-t border-slate-100">
          <Button
            type="submit"
            className="w-full"
            isLoading={isLoading}
            disabled={!selectedDoctorId || !selectedDate || !selectedTime}
          >
            Confirm Booking
          </Button>
        </div>
      </form>
    </div>
  );
};
