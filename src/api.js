export async function generate(description, signal) {
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), 20000); // 20s timeout

  const combinedSignal = signal
    ? anySignal([signal, timeoutController.signal])
    : timeoutController.signal;

  try {
    const res = await fetch("/api/generate", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tripDescription: description }),
      signal: combinedSignal,
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { error: data.error || 'Request failed' };
    }
    return res.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

// Merges multiple abort signals into one aborts if any of them abort.
function anySignal(signals) {
  const controller = new AbortController();
  signals.forEach((s) => {
    if (s.aborted) controller.abort();
    s.addEventListener('abort', () => controller.abort());
  });
  return controller.signal;
}