// /go/<slug> (rewritten here by vercel.json): count the scan, then 302 to the destination.
// The count is one log line without personal data, plus a Vercel Analytics custom event.
// No cookies are set and no IP or user agent is logged.

import { track } from '@vercel/analytics/server';
import { resolveGoLink } from './_lib/go-links.js';

const TRACK_TIMEOUT_MS = 1500;

function firstValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

async function trackScan(slug, headers) {
  let timer;
  try {
    await Promise.race([
      track('go_scan', { slug }, { headers }),
      new Promise((resolve) => {
        timer = setTimeout(resolve, TRACK_TIMEOUT_MS);
      }),
    ]);
  } catch {
    // Analytics is best effort; the log line is the count of record.
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { slug, location } = resolveGoLink(firstValue(req.query?.slug));

  if (slug) {
    console.log(`[go] ${slug}`);
    if (req.method === 'GET') await trackScan(slug, req.headers);
  } else {
    console.log('[go] unknown');
  }

  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Location', location);
  return res.status(302).end();
}
