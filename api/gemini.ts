import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { rateLimit, getIp } from './_rateLimit.js';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_PROMPT_LENGTH = 20_000;
const MAX_IMAGE_B64_LENGTH = 10 * 1024 * 1024; // ~7.5 MB file

// Models tried in order — first success wins.
// gemini-2.0-flash-lite uses a separate quota bucket from gemini-2.0-flash.
const MODEL_FALLBACK_CHAIN = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
];

async function callModel(
  apiKey: string,
  modelName: string,
  prompt: string,
  image?: { data: string; mimeType: string },
): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelName });
  let result;
  if (image) {
    result = await model.generateContent([
      prompt,
      { inlineData: { data: image.data, mimeType: image.mimeType } },
    ]);
  } else {
    result = await model.generateContent(prompt);
  }
  return result.response.text();
}

async function generateWithFallback(
  apiKey: string,
  prompt: string,
  image?: { data: string; mimeType: string },
): Promise<string> {
  let lastErr: unknown;
  for (const modelName of MODEL_FALLBACK_CHAIN) {
    // Try once, if 429 wait 8s and retry same model (handles RPM limit), then move on
    for (let attempt = 0; attempt <= 1; attempt++) {
      try {
        return await callModel(apiKey, modelName, prompt, image);
      } catch (err) {
        const status = (err as { status?: number })?.status;
        console.error(`[api/gemini] ${modelName} attempt ${attempt + 1} error (status=${status}):`, (err as Error).message);
        lastErr = err;
        if (status === 429 && attempt === 0) {
          // RPM window — wait and retry same model before giving up on it
          await new Promise((r) => setTimeout(r, 8_000));
          continue;
        }
        // Non-quota error or second 429 attempt — try next model
        if (status !== 429 && status !== 503) throw err;
        break;
      }
    }
  }
  throw lastErr;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 20 requests per minute per IP
  const ip = getIp(req.headers as Record<string, string | string[] | undefined>);
  if (!rateLimit(ip, 20, 60_000)) {
    return res.status(429).json({ error: 'Too many requests — try again in a minute' });
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

  let imagePayload: { data: string; mimeType: string } | undefined;
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
    imagePayload = { data: image.data, mimeType: image.mimeType };
  }

  try {
    const text = await generateWithFallback(apiKey, prompt, imagePayload);
    return res.status(200).json({ text });
  } catch (err) {
    const status = (err as { status?: number })?.status;
    if (status === 429) {
      return res.status(429).json({ error: 'Rate limit — retry shortly' });
    }
    return res.status(500).json({ error: 'Gemini API call failed' });
  }
}
