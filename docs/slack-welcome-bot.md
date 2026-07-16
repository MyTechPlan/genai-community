# Slack welcome bot

When someone joins the GenAI Community Slack workspace, a Slack app fires a `team_join`
event to `https://genaicommunity.eu/api/slack-events`. The endpoint looks up the new
member's application **by email** in the Google Sheet and posts a personalised welcome to
**#new-members**. No email match → a warm generic welcome (nothing breaks).

```
member joins Slack
  └─▶ team_join → api/slack-events.js
        ├─ verify Slack signature (SLACK_SIGNING_SECRET)
        ├─ email from event (or users.info) → lookup in the Sheet (Apps Script `lookup` action)
        └─ chat.postMessage to #new-members  (Block Kit, @mentions the member, LinkedIn button)
```

> **Caveat:** the match is by email. If a member joins Slack with a different email than the
> one on their application, we can't find their intro → generic welcome. The `/join` success
> screen nudges people to "join with the same email" to keep the match rate high.

---

## 1. Extend the Apps Script (adds the `lookup` action)

The bot reads the Sheet through the same Apps Script Web App. Open the Sheet →
**Extensions → Apps Script**, update the code from
[community-application-sheet.md](community-application-sheet.md) (it now contains a `doLookup`
function and an `action === 'lookup'` branch), then **Deploy → Manage deployments → ✏️ edit →
Version: New version → Deploy** (editing the code alone does nothing until you cut a new version).

No new env var: it reuses `SHEETS_WEBHOOK_URL` + `SHEETS_WEBHOOK_SECRET`.

## 2. Create / configure the Slack app

At <https://api.slack.com/apps> (app already created: **Botias**):

- **OAuth & Permissions → Bot Token Scopes**, add:
  - `chat:write` — post the welcome
  - `users:read` — required to subscribe to `team_join`
  - `users:read.email` — read the joiner's email to match the application
- **Install App** (or Reinstall after adding scopes) to the workspace, then copy the
  **Bot User OAuth Token** (`xoxb-…`).
- **Basic Information → App Credentials**, copy the **Signing Secret** (click *Show*).
- In Slack, invite the bot to the channel: open **#new-members** and type `/invite @Botias`.

## 3. Set the Vercel env vars (Production)

Project `genai-community` → **Settings → Environment Variables**:

| Variable | Value |
|---|---|
| `SLACK_BOT_TOKEN` | the `xoxb-…` Bot User OAuth Token |
| `SLACK_SIGNING_SECRET` | the app Signing Secret |
| `SLACK_WELCOME_CHANNEL` | `C0BHM57SF5Z` (the #new-members channel id) |

Optional: `SLACK_VERIFICATION_TOKEN` (legacy) — only a fallback verifier if signature
verification ever fails; the signing secret is the primary and preferred check.

Redeploy after setting them.

## 4. Point Slack at the endpoint (do this LAST)

Only after the endpoint is deployed (it must answer Slack's challenge):

- **Event Subscriptions → Enable Events → Request URL:**
  `https://genaicommunity.eu/api/slack-events`
  Slack POSTs a `url_verification` challenge; the endpoint echoes it → the field turns green.
- **Subscribe to bot events → Add Bot User Event → `team_join` → Save Changes.**
- If Slack asks to reinstall the app after adding the event, do it.

## 5. Test

- **Endpoint reachable:** `curl -sS -X POST https://genaicommunity.eu/api/slack-events -H 'Content-Type: application/json' -d '{"type":"url_verification","challenge":"abc123"}'` → returns `{"challenge":"abc123"}`.
- **Real welcome:** have someone join the workspace (or remove + re-add a test account) with an
  email that exists in the Sheet → a personalised welcome appears in **#new-members** within a
  couple of seconds. An unknown email → generic welcome.
- Check Vercel function logs for `team_join handler error` or `chat.postMessage failed` if nothing posts.
