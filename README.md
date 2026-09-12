# Medical Appointment Booking

A fast, simple React application for booking medical appointments. It features a Patient Portal for booking slots and an AI Assistant, plus a Staff Dashboard for managing schedules.

The app uses a mock REST API backend powered by `json-server` (`db.json`), running concurrently with Vite.

## Quick Start

1. Install dependencies:

   ```bash
   npm install
   ```

2. Seed baseline database (staff user, doctors, schedules):

   ```bash
   npm run seed
   ```

3. Start the application (Vite frontend + JSON server):

   ```bash
   npm run dev
   ```

4. Open your browser to `http://localhost:5173`.

## Tech Stack

- React 19 + Vite
- Tailwind CSS v4
- React Hook Form
- date-fns
- JSON Server (Mock REST API)
