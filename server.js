import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: '.env.local' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/generate', async (req, res) => {
  try {
    const { tripDescription } = req.body;
    if (!tripDescription) {
      return res.status(400).json({ error: 'Missing trip description' });
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
  that are far apart on the same day.
- If the user asks for a mix of nearby and distant places, dedicate separate
  days to each cluster.
- Order stops within a day in a sensible travel sequence.
- Use realistic travel times between stops.`;

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
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      console.error('GROQ API ERROR:', response.status, await response.text());
      return res.status(502).json({ error: 'Model provider returned an error' });
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content;
    if (!rawContent) {
      return res.status(502).json({ error: 'Empty response from model' });
    }

    res.json({ raw: rawContent });
  } catch (err) {
    console.error('GENERATE ERROR:', err);
    res.status(500).json({ error: 'Failed to reach model' });
  }
});

app.use(express.static(path.join(__dirname, 'dist')));
app.get('/*splat', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));