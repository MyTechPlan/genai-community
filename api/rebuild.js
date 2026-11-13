// Nightly safety net: rebuild the static site so chapters stay in sync with GenAI-ID.
// Vercel cron authenticates with CRON_SECRET; the deploy hook URL stays server-only.

import crypto from 'node:crypto';

const FETCH_TIMEOUT_MS = 10000;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = process.env.CRON_SECRET || '';
  const authorization = req.headers.authorization;
  if (!secret || typeof authorization !== 'string') {
    return res.status(401).json({ error: 'unauthorized' });
  }
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(authorization);
  if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const hookUrl = process.env.DEPLOY_HOOK_URL || '';
  if (!hookUrl) {
    console.error('[rebuild] failed', 500);
    return res.status(500).json({ error: 'Deploy hook not configured' });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(hookUrl, {
      method: 'POST',
      signal: controller.signal,
    });
    if (!response.ok) {
      console.error('[rebuild] failed', response.status);
      return res.status(502).json({ error: 'Deploy hook failed' });
    }
    console.info('[rebuild] triggered');
    return res.status(200).json({ ok: true });
  } catch {
    // Fetch errors can contain the secret hook URL; log only a fixed status.
    console.error('[rebuild] failed', 502);
    return res.status(502).json({ error: 'Deploy hook failed' });
  } finally {
    clearTimeout(timeout);
  }
}
