import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { rateLimit, getIp } from './_rateLimit.js';
import { DAILY_TYPES, buildDailyPrompt, type DailyType } from './_dailyPrompts.js';
import { MED_SCAN_PROMPT } from './_medScanPrompt.js';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_QUERY_LENGTH = 200;
const MAX_IMAGE_B64_LENGTH = 10 * 1024 * 1024; // ~7.5 MB file

// Models tried in order — first success wins.
// Each uses a separate quota bucket; gemini-2.5-flash is the most capable and is
// the last resort for prompts the 2.0 models block or fail to format (e.g. the
// "improvise emergency care" scenarios, which trip 2.0's DANGEROUS_CONTENT filter).
// (The 2.0 models were shut down by Google; 2.5-flash is legacy with a tiny free quota.)
const MODEL_FALLBACK_CHAIN = [
  'gemini-3.8-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash',
];

// This proxy only serves app-authored medical-training prompts (clinical scenarios,
// first-aid improvisation, medication questions) — legitimate content that Gemini's
// default thresholds flag as DANGEROUS_CONTENT and silently block. Relax all four
// categories so generation never gets refused for describing injuries or treatment.
const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

async function callModel(
  apiKey: string,
  modelName: string,
  prompt: string,
  image?: { data: string; mimeType: string },
): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelName, safetySettings: SAFETY_SETTINGS });
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
          await new Promise((r) => setTimeout(r, 2_000));
          continue;
        }
        // Any failure (quota, safety block, model/server error) — fall through to
        // the next model in the chain rather than giving up on the whole request.
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

  // The prompt is always built here from a named task — free-form prompt text from
  // the caller is never accepted, so the endpoint can't be used as a general LLM proxy.
  const { task, type, today, query, image, model: preferredModel } = (req.body ?? {}) as {
    task?: unknown;
    type?: unknown;
    today?: unknown;
    query?: unknown;
    image?: { data?: unknown; mimeType?: unknown };
    model?: unknown;
  };

  let prompt: string;
  if (task === 'daily') {
    if (typeof type !== 'string' || !(DAILY_TYPES as readonly string[]).includes(type)) {
      return res.status(400).json({ error: 'invalid type' });
    }
    if (typeof today !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(today)) {
      return res.status(400).json({ error: 'invalid date' });
    }
    if (image !== undefined) {
      return res.status(400).json({ error: 'image not allowed for this task' });
    }
    prompt = buildDailyPrompt(type as DailyType, today);
  } else if (task === 'med_scan') {
    if (image === undefined) {
      if (typeof query !== 'string') {
        return res.status(400).json({ error: 'query or image is required' });
      }
      const cleanQuery = query.trim().replace(/[\r\n]+/g, ' ').slice(0, MAX_QUERY_LENGTH);
      if (!cleanQuery) {
        return res.status(400).json({ error: 'query or image is required' });
      }
      prompt = MED_SCAN_PROMPT + '\n\nהתרופה המבוקשת: ' + cleanQuery;
    } else {
      prompt = MED_SCAN_PROMPT;
    }
  } else {
    return res.status(400).json({ error: 'invalid task' });
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

  // When the caller specifies a preferred model, skip the fallback chain and use it directly.
  // This is used for complex prompts (e.g. clinical questions) where weaker models
  // reliably produce malformed JSON that passes the HTTP layer but fails client validation.
  const modelOverride = typeof preferredModel === 'string' && MODEL_FALLBACK_CHAIN.includes(preferredModel)
    ? preferredModel
    : null;

  try {
    const text = modelOverride
      ? await callModel(apiKey, modelOverride, prompt, imagePayload)
      : await generateWithFallback(apiKey, prompt, imagePayload);
    return res.status(200).json({ text });
  } catch (err) {
    const status = (err as { status?: number })?.status;
    if (status === 429) {
      return res.status(429).json({ error: 'Rate limit — retry shortly' });
    }
    return res.status(500).json({ error: 'Gemini API call failed' });
  }
}
