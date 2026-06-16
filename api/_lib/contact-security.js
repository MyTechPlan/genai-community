// Shared security helpers for the form API endpoints.
// Mirrors the My Tech Plan (site-blog) setup: reCAPTCHA Enterprise assessment + Resend email.

const ALLOWED_ORIGINS = [
  'https://genaicommunity.eu',
  'https://www.genaicommunity.eu',
];

// reCAPTCHA Enterprise — reused from the My Tech Plan GCP project.
// Override via env if a dedicated key is provisioned for genaicommunity.eu.
const RECAPTCHA_PROJECT_ID = process.env.RECAPTCHA_PROJECT_ID || 'my-tech-plan-1674492903312';
const RECAPTCHA_SITE_KEY = process.env.PUBLIC_RECAPTCHA_SITE_KEY || '6Lfjpl4sAAAAACd0hm3dgKL3rTA22WQi8uwYdAzX';
const RECAPTCHA_SCORE_THRESHOLD = 0.5;
const EXTERNAL_FETCH_TIMEOUT_MS = 8000;

export function isProductionEnv(env = process.env) {
  return env.VERCEL_ENV === 'production';
}

export function getCorsOrigin(req, env = process.env) {
  if (!isProductionEnv(env)) {
    return '*';
  }

  const origin = req.headers.origin || '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    return origin;
  }

  // Allow Vercel preview/production aliases for this project.
  if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin)) {
    return origin;
  }

  return ALLOWED_ORIGINS[0];
}

export function sanitizeInput(input) {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

function getTimeoutSignal(timeoutMs = EXTERNAL_FETCH_TIMEOUT_MS) {
  return AbortSignal.timeout(timeoutMs);
}

function isTimeoutError(error) {
  return error?.name === 'TimeoutError';
}

function logExternalError(label, error) {
  if (isTimeoutError(error)) {
    console.error(`${label} timeout:`, error);
    return;
  }

  console.error(`${label} error:`, error);
}

async function readJsonSafely(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function verifyRecaptcha(
  token,
  action,
  { env = process.env, lowScoreError = 'reCAPTCHA score too low - suspected bot' } = {}
) {
  const apiKey = env.RECAPTCHA_API_KEY;

  if (!apiKey) {
    if (isProductionEnv(env)) {
      console.error('RECAPTCHA_API_KEY not configured in production');
      return { success: false, error: 'Server configuration error' };
    }

    console.warn('RECAPTCHA_API_KEY not configured — skipping verification (dev mode)');
    return { success: true };
  }

  try {
    const response = await fetch(
      `https://recaptchaenterprise.googleapis.com/v1/projects/${RECAPTCHA_PROJECT_ID}/assessments?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: {
            token,
            expectedAction: action,
            siteKey: RECAPTCHA_SITE_KEY,
          },
        }),
        signal: getTimeoutSignal(),
      }
    );

    if (!response.ok) {
      const errorData = await readJsonSafely(response);
      console.error('reCAPTCHA API error:', errorData);
      return { success: false, error: 'reCAPTCHA verification failed' };
    }

    const data = await readJsonSafely(response);
    const score = data?.riskAnalysis?.score ?? 0;
    const tokenValid = data?.tokenProperties?.valid ?? false;
    const actionMatch = data?.tokenProperties?.action === action;

    if (!isProductionEnv(env)) {
      console.log('reCAPTCHA assessment:', { score, tokenValid, actionMatch, action: data?.tokenProperties?.action });
    }

    if (!tokenValid) {
      return { success: false, score, error: 'Invalid reCAPTCHA token' };
    }

    if (!actionMatch) {
      return { success: false, score, error: 'reCAPTCHA action mismatch' };
    }

    if (score < RECAPTCHA_SCORE_THRESHOLD) {
      return { success: false, score, error: lowScoreError };
    }

    return { success: true, score };
  } catch (error) {
    logExternalError('reCAPTCHA verification', error);
    return { success: false, error: 'reCAPTCHA verification error' };
  }
}

export async function sendResendEmail(payload, env = process.env) {
  const resendApiKey = env.RESEND_API_KEY;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: getTimeoutSignal(),
    });

    if (!response.ok) {
      const errorData = await readJsonSafely(response);
      console.error('Resend API error:', errorData);
      return { success: false, error: 'Failed to send email' };
    }

    return { success: true };
  } catch (error) {
    logExternalError('Resend API', error);
    return { success: false, error: 'Failed to send email' };
  }
}
