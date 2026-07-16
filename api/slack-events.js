// Slack Events endpoint for the community welcome bot.
// When someone joins the workspace (`team_join`), look up their application by email in
// the Google Sheet and post a personalised welcome to #new-members. No match → a warm
// generic welcome. See docs/slack-welcome-bot.md for the Slack app + env setup.

import { verifySlackSignature, slackEscape, slackPostMessage, slackGetUserEmail } from './_lib/slack.js';
import { lookupApplication } from './_lib/application-store.js';

const SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET || '';
const VERIFICATION_TOKEN = process.env.SLACK_VERIFICATION_TOKEN || ''; // legacy fallback verifier
const BOT_TOKEN = process.env.SLACK_BOT_TOKEN || '';
const WELCOME_CHANNEL = process.env.SLACK_WELCOME_CHANNEL || '';

// Best-effort dedupe of Slack's at-least-once retries within a warm instance.
const seenEvents = new Set();

// Read the exact raw request body. @vercel/node parses `req.body` lazily on first access,
// so consuming the stream first yields the untouched bytes the Slack signature is computed
// over. Falls back to re-serialising req.body if the stream was already drained (in which
// case signature verification will fail and we rely on the verification-token path).
async function readRawBody(req) {
  try {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    if (chunks.length) return Buffer.concat(chunks).toString('utf8');
  } catch {
    /* fall through */
  }
  if (req.body != null) return typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  return '';
}

function buildWelcome({ userId, application }) {
  const mention = `<@${userId}>`;

  if (!application) {
    return {
      text: 'A new member just joined GenAI Community!',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `:wave: *Welcome to GenAI Community, ${mention}!*\nGreat to have you here. Tell us who you are and what you're building with GenAI.`,
          },
        },
      ],
    };
  }

  const name = slackEscape(`${application.firstName || ''} ${application.lastName || ''}`.trim());
  const meta = [
    application.role,
    application.company,
    [application.city, application.country].filter(Boolean).join(', '),
  ]
    .map((x) => slackEscape(x))
    .filter(Boolean)
    .join('  ·  ');
  const intro = slackEscape(application.intro || '').slice(0, 1500);

  const blocks = [
    { type: 'section', text: { type: 'mrkdwn', text: `:wave: *Welcome to GenAI Community, ${mention}!*` } },
  ];
  const header = [name ? `*${name}* just joined` : '', meta].filter(Boolean).join('\n');
  if (header) blocks.push({ type: 'section', text: { type: 'mrkdwn', text: header } });
  if (intro) blocks.push({ type: 'section', text: { type: 'mrkdwn', text: `> ${intro.replace(/\n/g, '\n> ')}` } });

  const linkedin = application.linkedin && /^https?:\/\//i.test(application.linkedin) ? application.linkedin : null;
  if (linkedin) {
    blocks.push({
      type: 'actions',
      elements: [{ type: 'button', text: { type: 'plain_text', text: 'LinkedIn' }, url: linkedin }],
    });
  }
  blocks.push({ type: 'context', elements: [{ type: 'mrkdwn', text: 'Say hi and make them feel welcome :tada:' }] });

  return { text: `Welcome to GenAI Community, ${name || 'new member'}!`, blocks };
}

async function handleTeamJoin(event) {
  if (!BOT_TOKEN || !WELCOME_CHANNEL) {
    console.error('Slack welcome skipped: SLACK_BOT_TOKEN / SLACK_WELCOME_CHANNEL not configured');
    return;
  }
  const user = event.user || {};
  const userId = user.id;
  if (!userId) return;

  let email = user.profile?.email || null;
  if (!email) email = await slackGetUserEmail({ token: BOT_TOKEN, userId });

  let application = null;
  if (email) {
    const result = await lookupApplication(email);
    if (result.found) application = result.application;
  }

  const { text, blocks } = buildWelcome({ userId, application });
  await slackPostMessage({ token: BOT_TOKEN, channel: WELCOME_CHANNEL, text, blocks });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const rawBody = await readRawBody(req);
  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return res.status(400).json({ error: 'invalid body' });
  }

  // 1) URL verification handshake. No side effects, so echo the challenge without requiring
  //    a signature — this is what lets Slack verify the Request URL.
  if (payload.type === 'url_verification') {
    return res.status(200).json({ challenge: payload.challenge });
  }

  // 2) Authenticate the request: signing secret (preferred) OR the legacy verification token.
  const signatureOk = verifySlackSignature({
    signingSecret: SIGNING_SECRET,
    signature: req.headers['x-slack-signature'],
    timestamp: req.headers['x-slack-request-timestamp'],
    rawBody,
  });
  const tokenOk = Boolean(VERIFICATION_TOKEN) && payload.token === VERIFICATION_TOKEN;
  if (!signatureOk && !tokenOk) {
    console.warn('Slack request rejected: signature and verification token both failed');
    return res.status(401).json({ error: 'unauthorized' });
  }

  if (payload.type === 'event_callback') {
    const eventId = payload.event_id;
    if (eventId) {
      if (seenEvents.has(eventId)) return res.status(200).json({ ok: true });
      seenEvents.add(eventId);
      if (seenEvents.size > 1000) seenEvents.clear();
    }
    const event = payload.event || {};
    if (event.type === 'team_join') {
      try {
        await handleTeamJoin(event);
      } catch (error) {
        console.error('team_join handler error:', error);
      }
    }
    return res.status(200).json({ ok: true });
  }

  return res.status(200).json({ ok: true });
}
