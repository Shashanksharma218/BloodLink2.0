const axios = require('axios');

const TIMEOUT_MS = 10000;

function client() {
  const baseURL = process.env.EMAIL_SERVICE_URL;
  const secret = process.env.EMAIL_SERVICE_SECRET;

  if (!baseURL || !secret) {
    throw new Error('EMAIL_SERVICE_URL and EMAIL_SERVICE_SECRET must be set');
  }

  return axios.create({
    baseURL,
    timeout: TIMEOUT_MS,
    headers: { Authorization: `Bearer ${secret}` },
  });
}

// Fire-and-forget wrappers — log on failure but never throw,
// so a transient email outage can't break the request flow.
async function safePost(path, payload) {
  try {
    return await client().post(path, payload);
  } catch (err) {
    const status = err.response?.status;
    const message = err.response?.data?.message || err.message;
    console.error(`[email-client] ${path} failed (${status || 'network'}):`, message);
    return null;
  }
}

const sendVerifyEmail = (payload) => safePost('/send/verify-email', payload);
const sendWelcome = (payload) => safePost('/send/welcome', payload);
const sendLoginAlert = (payload) => safePost('/send/login-alert', payload);
const sendPasswordReset = (payload) => safePost('/send/password-reset', payload);
const sendPasswordChanged = (payload) => safePost('/send/password-changed', payload);

// Certificate is the one call we want the actual response from
// (so we can persist the PDF). It still doesn't throw on failure.
async function sendDonationCertificate(payload) {
  try {
    const res = await client().post('/send/donation-certificate', payload);
    return res.data;
  } catch (err) {
    const status = err.response?.status;
    const message = err.response?.data?.message || err.message;
    console.error(`[email-client] /send/donation-certificate failed (${status || 'network'}):`, message);
    return null;
  }
}

module.exports = {
  sendVerifyEmail,
  sendWelcome,
  sendLoginAlert,
  sendPasswordReset,
  sendPasswordChanged,
  sendDonationCertificate,
};
