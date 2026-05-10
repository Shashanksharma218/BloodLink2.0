const nodemailer = require('nodemailer');

let cachedTransporter = null;

function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    throw new Error('GMAIL_USER and GMAIL_APP_PASSWORD must be set');
  }

  cachedTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });

  return cachedTransporter;
}

async function sendMail({ to, subject, html, text, attachments }) {
  const transporter = getTransporter();
  const from = process.env.MAIL_FROM || `BloodLink <${process.env.GMAIL_USER}>`;

  return transporter.sendMail({
    from,
    to,
    subject,
    html,
    text,
    attachments,
  });
}

module.exports = { sendMail, getTransporter };
