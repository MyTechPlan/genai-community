import { getCorsOrigin, isProductionEnv, sanitizeInput, sendResendEmail, verifyRecaptcha } from './_lib/contact-security.js';
import { addToBeehiiv, hasBeehiiv } from './_lib/beehiiv.js';
import { saveApplication, hasApplicationStore } from './_lib/application-store.js';

// Community membership application ("/join").
// 1) verify reCAPTCHA  2) validate the ✅ required fields from the form spec
// 3) persist to the swappable store (Google Sheet webhook)  4) newsletter opt-in → Beehiiv
// 5) if persistence isn't available/failed, email hello@ so an application is never lost.

const FROM_EMAIL = process.env.CONTACT_FROM_EMAIL || 'GenAI Community EU <noreply@genaicommunity.eu>';
const TO_EMAIL =
  process.env.APPLICATIONS_TO_EMAIL || process.env.CONTACT_TO_EMAIL || 'hello@genaicommunity.eu';

const MAX = { name: 80, email: 254, url: 200, city: 80, country: 80, company: 120, choice: 120 };
const MAX_MULTI = 12;
const NEWSLETTER_VALUES = new Set(['yes', 'no']);

function isValidEmail(email) {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
}

// Trim + length-cap only. Values are stored raw (the Sheet/CRM is plain text); HTML
// escaping happens at the email-render step via esc() so entities never leak into storage.
function trimStr(value, max) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

function cleanArray(value, maxItems, maxLen) {
  let arr = value;
  if (!Array.isArray(arr)) arr = typeof arr === 'string' && arr ? [arr] : [];
  return arr
    .filter((x) => typeof x === 'string' && x.trim())
    .slice(0, maxItems)
    .map((x) => trimStr(x, maxLen));
}

// HTML-escape for the email fallback (the only place a value is rendered as HTML).
function esc(value) {
  return sanitizeInput(String(value == null ? '' : value));
}

function truthy(value) {
  return value === true || value === 'true' || value === 'on' || value === 'yes' || value === '1';
}

function applicationEmailPayload(record) {
  const row = (label, value) => `
    <tr>
      <td style="padding:8px 10px;border-bottom:1px solid #eee;font-weight:bold;width:190px;vertical-align:top;">${label}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #eee;">${value || '—'}</td>
    </tr>`;
  return {
    from: FROM_EMAIL,
    to: [TO_EMAIL],
    reply_to: record.email,
    subject: `New community application: ${record.firstName} ${record.lastName} (${record.city}, ${record.country})`,
    html: `
      <h2>New community application — GenAI Community EU</h2>
      <table style="border-collapse:collapse;width:100%;max-width:640px;">
        ${row('Name', `${esc(record.firstName)} ${esc(record.lastName)}`)}
        ${row('Email', `<a href="mailto:${esc(record.email)}">${esc(record.email)}</a>`)}
        ${row('LinkedIn', esc(record.linkedin))}
        ${row('Based in', `${esc(record.city)}, ${esc(record.country)}`)}
        ${row('Role', esc(record.role))}
        ${row('Company', esc(record.company))}
        ${row('Experience', esc(record.experienceYears))}
        ${row('GenAI experience', esc(record.genaiExperience))}
        ${row('Why join', esc(record.motivations))}
        ${row('Participation', esc(record.participation))}
        ${row('Newsletter', esc(record.newsletter))}
        ${row('Code of Conduct', esc(record.codeOfConduct))}
        ${row('Submitted', esc(record.submittedAt))}
      </table>
      <p style="color:#888;font-size:13px;">⚠️ The application store was unavailable, so this is an email fallback. Please copy it into the tracking Sheet manually.</p>
    `,
  };
}

export default async function handler(req, res) {
  const env = process.env;
  const isProduction = isProductionEnv(env);

  res.setHeader('Access-Control-Allow-Origin', getCorsOrigin(req, env));
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (isProduction) res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const raw = req.body || {};

    if (!raw.recaptchaToken) {
      return res.status(400).json({ error: 'reCAPTCHA token missing' });
    }
    const recaptcha = await verifyRecaptcha(raw.recaptchaToken, 'community_submit', { env });
    if (!recaptcha.success) {
      console.warn('reCAPTCHA failed:', recaptcha);
      return res.status(403).json({ error: recaptcha.error || 'reCAPTCHA verification failed' });
    }

    const firstName = trimStr(raw.firstName, MAX.name);
    const lastName = trimStr(raw.lastName, MAX.name);
    const email = trimStr(raw.email, MAX.email);
    const linkedin = trimStr(raw.linkedin, MAX.url);
    const city = trimStr(raw.city, MAX.city);
    const country = trimStr(raw.country, MAX.country);
    const role = trimStr(raw.role, MAX.choice);
    const company = trimStr(raw.company, MAX.company);
    const experienceYears = trimStr(raw.experienceYears, MAX.choice);
    const genaiExperience = trimStr(raw.genaiExperience, MAX.choice);
    const motivations = cleanArray(raw.motivations, MAX_MULTI, MAX.choice);
    const participation = cleanArray(raw.participation, MAX_MULTI, MAX.choice);
    const newsletter = trimStr(raw.newsletter, 8).toLowerCase();
    const codeOfConduct = truthy(raw.codeOfConduct);

    // Required-field validation mirrors the ✅ fields in the form spec.
    const missing = [];
    if (!firstName) missing.push('firstName');
    if (!lastName) missing.push('lastName');
    if (!email || email.length > MAX.email || !isValidEmail(email)) missing.push('email');
    if (!city) missing.push('city');
    if (!country) missing.push('country');
    if (!role) missing.push('role');
    if (!experienceYears) missing.push('experienceYears');
    if (!genaiExperience) missing.push('genaiExperience');
    if (!motivations.length) missing.push('motivations');
    if (!participation.length) missing.push('participation');
    if (!NEWSLETTER_VALUES.has(newsletter)) missing.push('newsletter');
    if (!codeOfConduct) missing.push('codeOfConduct');
    if (missing.length) {
      return res.status(400).json({ error: `Missing or invalid fields: ${missing.join(', ')}` });
    }

    const record = {
      submittedAt: new Date().toISOString(),
      firstName,
      lastName,
      email,
      linkedin,
      city,
      country,
      role,
      company,
      experienceYears,
      genaiExperience,
      motivations: motivations.join('; '),
      participation: participation.join('; '),
      newsletter,
      codeOfConduct: 'yes',
      source: 'genaicommunity.eu/join',
    };

    // 1) Persist to the swappable store, and 2) opt into Beehiiv (double opt-in) — these
    //    are independent, so run them concurrently to keep the request off the critical path.
    const [stored] = await Promise.all([
      hasApplicationStore() ? saveApplication(record, env) : Promise.resolve({ success: false, skipped: true }),
      newsletter === 'yes' && hasBeehiiv()
        ? addToBeehiiv(email, { campaign: 'community-application' })
        : Promise.resolve(null),
    ]);

    // 3) If we couldn't persist (no store configured, or the webhook failed), email hello@
    //    so an application is never lost.
    if (!stored.success) {
      if (env.RESEND_API_KEY) {
        const emailResult = await sendResendEmail(applicationEmailPayload(record), env);
        if (emailResult.success) {
          return res.status(200).json({ success: true, via: 'email-fallback' });
        }
      }
      if (!isProduction && stored.skipped) {
        console.log('Community application (dev mode — no store/email configured):', record);
        return res.status(200).json({ success: true, via: 'dev' });
      }
      return res.status(500).json({ error: 'Could not save your application. Please try again.' });
    }

    return res.status(200).json({ success: true, via: 'sheets' });
  } catch (error) {
    console.error('Community application handler error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
