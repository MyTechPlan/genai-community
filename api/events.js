// Community events (Eventbrite) for the site's carousel: upcoming, then the last year's.
// Public, read-only.
// Cached at the edge for an hour, so Eventbrite is hit at most once an hour per region
// and a newly published event shows up (or a finished one turns grey) within the hour.

import { getEvents } from './_lib/eventbrite.js';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { source, events } = await getEvents();
  // An empty result is cached briefly, so a transient Eventbrite failure heals quickly.
  res.setHeader(
    'Cache-Control',
    events.length ? 'public, s-maxage=3600, stale-while-revalidate=86400' : 'public, s-maxage=300',
  );
  return res.status(200).json({ source, events });
}
