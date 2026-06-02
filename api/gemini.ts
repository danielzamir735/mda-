import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_PROMPT_LENGTH = 20_000;
const MAX_IMAGE_B64_LENGTH = 10 * 1024 * 1024; // ~7.5 MB file

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Gemini API key not configured' });
  }

  const { prompt, image } = (req.body ?? {}) as {
    prompt?: unknown;
    image?: { data?: unknown; mimeType?: unknown };
  };

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'prompt is required' });
  }
  if (prompt.length > MAX_PROMPT_LENGTH) {
    return res.status(400).json({ error: 'prompt too long' });
  }

  // Validate image payload when present
  if (image !== undefined) {
    if (typeof image?.data !== 'string' || typeof image?.mimeType !== 'string') {
      return res.status(400).json({ error: 'invalid image payload' });
    }
    if (!ALLOWED_MIME_TYPES.has(image.mimeType)) {
      return res.status(400).json({ error: 'unsupported image type' });
    }
    if (image.data.length > MAX_IMAGE_B64_LENGTH) {
      return res.status(400).json({ error: 'image too large' });
    }
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    let result;
    if (image?.data && image?.mimeType) {
      result = await model.generateContent([
        prompt,
        { inlineData: { data: image.data as string, mimeType: image.mimeType as string } },
      ]);
    } else {
      result = await model.generateContent(prompt);
    }

    const text = result.response.text();
    return res.status(200).json({ text });
  } catch (err) {
    console.error('[api/gemini] error:', err);
    return res.status(500).json({ error: 'Gemini API call failed' });
  }
}
