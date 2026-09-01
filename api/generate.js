export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }


  const systemPrompt = `You are a trip planning assistant. Given a trip description,
return ONLY valid JSON matching this exact shape, no markdown, no extra text:
{
  "title": "string",
  "days": [
    { "day": 1, "stops": [ { "name": "string", "time": "string", "notes": "string" } ] }
  ]
}

Important planning rules:
- Group stops within each day by geographic proximity. Do not mix places 
  that are far apart (e.g. different directions from the base city) on the 
  same day.
- If the user asks for a mix of nearby and distant places, dedicate separate 
  days to each cluster rather than combining them.
- Order stops within a day in a sensible travel sequence (e.g. by proximity 
  or logical route), not randomly.
- Use realistic travel times between stops when assigning times.`;

  try {
    const { tripDescription } = req.body;
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: tripDescription },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content;

    if (!rawContent) {
      return res.status(502).json({ error: 'Empty response from model' });
    }

    return res.status(200).json({ raw: rawContent });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to reach model' });
  }
}