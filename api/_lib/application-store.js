// Swappable persistence for community membership applications.
//
// Current backend: append a row to a Google Sheet via a Google Apps Script Web App
// webhook — the exact mechanism a Google Form uses to write responses into its linked
// Sheet. Set `SHEETS_WEBHOOK_URL` (the deployed Web App /exec URL) in Vercel; optionally
// set `SHEETS_WEBHOOK_SECRET` and check it inside the Apps Script to reject junk POSTs.
//
// To migrate later (e.g. to Twenty CRM, Notion, Airtable), swap ONLY this module — the
// endpoint's `saveApplication(record)` contract stays the same.
//
// See docs/community-application-sheet.md for the Apps Script and setup steps.

import { isProductionEnv } from './contact-security.js';

const SHEETS_WEBHOOK_URL = process.env.SHEETS_WEBHOOK_URL || '';
const SHEETS_WEBHOOK_SECRET = process.env.SHEETS_WEBHOOK_SECRET || '';
const TIMEOUT_MS = 8000;

export function hasApplicationStore() {
  return Boolean(SHEETS_WEBHOOK_URL);
}

// Persists one application record. Returns { success, skipped?, status? }.
// `skipped: true` means no store is configured (caller should fall back to email).
export async function saveApplication(record, env = process.env) {
  if (!SHEETS_WEBHOOK_URL) {
    if (!isProductionEnv(env)) {
      console.log('SHEETS_WEBHOOK_URL not configured — skipping sheet append (dev mode)');
    } else {
      console.error('SHEETS_WEBHOOK_URL not configured in production');
    }
    return { success: false, skipped: true };
  }

  try {
    const body = SHEETS_WEBHOOK_SECRET ? { ...record, secret: SHEETS_WEBHOOK_SECRET } : record;
    const response = await fetch(SHEETS_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      // Apps Script Web Apps 302-redirect the POST to script.googleusercontent.com;
      // fetch follows redirects by default so we reach the script's real response.
      redirect: 'follow',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) {
      console.error('Sheets webhook error:', response.status);
      return { success: false, status: response.status };
    }
    // Apps Script returns HTTP 200 even for its OWN handled errors (secret mismatch,
    // caught exceptions) and for Google's login/interstitial HTML on a stale deployment
    // URL — so the JSON body, not the status, is the real signal. Require { ok: true }
    // before treating the row as written, otherwise the caller falls back to email.
    const data = await response.json().catch(() => null);
    if (!data || data.ok !== true) {
      console.error('Sheets webhook rejected:', (data && data.error) || 'non-ok body');
      return { success: false, status: response.status };
    }
    return { success: true };
  } catch (error) {
    console.error('Sheets webhook request error:', error?.name === 'TimeoutError' ? 'timeout' : error);
    return { success: false };
  }
}
