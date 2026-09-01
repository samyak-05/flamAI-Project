# Trip Planner

A small React app that takes a free-form trip description, sends it to an LLM, and turns the result into an interactive day-by-day itinerary — not a chatbot. The model returns structured JSON, which the app validates and renders as expandable, reorderable day cards.

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

2. Add your Groq API key as a Vercel environment variable (kept out of the codebase and the browser):
```bash
   vercel link
   vercel env add GROQ_API_KEY
```
   Select **Development** when prompted, and paste your key.

3. Run the app locally:
```bash
   vercel dev
```
   This serves both the React frontend and the `/api/generate` serverless function together — usually at `http://localhost:3000`.

## Usage

1. Describe a trip in the text box
2. Click **Generate Itinerary**
3. Expand a day to see its stops, use ↑/↓ to reorder days, or Remove to drop a stop
4. If generation fails, a **Try again** button appears — click it to retry the same request

## Stack

- **Frontend:** React (hooks, functional components) + Vite + Tailwind CSS
- **AI:** Groq API (`openai/gpt-oss-120b`), using JSON mode (`response_format: json_object`) to constrain output
- **Validation:** Zod — every model response is parsed and validated against a strict schema before it's ever rendered
- **Backend:** A Vercel serverless function (`api/generate.js`) that holds the API key and proxies the request, so the key never reaches the browser

## AI usage note

I used AI (Claude) at various points when I got stuck, mainly for debugging and scaffolding. A few examples:

- Fixed a blank-screen bug caused by a component naming mismatch between the import and the file (`ItineraryView` vs `Itenary.jsx`)
- Fixed a mismatch between the field name the frontend sent (`description`) and what the backend expected (`tripDescription`), which was silently sending `undefined` to the model
- Fixed an unhandled error — a `req.body` destructure was outside the `try/catch`, turning a bad request into a raw 502 instead of a clean error response
- Diagnosed a missing `GROQ_API_KEY` environment variable on Vercel by adding server-side error logging to see what was actually failing

I understand and can walk through every part of the code.

## How failure is handled

- **Malformed/invalid JSON** from the model → caught by Zod validation, shown as a clear error message, no crash
- **Wrong-shaped JSON** (valid JSON, unexpected structure) → same, caught by Zod's schema check
- **Empty response** from the model → backend returns a 502 with a clear error before it ever reaches the frontend
- **Network failure / killed server** → caught in the frontend's try/catch, shown as an error state
- **Slow/hanging requests** → a 20-second client-side timeout (via `AbortController`) aborts the request and shows "Request timed out"
- **Stale responses** → each request is tracked by identity; if a newer request starts before an older one resolves, the older one's result (success or error) is silently discarded, so a fast second submission can never be overwritten by a slower first one

## Known limitations

- The submit button is disabled while a request is loading, which prevents a user from triggering overlapping requests through the UI. The underlying stale-response guard logic still exists and was verified directly (by temporarily enabling the button) to correctly discard outdated responses — but under normal use, the UI itself prevents that scenario from arising.
- Retry re-sends the exact same prompt; there's no way to edit the description before retrying without dismissing the error first.
- The 20-second timeout is fixed and not user-configurable.
- No streaming — the full itinerary loads at once rather than appearing incrementally.
- No session persistence — refreshing the page loses the current itinerary.
- Occasionally the model can produce longer itineraries than the token limit accounts for; `max_tokens` is set generously (2048) to reduce this, but very long trip descriptions could still risk truncation.  