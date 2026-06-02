import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
    image?: { data?: string; mimeType?: string };
  };

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'prompt is required' });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    let result;
    if (image?.data && image?.mimeType) {
      result = await model.generateContent([
        prompt,
        { inlineData: { data: image.data, mimeType: image.mimeType } },
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
