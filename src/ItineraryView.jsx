import { useState } from 'react';

export default function ItineraryView({ itinerary, onReorder, onRemoveStop }) {
  const [expandedDay, setExpandedDay] = useState(0);

  function moveDay(index, direction) {
    const newDays = [...itinerary.days];
    const target = index + direction;
    if (target < 0 || target >= newDays.length) return;
    [newDays[index], newDays[target]] = [newDays[target], newDays[index]];
    onReorder(newDays);
  }

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold text-slate-900">
        {itinerary.title}
      </h2>

      <div className="space-y-3">
        {itinerary.days.map((day, i) => {
          const isOpen = expandedDay === i;
          return (
            <div
              key={i}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              <button
                onClick={() => setExpandedDay(isOpen ? -1 : i)}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
              >
                <span className="font-medium text-slate-800">
                  Day {day.day}
                  <span className="ml-2 text-xs font-normal text-slate-400">
                    {day.stops.length} stop{day.stops.length !== 1 ? 's' : ''}
                  </span>
                </span>
                <span className="text-slate-400">{isOpen ? '−' : '+'}</span>
              </button>

              {isOpen && (
                <ul className="divide-y divide-slate-100 border-t border-slate-100">
                  {day.stops.length === 0 && (
                    <li className="px-4 py-3 text-sm text-slate-400">
                      No stops left for this day.
                    </li>
                  )}
                  {day.stops.map((stop, j) => (
                    <li
                      key={j}
                      className="flex items-start justify-between gap-3 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800">
                          {stop.name}
                          {stop.time && (
                            <span className="ml-2 text-xs font-normal text-indigo-500">
                              {stop.time}
                            </span>
                          )}
                        </p>
                        {stop.notes && (
                          <p className="mt-0.5 text-xs text-slate-500">
                            {stop.notes}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => onRemoveStop(i, j)}
                        className="shrink-0 rounded-md px-2 py-1 text-xs text-red-500 transition hover:bg-red-50"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex gap-2 border-t border-slate-100 px-4 py-2">
                <button
                  onClick={() => moveDay(i, -1)}
                  disabled={i === 0}
                  className="rounded-md px-2 py-1 text-xs text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  ↑ Move up
                </button>
                <button
                  onClick={() => moveDay(i, 1)}
                  disabled={i === itinerary.days.length - 1}
                  className="rounded-md px-2 py-1 text-xs text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  ↓ Move down
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}