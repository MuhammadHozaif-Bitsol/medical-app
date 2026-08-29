import React from 'react';
import type { Appointment } from '../../types';
import { Button } from './Button';
import { format, parseISO } from 'date-fns';

export interface AppointmentCardProps {
  appointment: Appointment;
  doctorName?: string; // Sometimes we pass this if we joined the data
  onCancelClick?: (appointmentId: string) => void;
  isStaffView?: boolean;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({ 
  appointment, 
  doctorName,
  onCancelClick,
  isStaffView 
}) => {
  // Parse UTC string and format to local time
  const localDate = parseISO(appointment.dateTimeUtc);
  const dateStr = format(localDate, 'MMM d, yyyy');
  const timeStr = format(localDate, 'h:mm a');

  return (
    <div className="p-4 rounded-lg border border-slate-200 bg-white shadow-sm flex flex-col sm:flex-row justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-bold text-slate-800">
            {dateStr} at {timeStr}
          </h4>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {appointment.status}
          </span>
        </div>
        
        <div className="text-sm text-slate-600">
          {isStaffView ? (
            <p>Patient: <span className="font-medium text-slate-800">{appointment.patientName}</span></p>
          ) : doctorName ? (
            <p>Doctor: <span className="font-medium text-slate-800">{doctorName}</span></p>
          ) : (
            <p>Doctor ID: {appointment.doctorId}</p>
          )}
        </div>
      </div>

      {appointment.status === 'confirmed' && onCancelClick && (
        <div className="flex items-center">
          <Button variant="danger" onClick={() => onCancelClick(appointment.id)}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
};
