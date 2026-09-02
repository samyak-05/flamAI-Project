# Trip Planner

A small React app that takes a free-form trip description, sends it to an LLM, and turns the result into an interactive day-by-day itinerary — not a chatbot. The model returns structured JSON, which the app validates and renders as expandable, reorderable day cards.

**Live demo:** https://flamai-project.onrender.com/
(Note: hosted on Render's free tier — if inactive, the first request may take 20-50 seconds to wake up.)

## What it does

Type something like *"4 days in Mumbai visiting famous places and enjoying Maharashtrian food"* and the app generates an itinerary you can:
- Expand/collapse each day
- Reorder days (move up/down)
- Remove individual stops
- Retry if generation fails

## Setup

1. Clone the repo and install dependencies:
```bash
   npm install
```

2. Create a `.env.local` file in the project root with your Groq API key:
   (Get a free key at [console.groq.com](https://console.groq.com))

3. Build and run:
```bash
   npm start
```
   This builds the React app and starts the Express server, which serves both the frontend and the `/api/generate` route from one process.

4. Open `http://localhost:3000`

For active frontend development with hot-reload, `npm run dev` runs Vite alone at `http://localhost:5173` (note: the AI generation feature requires the Express server, so use `npm start` to test the full app).

## Usage

1. Describe a trip in the text box
2. Click **Generate Itinerary**
3. Expand a day to see its stops, use ↑/↓ to reorder days, or Remove to drop a stop
4. If generation fails, a **Try again** button appears — click it to retry the same request

## Stack

- **Frontend:** React (hooks, functional components) + Vite + Tailwind CSS
- **Backend:** Express server (`server.js`) that serves the built frontend and proxies AI requests, keeping the API key server-side only
- **AI:** Groq API (`openai/gpt-oss-120b`), using JSON mode (`response_format: json_object`) to constrain output to structured data
- **Validation:** Zod — every model response is parsed and validated against a strict schema before it's ever rendered

## AI usage note

I used AI (Claude) at various points when I got stuck, mainly for debugging and scaffolding. A few examples:

- Fixed a blank-screen bug caused by a component naming mismatch between the import and the file (`ItineraryView` vs `Itenary.jsx`)
- Fixed a mismatch between the field name the frontend sent (`description`) and what the backend expected (`tripDescription`), which was silently sending `undefined` to the model
- Fixed an unhandled error — a `req.body` destructure was outside the `try/catch`, turning a bad request into a raw 502 instead of a clean error response
- Fixed an Express 5 breaking change with the catch-all route syntax (`app.get('*', ...)` → `app.get('/*splat', ...)`)

I understand and can walk through every part of the code.

## How failure is handled

- **Malformed/invalid JSON** from the model → caught by Zod validation, shown as a clear error message, no crash
- **Wrong-shaped JSON** (valid JSON, unexpected structure) → same, caught by Zod's schema check
- **Empty response** from the model → backend returns a 502 with a clear error before it ever reaches the frontend
- **Network failure / server down** → caught in the frontend's try/catch, shown as an error state with a retry option
- **Slow/hanging requests** → a 20-second client-side timeout (via `AbortController`) aborts the request and shows "Request timed out"
- **Stale responses** → each request is tracked by identity; if a newer request starts before an older one resolves, the older one's result (success or error) is silently discarded, so a fast second submission can never be overwritten by a slower first one

## Known limitations

- The submit button is disabled while a request is loading, which prevents a user from triggering overlapping requests through the UI. The underlying stale-response guard logic still exists and was verified directly (by temporarily enabling the button) to correctly discard outdated responses — but under normal use, the UI itself prevents that scenario from arising.
- Retry re-sends the exact same prompt; there's no way to edit the description before retrying without dismissing the error first.
- The 20-second timeout is fixed and not user-configurable.
- No streaming — the full itinerary loads at once rather than appearing incrementally.
- No session persistence — refreshing the page loses the current itinerary.
- The model clusters stops by day based on its own approximate geographic knowledge, not real distance calculations — it can occasionally suggest days that mix nearby and far-apart locations, though the system prompt explicitly instructs it to group by proximity.
- Occasionally the model can produce longer itineraries than the token limit accounts for; `max_tokens` is set generously (2048) to reduce this, but very long trip descriptions could still risk truncation.
- Hosted on Render's free tier, which spins down after inactivity — the first request after idle time can take 20-50 seconds.

## Time spent

Roughly 7 hours across 5 sessions, spread over 4 days.