import { getCorsOrigin, isProductionEnv, sanitizeInput, sendResendEmail, verifyRecaptcha } from './contact-security.js';

function sanitizeFields(rawData, fieldMap) {
  const data = {};

  for (const [key, settings] of Object.entries(fieldMap)) {
    const rawValue = rawData[key];
    if (rawValue === undefined || rawValue === null || rawValue === '') {
      data[key] = settings.defaultValue;
      continue;
    }

    data[key] = sanitizeInput(rawValue);
  }

  return data;
}

function validateRequiredFields(rawData, requiredFields) {
  for (const field of requiredFields) {
    if (!rawData[field] || typeof rawData[field] !== 'string') {
      return field;
    }
  }

  return null;
}

function validateMaxLengths(data, maxLengths) {
  for (const [field, maxLen] of Object.entries(maxLengths)) {
    if (data[field] && data[field].length > maxLen) {
      return { field, maxLen };
    }
  }

  return null;
}

function isValidEmail(email) {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
}

function setCorsHeaders(req, res, env) {
  const isProduction = isProductionEnv(env);
  const corsOrigin = getCorsOrigin(req, env);

  res.setHeader('Access-Control-Allow-Origin', corsOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (isProduction) {
    res.setHeader('Vary', 'Origin');
  }
}

function handleMethod(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return true;
  }

  return false;
}

async function verifyRequestRecaptcha(rawData, res, config, env) {
  const recaptchaToken = rawData.recaptchaToken;
  if (!recaptchaToken) {
    res.status(400).json({ error: 'reCAPTCHA token missing' });
    return false;
  }

  const recaptchaResult = await verifyRecaptcha(recaptchaToken, config.recaptchaAction, {
    env,
    lowScoreError: config.lowScoreError,
  });
  if (!recaptchaResult.success) {
    console.warn('reCAPTCHA failed:', recaptchaResult);
    res.status(403).json({ error: recaptchaResult.error || 'reCAPTCHA verification failed' });
    return false;
  }

  return true;
}

function validateSubmission(rawData, config) {
  const missingField = validateRequiredFields(rawData, config.requiredFields);
  if (missingField) {
    return { error: `Missing required field: ${missingField}` };
  }

  const data = sanitizeFields(rawData, config.fieldMap);
  const lengthViolation = validateMaxLengths(data, config.maxLengths);
  if (lengthViolation) {
    return { error: `${lengthViolation.field} exceeds maximum length of ${lengthViolation.maxLen}` };
  }

  if (!isValidEmail(data.email)) {
    return { error: 'Invalid email format' };
  }

  return { data };
}

function handleMissingResendConfig(res, config, isProduction) {
  if (isProduction) {
    console.error('RESEND_API_KEY not configured in production');
    res.status(500).json({ error: 'Server configuration error' });
    return;
  }

  console.log(config.devLogMessage);
  res.status(200).json({ success: true, message: config.devSuccessMessage });
}

export async function handleContactRequest(req, res, config) {
  const env = req.runtimeEnv || process.env;
  const isProduction = isProductionEnv(env);

  setCorsHeaders(req, res, env);
  if (handleMethod(req, res)) {
    return;
  }

  try {
    const rawData = req.body;
    const recaptchaVerified = await verifyRequestRecaptcha(rawData, res, config, env);
    if (!recaptchaVerified) {
      return;
    }

    const validation = validateSubmission(rawData, config);
    if (validation.error) {
      return res.status(400).json({ error: validation.error });
    }

    const resendApiKey = env.RESEND_API_KEY;
    if (!resendApiKey) {
      handleMissingResendConfig(res, config, isProduction);
      return;
    }

    const emailResult = await sendResendEmail(config.buildEmailPayload(validation.data, env), env);
    if (!emailResult.success) {
      return res.status(500).json({ error: emailResult.error });
    }

    return res.status(200).json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error(config.errorLogLabel, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
