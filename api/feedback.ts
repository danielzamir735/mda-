import type { VercelRequest, VercelResponse } from '@vercel/node';
import { rateLimit, getIp } from './_rateLimit.js';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 3 requests per hour per IP
  const ip = getIp(req.headers as Record<string, string | string[] | undefined>);
  if (!rateLimit(ip, 3, 60 * 60_000)) {
    return res.status(429).json({ error: 'Too many requests — try again later' });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return res.status(500).json({ error: 'Email service not configured' });
  }

  const feedbackEmail = process.env.FEEDBACK_EMAIL;
  if (!feedbackEmail) {
    return res.status(500).json({ error: 'Feedback recipient not configured' });
  }

  const { message } = (req.body ?? {}) as { message?: unknown };
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }
  if (message.length > 2000) {
    return res.status(400).json({ error: 'Message too long' });
  }

  const safeMessage = escapeHtml(message.trim());

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: feedbackEmail,
        subject: 'פידבק חדש מחובש+',
        html: `<p>${safeMessage}</p>`,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Resend error status:', response.status, 'body:', err);
      return res.status(500).json({ error: 'Failed to send email', detail: err });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
