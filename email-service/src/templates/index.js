const { layout, button, paragraph, heading, muted, dataTable, escape } = require('./layout');

function verifyEmail({ name, verifyUrl }) {
  const body = [
    heading('Confirm your email'),
    paragraph(`Hi ${escape(name || 'there')},`),
    paragraph('Welcome to BloodLink. To finish setting up your account, please confirm your email address by clicking the button below.'),
    button(verifyUrl, 'Verify email'),
    muted(`If the button doesn't work, copy and paste this link into your browser:<br><a href="${escape(verifyUrl)}" style="color:#dc2626;word-break:break-all;">${escape(verifyUrl)}</a>`),
    muted('This link expires in 24 hours.'),
  ].join('');

  return {
    subject: 'Confirm your BloodLink email',
    html: layout({ title: 'Confirm your email', preheader: 'Verify your email to activate your BloodLink account.', body }),
    text: `Hi ${name || 'there'},\n\nConfirm your email by visiting:\n${verifyUrl}\n\nThis link expires in 24 hours.`,
  };
}

function welcome({ name }) {
  const body = [
    heading('Welcome to BloodLink'),
    paragraph(`Hi ${escape(name || 'there')},`),
    paragraph('Your email is verified and your account is ready. You can now pledge to active blood requests, track your donations, and download donation certificates.'),
    paragraph('Every donation can save up to three lives. Thank you for being part of this.'),
  ].join('');

  return {
    subject: 'Welcome to BloodLink',
    html: layout({ title: 'Welcome', preheader: 'Your account is ready.', body }),
    text: `Hi ${name || 'there'},\n\nYour email is verified and your account is ready. Welcome to BloodLink.`,
  };
}

function loginAlert({ name, ip, userAgent, when }) {
  const body = [
    heading('New login to your account'),
    paragraph(`Hi ${escape(name || 'there')},`),
    paragraph('We noticed a new sign-in to your BloodLink account.'),
    dataTable([
      ['When', when || 'just now'],
      ['IP address', ip || 'unknown'],
      ['Device', userAgent || 'unknown'],
    ]),
    paragraph("If this was you, no action is needed. If you don't recognise it, change your password immediately."),
  ].join('');

  return {
    subject: 'New login to your BloodLink account',
    html: layout({ title: 'New login', preheader: 'Security notification.', body }),
    text: `New login on ${when || 'just now'} from IP ${ip || 'unknown'} (${userAgent || 'unknown'}). If this wasn't you, change your password.`,
  };
}

function passwordReset({ name, resetUrl }) {
  const body = [
    heading('Reset your password'),
    paragraph(`Hi ${escape(name || 'there')},`),
    paragraph('We received a request to reset the password on your BloodLink account. Click the button below to choose a new one.'),
    button(resetUrl, 'Reset password'),
    muted(`If the button doesn't work, copy and paste this link into your browser:<br><a href="${escape(resetUrl)}" style="color:#dc2626;word-break:break-all;">${escape(resetUrl)}</a>`),
    muted("This link expires in 1 hour. If you didn't request a reset, you can safely ignore this email."),
  ].join('');

  return {
    subject: 'Reset your BloodLink password',
    html: layout({ title: 'Reset your password', preheader: 'A password reset was requested.', body }),
    text: `Hi ${name || 'there'},\n\nReset your password by visiting:\n${resetUrl}\n\nThis link expires in 1 hour.`,
  };
}

function passwordChanged({ name, when }) {
  const body = [
    heading('Your password was changed'),
    paragraph(`Hi ${escape(name || 'there')},`),
    paragraph(`Your BloodLink account password was changed on ${escape(when || 'just now')}.`),
    paragraph("If you made this change, no action is needed. If you didn't, please reset your password immediately and contact support."),
  ].join('');

  return {
    subject: 'Your BloodLink password was changed',
    html: layout({ title: 'Password changed', preheader: 'Security notification.', body }),
    text: `Your BloodLink password was changed on ${when || 'just now'}. If this wasn't you, reset your password immediately.`,
  };
}

function donationCertificate({ name, certificate, verifyUrl }) {
  const body = [
    heading('Thank you for your donation'),
    paragraph(`Hi ${escape(name || 'there')},`),
    paragraph(`Your blood donation has been verified by ${escape(certificate.hospitalName || 'the hospital')}. Your official BloodLink certificate is attached to this email as a PDF.`),
    dataTable([
      ['Certificate #', certificate.certificateNumber],
      ['Donation type', String(certificate.donationType || '').replace('_', ' ')],
      ['Units', String(certificate.units || 1)],
      ['Donated on', certificate.donatedAtLabel],
      ['Hospital', certificate.hospitalName || ''],
    ]),
    paragraph(`Anyone can verify the authenticity of this certificate at:<br><a href="${escape(verifyUrl)}" style="color:#dc2626;">${escape(verifyUrl)}</a>`),
    paragraph('You may have just saved a life. Thank you.'),
  ].join('');

  return {
    subject: `Your BloodLink donation certificate (#${certificate.certificateNumber})`,
    html: layout({ title: 'Donation certificate', preheader: 'Your donation certificate is attached.', body }),
    text: `Hi ${name || 'there'},\n\nYour donation has been verified. Certificate #${certificate.certificateNumber} is attached as a PDF.\n\nVerify it at: ${verifyUrl}`,
  };
}

module.exports = {
  verifyEmail,
  welcome,
  loginAlert,
  passwordReset,
  passwordChanged,
  donationCertificate,
};
