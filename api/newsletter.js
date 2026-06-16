import { handleContactRequest } from './_lib/contact-request.js';

const FROM_EMAIL = process.env.CONTACT_FROM_EMAIL || 'GenAI Community EU <noreply@mytechplan.com>';
const TO_EMAIL = process.env.NEWSLETTER_TO_EMAIL || process.env.CONTACT_TO_EMAIL || 'community@genaicommunity.eu';

const MAX_LENGTHS = {
  email: 254,
};

export default function handler(req, res) {
  return handleContactRequest(req, res, {
    recaptchaAction: 'newsletter_submit',
    requiredFields: ['email'],
    fieldMap: {
      email: { defaultValue: undefined },
    },
    maxLengths: MAX_LENGTHS,
    devLogMessage: 'Newsletter signup received (dev mode — email not configured)',
    devSuccessMessage: 'Subscribed (email not configured — dev mode)',
    errorLogLabel: 'Newsletter form error:',
    buildEmailPayload(data) {
      return {
        from: FROM_EMAIL,
        to: [TO_EMAIL],
        reply_to: data.email,
        subject: `New newsletter signup: ${data.email}`,
        html: `
          <h2>New newsletter signup — GenAI Community EU</h2>
          <p style="font-size: 16px;"><strong>Email:</strong> <a href="mailto:${data.email}">${data.email}</a></p>
          <p style="color:#666;">Add this address to your newsletter provider.</p>
        `,
      };
    },
  });
}
