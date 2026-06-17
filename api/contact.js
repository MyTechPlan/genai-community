import { handleContactRequest } from './_lib/contact-request.js';

// Sender uses the Resend-verified genaicommunity.eu domain (own brand).
const FROM_EMAIL = process.env.CONTACT_FROM_EMAIL || 'GenAI Community EU <noreply@genaicommunity.eu>';
const TO_EMAIL = process.env.CONTACT_TO_EMAIL || 'hello@genaicommunity.eu';

const MAX_LENGTHS = {
  name: 120,
  email: 254,
  reason: 80,
  message: 5000,
};

export default function handler(req, res) {
  return handleContactRequest(req, res, {
    recaptchaAction: 'contact_submit',
    requiredFields: ['name', 'email', 'message'],
    fieldMap: {
      name: { defaultValue: undefined },
      email: { defaultValue: undefined },
      reason: { defaultValue: 'General question' },
      message: { defaultValue: undefined },
    },
    maxLengths: MAX_LENGTHS,
    devLogMessage: 'Contact form submission received (dev mode — email not configured)',
    devSuccessMessage: 'Form received (email not configured — dev mode)',
    errorLogLabel: 'Contact form error:',
    buildEmailPayload(data) {
      return {
        from: FROM_EMAIL,
        to: [TO_EMAIL],
        reply_to: data.email,
        subject: `New contact (${data.reason}): ${data.name}`,
        html: `
          <h2>New contact message — GenAI Community EU</h2>
          <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; width: 150px;">Name:</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.name}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Email:</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;"><a href="mailto:${data.email}">${data.email}</a></td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Reason:</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.reason}</td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold; vertical-align: top;">Message:</td>
              <td style="padding: 10px; white-space: pre-wrap;">${data.message}</td>
            </tr>
          </table>
        `,
      };
    },
  });
}
