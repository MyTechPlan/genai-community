import { handleContactRequest } from './_lib/contact-request.js';

const FROM_EMAIL = process.env.CONTACT_FROM_EMAIL || 'GenAI Community EU <noreply@genaisummit.eu>';
const TO_EMAIL = process.env.SPONSOR_TO_EMAIL || process.env.CONTACT_TO_EMAIL || 'hello@genaicommunity.eu';

const MAX_LENGTHS = {
  name: 120,
  company: 200,
  role: 100,
  email: 254,
  phone: 30,
  interest: 80,
  message: 5000,
};

export default function handler(req, res) {
  return handleContactRequest(req, res, {
    recaptchaAction: 'sponsor_submit',
    requiredFields: ['name', 'company', 'role', 'email'],
    fieldMap: {
      name: { defaultValue: undefined },
      company: { defaultValue: undefined },
      role: { defaultValue: undefined },
      email: { defaultValue: undefined },
      phone: { defaultValue: undefined },
      interest: { defaultValue: 'Something else' },
      message: { defaultValue: undefined },
    },
    maxLengths: MAX_LENGTHS,
    devLogMessage: 'Sponsor form submission received (dev mode — email not configured)',
    devSuccessMessage: 'Form received (email not configured — dev mode)',
    errorLogLabel: 'Sponsor form error:',
    buildEmailPayload(data) {
      return {
        from: FROM_EMAIL,
        to: [TO_EMAIL],
        reply_to: data.email,
        subject: `New sponsor enquiry: ${data.name} - ${data.company}`,
        html: `
          <h2>New sponsor / partnership enquiry — GenAI Community EU</h2>
          <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; width: 150px;">Name:</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.name}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Company:</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.company}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Role:</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.role}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Email:</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;"><a href="mailto:${data.email}">${data.email}</a></td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Phone:</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.phone || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Interested in:</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.interest}</td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold; vertical-align: top;">Message:</td>
              <td style="padding: 10px; white-space: pre-wrap;">${data.message || 'N/A'}</td>
            </tr>
          </table>
        `,
      };
    },
  });
}
