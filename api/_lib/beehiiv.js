// Shared Beehiiv subscription helper.
// Used by both the newsletter endpoint and the community-application endpoint so the
// double-opt-in behaviour (GDPR confirmation email) stays identical across forms.

const BEEHIIV_API_KEY = process.env.BEEHIIV_API_KEY;
const RAW_PUBLICATION_ID =
  process.env.BEEHIIV_PUBLICATION_KEY_V2 ||
  process.env.BEEHIIV_PUBLICATION_ID ||
  'pub_87fc77fb-cffd-4f30-8b8c-56db45a355c5';
// The endpoint expects the `pub_`-prefixed V2 id; tolerate a bare UUID in env.
const PUBLICATION_ID = RAW_PUBLICATION_ID.startsWith('pub_') ? RAW_PUBLICATION_ID : `pub_${RAW_PUBLICATION_ID}`;

const SITE = 'https://genaicommunity.eu';
const TIMEOUT_MS = 8000;

export function hasBeehiiv() {
  return Boolean(BEEHIIV_API_KEY);
}

// Adds (or reactivates) a subscriber in Beehiiv with a forced double opt-in.
// `campaign` sets utm_campaign so signups can be attributed to the form they came from.
export async function addToBeehiiv(email, { campaign = 'newsletter-form' } = {}) {
  try {
    const response = await fetch(`https://api.beehiiv.com/v2/publications/${PUBLICATION_ID}/subscriptions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${BEEHIIV_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        reactivate_existing: true,
        send_welcome_email: false,
        double_opt_override: 'on', // GDPR: force the confirmation ("double opt-in") email
        utm_source: 'genaicommunity.eu',
        utm_medium: 'website',
        utm_campaign: campaign,
        referring_site: SITE,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) {
      let detail = null;
      try { detail = await response.json(); } catch {}
      console.error('Beehiiv API error:', response.status, detail);
      return { success: false, status: response.status };
    }
    return { success: true };
  } catch (error) {
    console.error('Beehiiv request error:', error?.name === 'TimeoutError' ? 'timeout' : error);
    return { success: false };
  }
}
