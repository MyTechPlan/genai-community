import { getCorsOrigin, isProductionEnv, sanitizeInput, sendResendEmail, verifyRecaptcha } from './_lib/contact-security.js';
import { addToBeehiiv, hasBeehiiv } from './_lib/beehiiv.js';

// Primary: add the subscriber to Beehiiv (the subscriber source of truth + sending platform).
// Fallback: if Beehiiv errors, email a notification to hello@ so the signup is never lost.
const FROM_EMAIL = process.env.CONTACT_FROM_EMAIL || 'GenAI Community EU <noreply@genaicommunity.eu>';
const TO_EMAIL = process.env.NEWSLETTER_TO_EMAIL || process.env.CONTACT_TO_EMAIL || 'hello@genaicommunity.eu';

function isValidEmail(email) {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
}

function fallbackEmailPayload(email) {
  return {
    from: FROM_EMAIL,
    to: [TO_EMAIL],
    reply_to: email,
    subject: `New newsletter signup (Beehiiv add failed): ${email}`,
    html: `
      <h2>New newsletter signup — GenAI Community EU</h2>
      <p style="font-size:16px;"><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
      <p style="color:#b00020;">⚠️ The Beehiiv API add failed — please add this contact manually in Beehiiv.</p>
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
    const recaptcha = await verifyRecaptcha(raw.recaptchaToken, 'newsletter_submit', { env });
    if (!recaptcha.success) {
      console.warn('reCAPTCHA failed:', recaptcha);
      return res.status(403).json({ error: recaptcha.error || 'reCAPTCHA verification failed' });
    }

    const email = raw.email ? sanitizeInput(raw.email) : '';
    if (!email || email.length > 254 || !isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Primary path: Beehiiv
    if (hasBeehiiv()) {
      const bee = await addToBeehiiv(email, { campaign: 'newsletter-form' });
      if (bee.success) {
        return res.status(200).json({ success: true, via: 'beehiiv' });
      }
      // fall through to the email fallback below
    } else if (!isProduction) {
      console.log('BEEHIIV_API_KEY not configured — skipping (dev mode)');
      return res.status(200).json({ success: true, via: 'dev' });
    } else {
      console.error('BEEHIIV_API_KEY not configured in production');
    }

    // Fallback path: don't lose the signup
    if (env.RESEND_API_KEY) {
      const emailResult = await sendResendEmail(fallbackEmailPayload(email), env);
      if (emailResult.success) {
        return res.status(200).json({ success: true, via: 'email-fallback' });
      }
    }

    return res.status(500).json({ error: 'Could not register subscription' });
  } catch (error) {
    console.error('Newsletter handler error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
