const express = require('express');
const { sendMail } = require('./transporter');
const templates = require('./templates');
const { generateCertificatePdf } = require('./certificate');
const { requireSecret } = require('./auth');

const router = express.Router();
router.use(requireSecret);

function bad(res, msg) {
  return res.status(400).json({ message: msg });
}

router.post('/send/verify-email', async (req, res, next) => {
  try {
    const { to, name, verifyUrl } = req.body || {};
    if (!to || !verifyUrl) return bad(res, 'to and verifyUrl required');
    const tpl = templates.verifyEmail({ name, verifyUrl });
    await sendMail({ to, ...tpl });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

router.post('/send/welcome', async (req, res, next) => {
  try {
    const { to, name } = req.body || {};
    if (!to) return bad(res, 'to required');
    const tpl = templates.welcome({ name });
    await sendMail({ to, ...tpl });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

router.post('/send/login-alert', async (req, res, next) => {
  try {
    const { to, name, ip, userAgent, when } = req.body || {};
    if (!to) return bad(res, 'to required');
    const tpl = templates.loginAlert({ name, ip, userAgent, when });
    await sendMail({ to, ...tpl });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

router.post('/send/password-reset', async (req, res, next) => {
  try {
    const { to, name, resetUrl } = req.body || {};
    if (!to || !resetUrl) return bad(res, 'to and resetUrl required');
    const tpl = templates.passwordReset({ name, resetUrl });
    await sendMail({ to, ...tpl });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

router.post('/send/password-changed', async (req, res, next) => {
  try {
    const { to, name, when } = req.body || {};
    if (!to) return bad(res, 'to required');
    const tpl = templates.passwordChanged({ name, when });
    await sendMail({ to, ...tpl });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

router.post('/send/donation-certificate', async (req, res, next) => {
  try {
    const { to, name, certificate } = req.body || {};
    if (!to || !certificate || !certificate.certificateNumber || !certificate.verificationId) {
      return bad(res, 'to and certificate{certificateNumber, verificationId, ...} required');
    }

    const appBase = (process.env.APP_PUBLIC_URL || '').replace(/\/$/, '');
    const verifyUrl = `${appBase}/verify/${certificate.verificationId}`;

    const pdfBuffer = await generateCertificatePdf({
      ...certificate,
      verifyUrl,
    });

    const tpl = templates.donationCertificate({ name, certificate, verifyUrl });

    await sendMail({
      to,
      ...tpl,
      attachments: [
        {
          filename: `BloodLink-Certificate-${certificate.certificateNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    res.json({
      ok: true,
      pdfBase64: pdfBuffer.toString('base64'),
    });
  } catch (err) { next(err); }
});

module.exports = router;
