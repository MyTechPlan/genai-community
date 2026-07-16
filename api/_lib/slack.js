// Shared Slack helpers for the community welcome bot (api/slack-events.js).
// Kept dependency-free (no @slack/* SDK) — three small primitives over the Web API.

import crypto from 'node:crypto';

const SLACK_API = 'https://slack.com/api';
const FETCH_TIMEOUT_MS = 8000;

// Verify a request really came from Slack: HMAC-SHA256 over `v0:<ts>:<rawBody>` with the
// app Signing Secret, plus a 5-minute timestamp window to blunt replay attacks.
// Needs the EXACT raw request body (re-serialised JSON would not match the signature).
export function verifySlackSignature({ signingSecret, signature, timestamp, rawBody }) {
  if (!signingSecret || !signature || !timestamp) return false;
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > 60 * 5) return false; // stale / replayed

  const base = `v0:${timestamp}:${rawBody}`;
  const expected = 'v0=' + crypto.createHmac('sha256', signingSecret).update(base).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature));
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

// Escape user-supplied text for Slack mrkdwn. Turning `<`/`>`/`&` into entities also
// neutralises control sequences like <!channel>, <!here> and <@U…> so an applicant's
// intro can never ping the channel or fake a mention.
export function slackEscape(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export async function slackPostMessage({ token, channel, text, blocks }) {
  try {
    const response = await fetch(`${SLACK_API}/chat.postMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ channel, text, blocks, unfurl_links: false }),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    const data = await response.json().catch(() => null);
    if (!data || !data.ok) {
      console.error('Slack chat.postMessage failed:', (data && data.error) || 'no body');
      return { success: false, error: data && data.error };
    }
    return { success: true, ts: data.ts };
  } catch (error) {
    console.error('Slack chat.postMessage error:', error?.name === 'TimeoutError' ? 'timeout' : error);
    return { success: false };
  }
}

// Fallback path to the joiner's email if it isn't already on the team_join payload
// (needs the users:read.email scope on the bot token).
export async function slackGetUserEmail({ token, userId }) {
  try {
    const response = await fetch(`${SLACK_API}/users.info?user=${encodeURIComponent(userId)}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    const data = await response.json().catch(() => null);
    if (!data || !data.ok) {
      console.error('Slack users.info failed:', (data && data.error) || 'no body');
      return null;
    }
    return data.user?.profile?.email || null;
  } catch (error) {
    console.error('Slack users.info error:', error?.name === 'TimeoutError' ? 'timeout' : error);
    return null;
  }
}
