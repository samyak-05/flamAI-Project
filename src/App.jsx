import { useState, useRef } from 'react';
import { generate } from './api';
import { parseItinerary } from './schema';
import ItineraryView from './ItineraryView';

function App() {
  const [tripInput, setTripInput] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | error | success
  const [itinerary, setItinerary] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const abortRef = useRef(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!tripInput.trim()) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus('loading');
    setErrorMsg('');

    try {
      const { raw, error } = await generate(tripInput, controller.signal);

      if (error) {
        setStatus('error');
        setErrorMsg(error);
        return;
      }

      const parsed = parseItinerary(raw);
      if (!parsed.success) {
        setStatus('error');
        setErrorMsg(parsed.error);
        return;
      }

      setItinerary(parsed.data);
      setStatus('success');
    } catch (err) {
      if (err.name === 'AbortError') return;
      setStatus('error');
      setErrorMsg('Failed to reach the model. Please try again.');
    }
  }

  function handleReorder(newDays) {
    setItinerary({ ...itinerary, days: newDays });
  }

  function handleRemoveStop(dayIndex, stopIndex) {
    const newDays = [...itinerary.days];
    newDays[dayIndex] = {
      ...newDays[dayIndex],
      stops: newDays[dayIndex].stops.filter((_, i) => i !== stopIndex),
    };
    setItinerary({ ...itinerary, days: newDays });
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 md:px-10">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
            Trip Planner
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Describe a trip. Get a day-by-day plan you can rearrange.
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
        >
          <textarea
            value={tripInput}
            onChange={(e) => setTripInput(e.target.value)}
            placeholder="e.g. '3 days in Tokyo, love food and temples'"
            rows={3}
            className="w-full resize-none rounded-lg border border-slate-300 p-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="mt-3 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300 sm:w-auto"
          >
            {status === 'loading' ? 'Generating…' : 'Generate Itinerary'}
          </button>
        </form>

        <div className="mt-6">
          {status === 'idle' && (
            <p className="text-center text-sm text-slate-400">
              Enter a trip above to get started.
            </p>
          )}

          {status === 'loading' && (
            <div className="flex flex-col items-center gap-3 py-10">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
              <p className="text-sm text-slate-500">Generating your itinerary…</p>
            </div>
          )}

          {status === 'error' && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <p className="font-medium">Something went wrong</p>
              <p className="mt-1 text-red-600">{errorMsg}</p>
            </div>
          )}

          {status === 'success' && itinerary && (
            <ItineraryView
              itinerary={itinerary}
              onReorder={handleReorder}
              onRemoveStop={handleRemoveStop}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;