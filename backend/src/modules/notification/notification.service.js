const emailProvider = require('../../providers/email.provider');
const User = require('../../models/User');

const send = async ({ to, subject, template, vars }) => {
  const result = await emailProvider.send({ to, subject, template, vars });
  if (!result.ok) {
    console.error(`[notification] failed to send "${template}" to ${to}: ${result.error}`);
  }
  return result;
};

// ── Request lifecycle ──────────────────────────────────────────────────────────

const requestVerified = async (request) => {
  // Notify the seeker
  await request.populate('requester', 'name email').catch(() => {});
  const seeker = request.requester;
  if (seeker?.email) {
    await send({
      to: seeker.email,
      subject: 'Your blood request has been verified',
      template: 'request-verified',
      vars: {
        seekerName: seeker.name,
        patientName: request.patientName,
        bloodGroup: request.bloodGroup,
        urgency: request.urgency,
      },
    });
  }
};

const requestRejected = async (request) => {
  await request.populate('requester', 'name email').catch(() => {});
  const seeker = request.requester;
  if (seeker?.email) {
    await send({
      to: seeker.email,
      subject: 'Update on your blood request',
      template: 'request-rejected',
      vars: {
        seekerName: seeker.name,
        patientName: request.patientName,
        reason: request.rejectedReason,
      },
    });
  }
};

const requestExpiredOrCancelled = async (request, pledgedDonors) => {
  for (const donor of pledgedDonors) {
    if (donor.email) {
      await send({
        to: donor.email,
        subject: 'Blood request no longer active',
        template: 'request-expired',
        vars: { donorName: donor.name, patientName: request.patientName },
      });
    }
  }
};

// ── Pledge lifecycle ───────────────────────────────────────────────────────────

const pledgeCreated = async (pledge, seeker, hospital) => {
  if (seeker?.email) {
    await send({
      to: seeker.email,
      subject: 'A donor has accepted your blood request',
      template: 'pledge-created',
      vars: { seekerName: seeker.name, patientName: pledge.request?.patientName || '' },
    });
  }
};

const pledgeCancelled = async (pledge, seeker) => {
  if (seeker?.email) {
    await send({
      to: seeker.email,
      subject: 'A donor has cancelled their pledge',
      template: 'pledge-cancelled',
      vars: { seekerName: seeker.name },
    });
  }
};

// ── Donation lifecycle ─────────────────────────────────────────────────────────

const donationVerified = async (donation, donor, certificateDownloadUrl) => {
  if (donor?.email) {
    await send({
      to: donor.email,
      subject: 'Thank you! Your donation has been verified',
      template: 'donation-verified',
      vars: {
        donorName: donor.name,
        donationType: donation.donationType,
        downloadUrl: certificateDownloadUrl,
      },
    });
  }
};

module.exports = {
  requestVerified,
  requestRejected,
  requestExpiredOrCancelled,
  pledgeCreated,
  pledgeCancelled,
  donationVerified,
};
