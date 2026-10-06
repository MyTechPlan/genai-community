// The community's Eventbrite events, normalised for the site's carousel: upcoming ones first
// (soonest first), then those held in the last year (most recent first, flagged `past`).
// Two sources, same output shape:
//   1. The official API (v3), when EVENTBRITE_PRIVATE_TOKEN is set. The supported path, and
//      the only one that returns past events.
//   2. The organizer's public page, which embeds its upcoming events as JSON. Used before a
//      token exists and whenever the API call fails, so the carousel degrades instead of
//      emptying. It is not a contract: if Eventbrite changes that page this returns [].

export const ORGANIZER_ID = '121448467666';
// The "My Tech Plan" organization that owns that organizer, alongside others (Hackathon
// Spain, My Tech Plan). Its events endpoint is the one that supports time filters and
// returns completed events, so we query it and keep only the GenAI Community organizer's.
const ORGANIZATION_ID = '496825391523';
const PAST_WINDOW_DAYS = 365;
const PAST_LIMIT = 8;
export const ORGANIZER_URL = `https://www.eventbrite.es/o/genai-community-${ORGANIZER_ID}`;
const API = 'https://www.eventbriteapi.com/v3';
const TIMEOUT_MS = 8000;

// Only ever hand the browser links and images on Eventbrite's own hosts.
const isEventbriteUrl = (u) => /^https:\/\/(www\.)?eventbrite\.[a-z.]+\//i.test(u || '');
const isEventbriteImage = (u) => /^https:\/\/(img\.evbuc\.com|cdn\.evbuc\.com)\//i.test(u || '');

function normalise({ id, name, url, start, timezone, image, venue, city, online, past = false }) {
  if (!id || !name || !isEventbriteUrl(url) || !start) return null;
  return {
    id: String(id),
    name: String(name).slice(0, 200),
    url,
    start: String(start).replace(' ', 'T').slice(0, 16), // local wall-clock time, YYYY-MM-DDTHH:mm
    timezone: timezone || '',
    image: isEventbriteImage(image) ? image : '',
    venue: venue ? String(venue).slice(0, 120) : '',
    city: city ? String(city).slice(0, 80) : '',
    online: Boolean(online),
    past: Boolean(past),
  };
}

async function listOrganizationEvents(token, params) {
  const events = [];
  let continuation = '';
  for (let page = 0; page < 4; page++) {
    const query = new URLSearchParams({ ...params, expand: 'venue', page_size: '50' });
    if (continuation) query.set('continuation', continuation);
    const response = await fetch(`${API}/organizations/${ORGANIZATION_ID}/events/?${query}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`Eventbrite API ${response.status}`);
    const data = await response.json();
    events.push(...(data.events || []));
    if (!data.pagination?.has_more_items) break;
    continuation = data.pagination.continuation;
  }
  return events.filter((e) => String(e.organizer_id) === ORGANIZER_ID && e.listed !== false);
}

const fromApiEvent = (e, past) =>
  normalise({
    id: e.id,
    name: e.name?.text,
    url: e.url,
    start: e.start?.local,
    timezone: e.start?.timezone,
    image: e.logo?.original?.url || e.logo?.url,
    venue: e.venue?.name,
    city: e.venue?.address?.city,
    online: e.online_event,
    past,
  });

async function fromApi(token) {
  const since = new Date(Date.now() - PAST_WINDOW_DAYS * 86400000).toISOString().slice(0, 10);
  const [upcoming, past] = await Promise.all([
    listOrganizationEvents(token, { time_filter: 'current_future', status: 'live', order_by: 'start_asc' }),
    listOrganizationEvents(token, { time_filter: 'past', status: 'completed', order_by: 'start_desc' }),
  ]);
  const byStart = (a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0);
  return [
    ...upcoming.map((e) => fromApiEvent(e, false)).filter(Boolean).sort(byStart),
    ...past
      .map((e) => fromApiEvent(e, true))
      .filter((e) => e && e.start >= since)
      .sort((a, b) => byStart(b, a))
      .slice(0, PAST_LIMIT),
  ];
}

async function fromPublicPage() {
  const response = await fetch(ORGANIZER_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GenAICommunityEU/1.0; +https://www.genaicommunity.eu)' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Eventbrite page ${response.status}`);
  const html = await response.text();
  const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!match) throw new Error('Eventbrite page: no embedded data');
  const events = JSON.parse(match[1])?.props?.pageProps?.upcomingEvents || [];
  return events
    .filter((e) => !e.is_cancelled && !e.hide_start_date)
    .map((e) =>
      normalise({
        id: e.id,
        name: e.name,
        url: e.url,
        start: `${e.start_date} ${e.start_time}`,
        timezone: e.timezone,
        image: e.image?.url,
        venue: e.primary_venue?.name,
        city: e.primary_venue?.address?.city,
        online: e.is_online_event,
      }),
    );
}

// Never throws. `source` says which path produced the list ('api', 'page' or 'none').
export async function getEvents(env = process.env) {
  const token = env.EVENTBRITE_PRIVATE_TOKEN || '';
  if (token) {
    try {
      return { source: 'api', events: await fromApi(token) };
    } catch (error) {
      console.error('Eventbrite API failed, falling back to the public page:', error?.message || error);
    }
  }
  try {
    const events = (await fromPublicPage()).filter(Boolean);
    return { source: 'page', events: events.sort((a, b) => (a.start < b.start ? -1 : 1)) };
  } catch (error) {
    console.error('Eventbrite public page failed:', error?.message || error);
    return { source: 'none', events: [] };
  }
}
