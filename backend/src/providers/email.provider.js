const fs = require('fs');
const path = require('path');
const { getTransporter, FROM_ADDRESS } = require('../config/mailer');

const TEMPLATE_DIR = path.join(__dirname, '..', '..', 'templates', 'emails');

const loadTemplate = (name) => {
  const filePath = path.join(TEMPLATE_DIR, `${name}.html`);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf-8');
};

const interpolate = (template, vars) =>
  template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '');

const send = async ({ to, subject, template, vars = {}, html }) => {
  try {
    const transporter = getTransporter();
    let body = html;

    if (!body && template) {
      const raw = loadTemplate(template);
      body = raw ? interpolate(raw, vars) : `<p>${subject}</p>`;
    }

    const info = await transporter.sendMail({
      from: FROM_ADDRESS,
      to,
      subject,
      html: body,
    });

    return { ok: true, messageId: info.messageId };
  } catch (err) {
    console.error('[email] send failed:', err.message);
    return { ok: false, error: err.message };
  }
};

module.exports = { send };
