import {z} from 'zod';

export const itinerarySchema = z.object({
  title: z.string(),
  days: z.array(
    z.object({
      day: z.number(),
      stops: z.array(
        z.object({
          name: z.string(),
          time: z.string().optional(),
          notes: z.string().optional(),
        })
      ),
    })
  ),
});

export function parseItinerary(rawText) {
  let json;
  try {
    json = JSON.parse(rawText);
  } catch {
    return { success: false, error: 'Model returned invalid JSON' };
  }

  const result = itinerarySchema.safeParse(json);
  if (!result.success) {
    return { success: false, error: 'Response did not match the expected shape' };
  }

  return { success: true, data: result.data };
}