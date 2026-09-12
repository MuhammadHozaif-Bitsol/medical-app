import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import { createApp } from "./node_modules/json-server/lib/app.js";

// Load environment variables if .env exists
try {
  if (typeof process.loadEnvFile === "function" && fs.existsSync(".env")) {
    process.loadEnvFile(".env");
  }
} catch (err) {
  console.warn("[server] Could not load .env file:", err.message);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.resolve(__dirname, "db.json");

const PORT = parseInt(process.env.PORT || "3001", 10);
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

// Helper to read incoming JSON body
function getRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      // Prevent payload flood
      if (body.length > 1e6) {
        req.destroy();
        reject(new Error("Payload too large"));
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

// Initialize LowDB instance for json-server
const adapter = new JSONFile(DB_FILE);
const db = new Low(adapter, {});
await db.read();

// Create json-server app
const jsonApp = createApp(db);

// Handle AI Triage Assistant request
async function handleAIAssistant(req, res) {
  res.setHeader("Content-Type", "application/json");

  let body;
  try {
    body = await getRequestBody(req);
  } catch (err) {
    res.writeHead(400);
    res.end(JSON.stringify({ error: err.message }));
    return;
  }

  const symptoms =
    typeof body?.symptoms === "string" ? body.symptoms.trim() : "";
  if (!symptoms) {
    res.writeHead(400);
    res.end(JSON.stringify({ error: "Symptoms description is required." }));
    return;
  }

  // Zero-Crash Normalization: Check API Key
  if (!GEMINI_API_KEY) {
    console.error(
      "[AI Assistant Error]: GEMINI_API_KEY is missing in environment variables.",
    );
    res.writeHead(503);
    res.end(
      JSON.stringify({ error: "AI assistant is not available right now." }),
    );
    return;
  }

  try {
    // Refresh DB to get latest active doctors and specialties
    await db.read();
    const doctors = Array.isArray(db.data?.doctors) ? db.data.doctors : [];
    const specialties = [
      ...new Set(doctors.map((d) => d.specialty).filter(Boolean)),
    ];

    if (specialties.length === 0) {
      console.error(
        "[AI Assistant Error]: No active specialties found in database.",
      );
      res.writeHead(503);
      res.end(
        JSON.stringify({ error: "AI assistant is not available right now." }),
      );
      return;
    }

    // Privacy & Data Minimization:
    // Only raw symptoms and the list of available specialties are sent.
    // NO patient identifiers (name, id, email) and NO doctor names/ids are sent.
    const promptText = `You are an AI medical triage assistant for a clinic intake system.
Given the patient's reported symptoms, recommend the single most appropriate medical specialty from the provided list of available specialties at this clinic.
Explain the clinical reasoning in one or two clear, concise sentences suitable for patient guidance.

Patient Symptoms:
"${symptoms}"

Available Specialties at this clinic:
${specialties.map((s) => `- ${s}`).join("\n")}`;

    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      GEMINI_MODEL,
    )}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;

    // Strict Enum Constraint via Structured Output
    const geminiPayload = {
      contents: [
        {
          role: "user",
          parts: [{ text: promptText }],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            specialty: {
              type: "STRING",
              enum: specialties,
            },
            reason: {
              type: "STRING",
              description:
                "Clear, patient-friendly explanation for recommending this specialty.",
            },
          },
          required: ["specialty", "reason"],
        },
      },
    };

    const geminiRes = await fetch(geminiEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiPayload),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error(
        `[AI Assistant Error]: Gemini API returned status ${geminiRes.status}:`,
        errText,
      );
      res.writeHead(503);
      res.end(
        JSON.stringify({ error: "AI assistant is not available right now." }),
      );
      return;
    }

    const geminiData = await geminiRes.json();
    const rawContent = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawContent) {
      console.error(
        "[AI Assistant Error]: Empty response text from Gemini API.",
      );
      res.writeHead(503);
      res.end(
        JSON.stringify({ error: "AI assistant is not available right now." }),
      );
      return;
    }

    const parsed = JSON.parse(rawContent);
    const selectedSpecialty = parsed.specialty;
    const reason =
      parsed.reason ||
      `Specialist in ${selectedSpecialty} recommended based on symptoms.`;

    // Local Resolution:
    // Map the selected specialty back to an active doctor in our local database.
    const matchedDoctor = doctors.find(
      (d) => d.specialty.toLowerCase() === selectedSpecialty.toLowerCase(),
    );

    if (!matchedDoctor) {
      console.error(
        `[AI Assistant Error]: Local resolution failed. No active doctor matches specialty "${selectedSpecialty}".`,
      );
      res.writeHead(503);
      res.end(
        JSON.stringify({ error: "AI assistant is not available right now." }),
      );
      return;
    }

    res.writeHead(200);
    res.end(
      JSON.stringify({
        suggestion: matchedDoctor.id,
        specialty: matchedDoctor.specialty,
        reason,
      }),
    );
  } catch (err) {
    // Zero-Crash Error Normalization:
    // Log privately to server console, return clean standardized message to user.
    console.error(
      "[AI Assistant Error]: Unhandled exception during triage:",
      err.message,
    );
    res.writeHead(503);
    res.end(
      JSON.stringify({ error: "AI assistant is not available right now." }),
    );
  }
}

// HTTP Server
const server = http.createServer((req, res) => {
  const urlPath = req.url.split("?")[0];

  // Intercept POST /assistant or POST /api/assistant
  if (
    req.method === "POST" &&
    (urlPath === "/assistant" || urlPath === "/api/assistant")
  ) {
    handleAIAssistant(req, res);
    return;
  }

  // Delegate all other routes to json-server
  jsonApp.handler(req, res);
});

server.listen(PORT, () => {
  console.log(
    `[server] Clinic Backend & AI Assistant running at http://localhost:${PORT}`,
  );
  console.log(
    `  - REST API: http://localhost:${PORT}/doctors, /appointments, /schedules`,
  );
  console.log(`  - AI Assistant: POST http://localhost:${PORT}/assistant`);
  console.log(`  - Gemini Model: ${GEMINI_MODEL}`);
  console.log(
    `  - API Key: ${GEMINI_API_KEY ? "Configured" : "Not Set (Normalized Error Mode Active)"}`,
  );
});
