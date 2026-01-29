# OpenAQ Dashboard

Small frontend project built to explore data-driven interfaces using the OpenAQ API. The goal is to demonstrate a clean React + TypeScript architecture, basic data visualization patterns, and a thoughtful approach to UX, error handling, and accessibility.

---

## Tech Stack

* **React + TypeScript** — Component-based UI with static typing for better maintainability and safer refactors.
* **Vite** — Fast development environment and build tooling.
* **Tailwind CSS** — Utility-first styling to quickly build consistent, responsive layouts.

---

## Architecture

### Pages / Components Separation

The application follows a simple but scalable structure:

* **Pages** (`/pages`) represent full views or screens (e.g. `Dashboard`).
* **Components** (`/components`) contain reusable UI and layout elements.

This separation keeps page-level logic (data fetching, orchestration) distinct from presentational concerns, making the codebase easier to reason about and extend.

---

### API Service Layer

All communication with the OpenAQ API is centralized in a dedicated **service layer** (`/services/openaq.ts`).

This layer is responsible for:

* Building request URLs
* Attaching required headers (API key)
* Handling HTTP errors consistently

By abstracting `fetch` calls away from components, the UI remains focused on rendering and state management, and the API logic can be reused or replaced more easily.

---

### Custom Hooks

Data fetching logic is encapsulated using custom hooks (or hook-like patterns inside pages).

This approach:

* Avoids duplicating async logic across components
* Keeps side effects predictable
* Makes loading and error states explicit and easy to test

---

## Key Decisions

### Why a Custom Hook / Centralized Fetch Logic

Instead of calling `fetch` directly inside JSX, data access is abstracted into a reusable function (and optionally a hook).

This decision was made to:

* Separate concerns (data vs UI)
* Improve readability of components
* Make future changes (caching, retries, pagination) easier to implement

---

### Handling Loading and Error States

The UI explicitly models three states:

* **Loading** — shown while requests are in progress
* **Error** — shown when a request fails
* **Empty / Success** — shown when data is available or no results are returned

This ensures the interface always provides feedback to the user and avoids empty or confusing screens, which is especially important in data-heavy applications.

---

## Trade-offs

### What Is Simplified

* State management relies on local React state instead of a dedicated library (e.g. React Query).
* Styling focuses on clarity and structure rather than advanced visual design.
* Accessibility is covered at a basic level (semantic HTML, labels, clear states) but not fully audited against WCAG standards.

---

### What Would Be Improved With More Time

* Introduce a data-fetching library (e.g. React Query) for caching and background updates.
* Add automated tests for components and API logic.
* Improve accessibility with keyboard navigation testing and screen reader audits.
* Expand the UI with charts or maps to better represent air quality data visually.
* Add filtering and pagination controls for larger datasets.

---

## Notes

This project is intentionally kept small and focused, prioritizing clarity of structure, decision-making, and communication over feature completeness.
