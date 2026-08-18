import { getCorsOrigin, isProductionEnv, sanitizeInput, sendResendEmail, verifyRecaptcha } from './_lib/contact-security.js';
import { addToBeehiiv, hasBeehiiv } from './_lib/beehiiv.js';
import { saveApplication, hasApplicationStore } from './_lib/application-store.js';
import { waitUntil } from '@vercel/functions';

// Community membership application ("/join").
// 1) verify reCAPTCHA  2) validate the ✅ required fields from the form spec
// 3) persist to the swappable store (Google Sheet webhook)  4) newsletter opt-in → Beehiiv
// 5) if persistence isn't available/failed, email hello@ so an application is never lost.

const FROM_EMAIL = process.env.CONTACT_FROM_EMAIL || 'GenAI Community EU <noreply@genaicommunity.eu>';
const TO_EMAIL =
  process.env.APPLICATIONS_TO_EMAIL || process.env.CONTACT_TO_EMAIL || 'hello@genaicommunity.eu';

const MAX = { name: 80, email: 254, url: 200, city: 80, country: 80, company: 120, choice: 120, intro: 1200 };
const MAX_MULTI = 12;
const NEWSLETTER_VALUES = new Set(['yes', 'no']);

// Closed option sets — must mirror the choices in src/pages/join.astro. Validating the
// fixed-choice fields against these keeps a direct API caller from contaminating the
// Sheet/CRM with arbitrary values (note: en-dashes match the form's option labels).
const ROLE_VALUES = new Set([
  'Founder / CEO', 'CTO / Tech Lead / Engineering Manager', 'AI / ML / Data',
  'Software Engineering', 'Product / Innovation / Strategy', 'Consultant / Advisor',
  'Research / Academia', 'Other',
]);
const EXPERIENCE_VALUES = new Set([
  'Less than 3 years', '3–5 years', '6–10 years', '11–15 years', '15+ years',
]);
const GENAI_VALUES = new Set([
  'Exploring / learning', 'Using GenAI tools in my daily work',
  'Building prototypes or internal tools', 'Working with GenAI in production',
  'Leading GenAI strategy, adoption or teams',
]);
const MOTIVATION_VALUES = new Set([
  'Learn from senior practitioners', 'Connect with other GenAI professionals',
  'Discover real use cases', 'Share knowledge and experience', 'Attend local meetups',
  'Join the European GenAI network', 'Explore collaboration opportunities',
]);
const PARTICIPATION_VALUES = new Set([
  'Attend on-site meetups in my city', 'Join Slack discussions',
  'Network with other GenAI professionals', 'Connect with the European GenAI community',
  'Share insights, resources or use cases', 'Find clients, job opportunities or collaborations',
  'Get inspired and keep learning', "I'm not sure yet",
]);

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
        ${row('Intro', esc(record.intro))}
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
    // Do NOT truncate the email — trimming to MAX.email would defeat the length check
    // below and could persist/subscribe a mangled address. Validate the raw trimmed value.
    const email = typeof raw.email === 'string' ? raw.email.trim() : '';
    const linkedin = trimStr(raw.linkedin, MAX.url);
    const city = trimStr(raw.city, MAX.city);
    const country = trimStr(raw.country, MAX.country);
    const role = trimStr(raw.role, MAX.choice);
    const company = trimStr(raw.company, MAX.company);
    const experienceYears = trimStr(raw.experienceYears, MAX.choice);
    const genaiExperience = trimStr(raw.genaiExperience, MAX.choice);
    const intro = trimStr(raw.intro, MAX.intro);
    // Drop any array entries that aren't in the closed option set (keeps junk out of the
    // store); an all-unknown array then fails the non-empty check below.
    const motivations = cleanArray(raw.motivations, MAX_MULTI, MAX.choice).filter((v) => MOTIVATION_VALUES.has(v));
    const participation = cleanArray(raw.participation, MAX_MULTI, MAX.choice).filter((v) => PARTICIPATION_VALUES.has(v));
    const newsletter = trimStr(raw.newsletter, 8).toLowerCase();
    const codeOfConduct = truthy(raw.codeOfConduct);

    // Required-field validation mirrors the ✅ fields in the form spec; fixed-choice
    // fields must also be one of their allowed values.
    const missing = [];
    if (!firstName) missing.push('firstName');
    if (!lastName) missing.push('lastName');
    if (!email || email.length > MAX.email || !isValidEmail(email)) missing.push('email');
    if (!city) missing.push('city');
    if (!country) missing.push('country');
    if (!ROLE_VALUES.has(role)) missing.push('role');
    if (!EXPERIENCE_VALUES.has(experienceYears)) missing.push('experienceYears');
    if (!GENAI_VALUES.has(genaiExperience)) missing.push('genaiExperience');
    if (!intro) missing.push('intro');
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
      intro,
      motivations: motivations.join('; '),
      participation: participation.join('; '),
      newsletter,
      codeOfConduct: 'yes',
      source: 'genaicommunity.eu/join',
    };

    // The applicant is not made to wait on our back office. Everything they need (the
    // Slack invite on the success screen) is already decided by this point, so the Sheet
    // write, the newsletter opt-in and the email fallback all run after the response.
    //
    // This is what stops a slow Sheet from surfacing as a form error. Google's appendRow
    // contends for the spreadsheet lock, so a save that usually takes ~2s can run far
    // longer while someone is editing the sheet. We used to abort, show an error and
    // invite a retry that wrote the applicant to a second row, all for a row that had
    // in fact been saved.
    const persist = (async () => {
      try {
        const [stored] = await Promise.all([
          hasApplicationStore() ? saveApplication(record, env) : Promise.resolve({ success: false, skipped: true }),
          newsletter === 'yes' && hasBeehiiv()
            ? addToBeehiiv(email, { campaign: 'community-application' })
            : Promise.resolve(null),
        ]);

        if (stored.success) return;

        // Couldn't persist: email hello@ so an application is never lost.
        if (env.RESEND_API_KEY) {
          const emailResult = await sendResendEmail(applicationEmailPayload(record), env);
          if (emailResult.success) return;
        }

        // Redacted: never log applicant PII (name/email/LinkedIn/employer).
        console.error('Community application not persisted and fallback email failed', {
          submittedAt: record.submittedAt,
          source: record.source,
          storeSkipped: Boolean(stored.skipped),
        });
      } catch (error) {
        console.error('Community application persistence error:', error);
      }
    })();

    // waitUntil keeps the invocation alive for the background work. Outside Vercel
    // (local dev) there is no request context, so fall back to awaiting it inline.
    try {
      waitUntil(persist);
    } catch {
      await persist;
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Community application handler error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
