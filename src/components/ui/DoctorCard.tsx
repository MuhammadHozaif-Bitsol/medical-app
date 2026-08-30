import React from "react";
import type { Doctor } from "../../types";
import { Button } from "./Button";
import { LazyImage } from "./LazyImage";

export interface DoctorCardProps {
  doctor: Doctor;
  onBookClick?: (doctorId: string) => void;
  isSuggested?: boolean;
}

export const DoctorCard: React.FC<DoctorCardProps> = ({
  doctor,
  onBookClick,
  isSuggested,
}) => {
  return (
    <div
      className={`p-4 rounded-lg border bg-white flex flex-col sm:flex-row gap-4 items-center sm:items-start ${isSuggested ? "border-blue-400 shadow-md ring-1 ring-blue-400" : "border-slate-200 shadow-sm"}`}
    >
      <LazyImage
        src={doctor.avatarUrl || ""}
        alt={doctor.name}
        className="w-24 h-24 rounded-full shrink-0 bg-slate-100"
      />
      <div className="grow text-center sm:text-left">
        <div className="flex items-center gap-2 justify-center sm:justify-start">
          <h3 className="text-lg font-bold text-slate-800">{doctor.name}</h3>
          {isSuggested && (
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-semibold">
              AI Suggested
            </span>
          )}
        </div>
        <p className="text-slate-600 font-medium">{doctor.specialty}</p>
      </div>

      {onBookClick && (
        <div className="shrink-0 mt-4 sm:mt-0">
          <Button onClick={() => onBookClick(doctor.id)}>Book Slot</Button>
        </div>
      )}
    </div>
  );
};
