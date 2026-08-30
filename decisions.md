# Key Architectural Decisions

### 1. Using `localStorage` for a Mock Backend
We simulated a real REST API by wrapping `localStorage` in asynchronous promises. This allowed us to thoroughly test database persistence and network latency without requiring a separate backend server.

### 2. Abstracting API Logic with `useMockApi`
We centralized all loading states, error handling, and `try/catch` blocks into a single custom hook. This drastically reduced boilerplate and kept our UI components focused purely on rendering.

### 3. Choosing `react-hook-form` Over Controlled Inputs
Standard React forms using `useState` trigger heavy re-renders on every single keystroke. `react-hook-form` leverages uncontrolled inputs for perfectly smooth typing performance, plus robust built-in validation.

### 4. Normalizing Timezones to UTC with `date-fns`
Native browser date handling frequently causes cross-timezone bugs. We used `date-fns` to reliably intercept local times and convert them into strict ISO 8601 UTC strings, guaranteeing flawless scheduling regardless of user location.

### 5. Mocking JWT Authentication
We simulated real authentication by generating and storing mock JSON Web Tokens (JWTs). This lets our frontend manage secure user sessions and roles exactly like a production application would.
