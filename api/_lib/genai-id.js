// GenAI-ID client for the Slack welcome bot.
//
// People can now join through the community signup inside GenAI-ID
// (id.genaicommunity.eu/<locale>/join) instead of this site's /join form, so they have no
// row in the applications Sheet. The bot asks ID for them with the community product key.
// `GENAI_ID_API_KEY` is server-only: never expose it in PUBLIC_ variables or client code.
//
// GET /api/v1/community/members?email= returns 200 with the member's welcome profile, or
// 404 when there is no active community membership for a verified email.

const API_URL = (process.env.GENAI_ID_API_URL || 'https://id.genaicommunity.eu/api/v1').replace(/\/+$/, '');
const API_KEY = process.env.GENAI_ID_API_KEY || '';
// ID answers from a single Frankfurt query; 10s is the budget agreed with the ID team.
const LOOKUP_TIMEOUT_MS = 10000;

export function hasGenaiId() {
  return Boolean(API_KEY);
}

// Returns { found: true, member: { name, chapter, role, intro, linkedin, introduce } },
// { found: false } on a clean 404, or { found: false, error: true } when ID could not be
// asked (not configured counts as a clean miss). Never throws.
export async function lookupCommunityMember(email) {
  if (!API_KEY || !email) return { found: false };

  try {
    const response = await fetch(`${API_URL}/community/members?email=${encodeURIComponent(email)}`, {
      headers: { Authorization: `Bearer ${API_KEY}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS),
    });
    if (response.status === 404) return { found: false };
    if (!response.ok) {
      console.error('GenAI-ID member lookup error:', response.status);
      return { found: false, error: true };
    }
    const data = await response.json().catch(() => null);
    if (!data || typeof data.name !== 'string') {
      console.error('GenAI-ID member lookup: unexpected body');
      return { found: false, error: true };
    }
    return { found: true, member: data };
  } catch (error) {
    console.error('GenAI-ID member lookup request error:', error?.name === 'TimeoutError' ? 'timeout' : error);
    return { found: false, error: true };
  }
}

// The member profile carries the chapter as a slug ("valencia"); the catalogue has its
// display name. Returns the English name, or null when it can't be fetched. Never throws.
export async function getChapterName(slug) {
  if (!API_KEY || !slug) return null;

  try {
    const response = await fetch(`${API_URL}/chapters/${encodeURIComponent(slug)}`, {
      headers: { Authorization: `Bearer ${API_KEY}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS),
    });
    if (!response.ok) return null;
    const data = await response.json().catch(() => null);
    return (data && data.name && typeof data.name.en === 'string' && data.name.en) || null;
  } catch {
    return null;
  }
}
