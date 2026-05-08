const nodemailer = require('nodemailer');

let _transporter = null;

const getTransporter = () => {
  if (_transporter) return _transporter;

  _transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return _transporter;
};

const FROM_ADDRESS = process.env.MAIL_FROM || 'BloodLink <noreply@bloodlink.app>';

module.exports = { getTransporter, FROM_ADDRESS };
