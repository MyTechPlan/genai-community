# Community applications → Google Sheet

The `/join` form (`api/community-application.js`) writes each application to a Google Sheet
using a **Google Apps Script Web App webhook** — the same mechanism a Google Form uses to
write responses into its linked Sheet. No OAuth, no service account: the serverless function
just `POST`s JSON to a URL you deploy from the Sheet.

Persistence lives behind one swappable module (`api/_lib/application-store.js`). To migrate to
Twenty CRM / Notion / Airtable later, change only that file — the form and endpoint stay put.

Until `SHEETS_WEBHOOK_URL` is set, every application is emailed to `hello@` instead (via Resend),
so nothing is ever lost.

---

## 1. Create the Sheet

Create a Google Sheet in the team Drive, e.g. **"GenAI Community — Applications"**.

## 2. Add the Apps Script

In the Sheet: **Extensions → Apps Script**. Replace the default code with:

```javascript
// GenAI Community — /join application webhook.
// Appends one row per application to the "Applications" tab.
// STRONGLY RECOMMENDED: set SECRET below. The Web App is deployed to "Anyone", so with an
// empty SECRET anyone who discovers the /exec URL can write rows straight into the Sheet,
// bypassing the site's validation and reCAPTCHA. Set it to the same value as
// SHEETS_WEBHOOK_SECRET in Vercel.
const SECRET = '';
const SHEET_NAME = 'Applications';
const HEADERS = [
  'Submitted', 'First name', 'Last name', 'Email', 'LinkedIn', 'City', 'Country',
  'Role', 'Company', 'Experience', 'GenAI experience', 'Intro', 'Why join', 'Participation',
  'Newsletter', 'Code of Conduct', 'Source',
];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (SECRET && data.secret !== SECRET) {
      return json({ ok: false, error: 'unauthorized' });
    }
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
    sheet.appendRow([
      safe(data.submittedAt || new Date().toISOString()),
      safe(data.firstName), safe(data.lastName), safe(data.email), safe(data.linkedin),
      safe(data.city), safe(data.country), safe(data.role), safe(data.company),
      safe(data.experienceYears), safe(data.genaiExperience), safe(data.intro),
      safe(data.motivations), safe(data.participation), safe(data.newsletter),
      safe(data.codeOfConduct), safe(data.source),
    ]);
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

// Neutralise spreadsheet formula injection: a leading = + - @ makes Sheets evaluate the
// cell as a formula, so prefix those values with an apostrophe to force plain text.
function safe(value) {
  const s = value == null ? '' : String(value);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
```

> **Security:** because the Web App is deployed to **Anyone** (step 3), always set `SECRET` and
> the matching `SHEETS_WEBHOOK_SECRET` in Vercel (step 4) before going live — otherwise the `/exec`
> URL is an open write endpoint into your Sheet.

## 3. Deploy as a Web App

**Deploy → New deployment → Web app**.
- **Execute as:** Me
- **Who has access:** Anyone

Deploy and authorize the script (Google will warn it's unverified — it's your own script).
Copy the **Web app URL** (it ends in `/exec`).

## 4. Set the Vercel env vars

Project `genai-community` → **Settings → Environment Variables** (Production):

| Variable | Required | Value |
|---|---|---|
| `SHEETS_WEBHOOK_URL` | yes | the `/exec` Web app URL from step 3 |
| `SHEETS_WEBHOOK_SECRET` | **yes (production)** | same string as `SECRET` in the script — the Web App is public, so this is what actually blocks unauthorized writes to the Sheet |

Optional override:

| Variable | Default | Notes |
|---|---|---|
| `APPLICATIONS_TO_EMAIL` | `hello@genaicommunity.eu` | where the email fallback goes if the Sheet is unreachable |

Redeploy after adding the variables.

## 5. Test

Submit the form at `/join`. A new row should appear on the **Applications** tab within a second
or two. If it doesn't, check the Vercel function logs for `Sheets webhook error` and confirm the
Web App access is set to **Anyone**.

---

## Newsletter opt-in

Independent of the Sheet: if the applicant answers **Yes** to Q11, their email is added to Beehiiv
with double opt-in (`utm_campaign=community-application`) via the shared `api/_lib/beehiiv.js`
helper — the same subscriber pipeline as the site newsletter.

## Migrating to a CRM later (Twenty, Notion, …)

Swap the body of `saveApplication()` in `api/_lib/application-store.js` to POST to the CRM's API.
The record shape stays the same, so the form and endpoint don't change.
