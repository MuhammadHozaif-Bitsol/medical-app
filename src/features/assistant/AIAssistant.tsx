import React, { useState, useEffect } from "react";
import { useMockApi } from "../../hooks/useMockApi";
import type { Doctor } from "../../types";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { DoctorCard } from "../../components/ui/DoctorCard";
import { Bot, AlertCircle, Loader2 } from "lucide-react";

export const AIAssistant: React.FC = () => {
  const [symptoms, setSymptoms] = useState("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [result, setResult] = useState<{
    doctor: Doctor;
    reason: string;
  } | null>(null);

  const { api, execute, isLoading, error } = useMockApi();

  // Fetch the doctors list in the background so we can display the full DoctorCard
  // when the AI returns a doctor ID, without setting the AI loading state.
  useEffect(() => {
    let isMounted = true;
    api
      .getDoctors()
      .then((res) => {
        if (isMounted && res) setDoctors(res);
      })
      .catch(() => {
        // Silently catch background pre-fetch error
      });

    return () => {
      isMounted = false;
    };
  }, [api]);

  const submitAction = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = symptoms.trim();
    if (!query || isLoading) return;

    setResult(null); // Clear previous results

    // Call the mock AI endpoint
    const response = await execute(() => api.askAIAssistant(query));

    if (response) {
      let currentDoctors = doctors;
      if (currentDoctors.length === 0) {
        currentDoctors = (await api.getDoctors().catch(() => [])) || [];
        setDoctors(currentDoctors);
      }
      const matchedDoctor = currentDoctors.find((d) => d.id === response.suggestion);
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

      <form onSubmit={submitAction} className="flex items-start gap-2 mb-4">
        <div className="grow">
          <Input
            placeholder="e.g., I have been experiencing severe chest pain..."
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            disabled={isLoading}
            className="h-10"
          />
        </div>
        <Button
          type="submit"
          isLoading={isLoading}
          disabled={!symptoms.trim() || isLoading}
          className="h-10 whitespace-nowrap px-4 shrink-0"
        >
          Ask AI
        </Button>
      </form>

      {/* Loading state while waiting for AI response */}
      {isLoading && (
        <div
          role="status"
          aria-label="Loading"
          className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-center py-8 animate-in fade-in duration-200"
        >
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      )}

      {error && !isLoading && (
        <div className="mb-4 p-3.5 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200 flex items-start gap-2">
          <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-600" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {result && !isLoading && (
        <div className="mt-6 pt-6 border-t border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-start gap-2.5 mb-4 text-amber-800 bg-amber-50/90 p-3.5 rounded-lg border border-amber-200 text-sm shadow-xs">
            <AlertCircle size={18} className="shrink-0 mt-0.5 text-amber-600" />
            <div>
              <span className="font-semibold text-amber-900 block sm:inline">
                Medical Disclaimer:{" "}
              </span>
              <span>
                This is an AI suggestion, not a medical diagnosis. Please
                consult a qualified healthcare professional for urgent or severe
                symptoms.
              </span>
            </div>
          </div>

          <p className="text-slate-700 font-medium mb-3">
            <span className="text-blue-600 font-bold">Reasoning: </span>
            {result.reason}
          </p>

          <DoctorCard doctor={result.doctor} isSuggested={true} />
        </div>
      )}
    </div>
  );
};
