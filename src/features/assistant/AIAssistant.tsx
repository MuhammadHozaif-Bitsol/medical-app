import React, { useState, useEffect } from "react";
import { useMockApi } from "../../hooks/useMockApi";
import type { Doctor } from "../../types";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { DoctorCard } from "../../components/ui/DoctorCard";
import { Bot, AlertCircle } from "lucide-react";

export const AIAssistant: React.FC = () => {
  const [symptoms, setSymptoms] = useState("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [result, setResult] = useState<{
    doctor: Doctor;
    reason: string;
  } | null>(null);

  const { api, execute, isLoading, error } = useMockApi();

  // Fetch the doctors list in the background so we can display the full DoctorCard
  // when the AI returns a doctor ID.
  useEffect(() => {
    execute(() => api.getDoctors()).then((res) => {
      if (res) setDoctors(res);
    });
  }, [api, execute]);

  const submitAction = async () => {
    if (!symptoms.trim()) return;

    setResult(null); // Clear previous results

    // Call the mock AI endpoint
    const response = await execute(() => api.askAIAssistant(symptoms));

    if (response && doctors.length > 0) {
      const matchedDoctor = doctors.find((d) => d.id === response.suggestion);
      if (matchedDoctor) {
        setResult({ doctor: matchedDoctor, reason: response.reason });
      }
    }
    setSymptoms("");
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
          <Bot size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">AI Assistant</h2>
          <p className="text-sm text-slate-500">
            Describe your symptoms to find the right specialist.
          </p>
        </div>
      </div>

      <form action={submitAction} className="flex gap-2 mb-4">
        <Input
          placeholder="e.g., I have been experiencing severe chest pain..."
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
          disabled={isLoading}
          className="grow"
        />
        <Button type="submit" isLoading={isLoading} disabled={!symptoms.trim()}>
          Ask AI
        </Button>
      </form>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {result && (
        <div className="mt-6 pt-6 border-t border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-start gap-2 mb-4 text-amber-700 bg-amber-50 p-3 rounded-md border border-amber-200 text-sm">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <p>
              <strong>Disclaimer:</strong> This is an AI suggestion, not a
              medical diagnosis.
            </p>
          </div>

          <p className="text-slate-700 font-medium mb-3">
            <span className="text-blue-600 font-bold">Reasoning:</span>
            {result.reason}
          </p>

          <DoctorCard doctor={result.doctor} isSuggested={true} />
        </div>
      )}
    </div>
  );
};
