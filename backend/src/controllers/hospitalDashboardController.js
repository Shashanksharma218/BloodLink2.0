const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises');
const crypto = require('crypto');
const Request = require('../models/Request');
const Donation = require('../models/Donation');
const User = require('../models/User');
const Hospital = require('../models/Hospital');
const Certificate = require('../models/Certificate');
const emailClient = require('../services/emailClient');
const { computeEffectiveStatus, daysUntilAvailable } = require('../utils/donorStatus');

const CERT_DIR = path.join(__dirname, '..', '..', 'uploads', 'certificates');
if (!fs.existsSync(CERT_DIR)) fs.mkdirSync(CERT_DIR, { recursive: true });

function buildCertificateNumber() {
  const d = new Date();
  const ymd = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
  const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `BL-${ymd}-${suffix}`;
}

function buildVerificationId() {
  return crypto.randomBytes(16).toString('hex');
}

function fmtDateLabel(d) {
  return new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

async function issueCertificateForDonation(donation) {
  const [donor, hospital] = await Promise.all([
    User.findById(donation.donor).select('name email bloodGroup'),
    Hospital.findById(donation.hospital).select('name'),
  ]);

  if (!donor || !hospital) {
    console.error('[certificate] missing donor or hospital for donation', donation._id);
    return null;
  }

  const certificateNumber = buildCertificateNumber();
  const verificationId = buildVerificationId();

  const cert = await Certificate.create({
    donation: donation._id,
    donor: donor._id,
    hospital: hospital._id,
    donorName: donor.name,
    hospitalName: hospital.name,
    bloodGroup: donor.bloodGroup,
    donationType: donation.donationType,
    units: donation.units || 1,
    donatedAt: donation.donatedAt,
    certificateNumber,
    verificationId,
  });

  // Ask the email-service to render the PDF + send the email,
  // and to return the PDF bytes so we can persist them locally
  // for the in-app download endpoint.
  const result = await emailClient.sendDonationCertificate({
    to: donor.email,
    name: donor.name,
    certificate: {
      certificateNumber,
      verificationId,
      donorName: donor.name,
      hospitalName: hospital.name,
      bloodGroup: donor.bloodGroup,
      donationType: donation.donationType,
      units: donation.units || 1,
      donatedAt: donation.donatedAt,
      donatedAtLabel: fmtDateLabel(donation.donatedAt),
      issuedAt: cert.issuedAt,
      issuedAtLabel: fmtDateLabel(cert.issuedAt),
    },
  });

  if (result?.pdfBase64) {
    try {
      const filePath = path.join(CERT_DIR, `${verificationId}.pdf`);
      await fsp.writeFile(filePath, Buffer.from(result.pdfBase64, 'base64'));
      cert.pdfPath = `certificates/${verificationId}.pdf`;
      await cert.save();
    } catch (err) {
      console.error('[certificate] failed to persist PDF:', err);
    }
  }

  return cert;
}

const getHospitalProfile = async (req, res) => {
  try {
    const h = req.user.toObject();
    delete h.password;
    h.state = h.isVerified ? 'VERIFIED' : 'UNVERIFIED';
    return res.json(h);
  } catch (err) {
    console.error('getHospitalProfile error:', err);
    return res.status(500).json({ message: 'Failed to retrieve profile' });
  }
};

const updateHospitalProfile = async (req, res) => {
  try {
    const { name, phone, address, licenseNumber } = req.body;
    const hosp = req.user;
    if (name) hosp.name = name;
    if (phone) hosp.phone = phone;
    if (address) hosp.address = address;
    if (licenseNumber !== undefined) hosp.licenseNumber = licenseNumber;
    await hosp.save();
    const h = hosp.toObject();
    delete h.password;
    h.state = h.isVerified ? 'VERIFIED' : 'UNVERIFIED';
    return res.json(h);
  } catch (err) {
    console.error('updateHospitalProfile error:', err);
    return res.status(500).json({ message: 'Failed to update profile' });
  }
};

const getHospitalRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = { hospital: req.user._id };
    if (status) {
      const statuses = status.split(',').map((s) => s.trim());
      filter.status = statuses.length === 1 ? statuses[0] : { $in: statuses };
    }

    const [requests, total] = await Promise.all([
      Request.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('requester', 'name phone'),
      Request.countDocuments(filter),
    ]);

    return res.json({ requests, meta: { total, page: Number(page), limit: Number(limit) } });
  } catch (err) {
    console.error('getHospitalRequests error:', err);
    return res.status(500).json({ message: 'Failed to retrieve requests' });
  }
};

const verifyRequest = async (req, res) => {
  try {
    const request = await Request.findOne({ _id: req.params.id, hospital: req.user._id });
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'PENDING_VERIFICATION') {
      return res.status(400).json({ message: 'Request is not pending verification' });
    }
    request.status = 'VERIFIED';
    await request.save();
    return res.json({ request });
  } catch (err) {
    console.error('verifyRequest error:', err);
    return res.status(500).json({ message: 'Failed to verify request' });
  }
};

const rejectRequest = async (req, res) => {
  try {
    const { category, reason } = req.body;
    const request = await Request.findOne({ _id: req.params.id, hospital: req.user._id });
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'PENDING_VERIFICATION') {
      return res.status(400).json({ message: 'Request is not pending verification' });
    }
    request.status = 'REJECTED';
    request.rejectionReason = [category, reason].filter(Boolean).join(' – ');
    await request.save();
    return res.json({ request });
  } catch (err) {
    console.error('rejectRequest error:', err);
    return res.status(500).json({ message: 'Failed to reject request' });
  }
};

const getRequestPledges = async (req, res) => {
  try {
    const request = await Request.findOne({ _id: req.params.id, hospital: req.user._id }).select('_id');
    if (!request) return res.status(404).json({ message: 'Request not found' });

    const pledges = await Donation.find({ request: req.params.id, status: 'ACCEPTED' })
      .populate('donor', 'name phone bloodGroup');

    return res.json({ pledges });
  } catch (err) {
    console.error('getRequestPledges error:', err);
    return res.status(500).json({ message: 'Failed to retrieve pledges' });
  }
};

const markNoShow = async (req, res) => {
  try {
    const pledge = await Donation.findOne({
      _id: req.params.pledgeId,
      hospital: req.user._id,
      status: 'ACCEPTED',
    });
    if (!pledge) return res.status(404).json({ message: 'Pledge not found' });

    pledge.status = 'NO_SHOW';
    if (req.body.note) pledge.cancelReason = req.body.note;
    await pledge.save();

    if (pledge.request) {
      await Request.findByIdAndUpdate(pledge.request, { $pull: { donors: pledge.donor } });
    }

    return res.json({ pledge });
  } catch (err) {
    console.error('markNoShow error:', err);
    return res.status(500).json({ message: 'Failed to mark no-show' });
  }
};

const getHospitalDonations = async (req, res) => {
  try {
    const { state, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Recorded donations have the state field set; pledges do not.
    const filter = { hospital: req.user._id, state: { $exists: true } };
    if (state) filter.state = state;

    const [donations, total] = await Promise.all([
      Donation.find(filter)
        .sort({ donatedAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('donor', 'name phone bloodGroup'),
      Donation.countDocuments(filter),
    ]);

    return res.json({ donations, meta: { total, page: Number(page), limit: Number(limit) } });
  } catch (err) {
    console.error('getHospitalDonations error:', err);
    return res.status(500).json({ message: 'Failed to retrieve donations' });
  }
};

const recordDonation = async (req, res) => {
  try {
    const { pledgeId, donorId, donationType, units, donatedAt, notes } = req.body;
    let donation;

    if (pledgeId) {
      donation = await Donation.findOne({
        _id: pledgeId,
        hospital: req.user._id,
        status: 'ACCEPTED',
      });
      if (!donation) return res.status(404).json({ message: 'Pledge not found or not accepted' });

      donation.state = 'RECORDED';
      donation.units = units != null ? Number(units) : donation.units;
      if (donationType) donation.donationType = donationType;
      if (donatedAt) donation.donatedAt = new Date(donatedAt);
      if (notes) donation.notes = notes;
      await donation.save();
    } else if (donorId) {
      const donor = await User.findById(donorId);
      if (!donor) return res.status(404).json({ message: 'Donor not found' });

      donation = await Donation.create({
        donor: donorId,
        hospital: req.user._id,
        state: 'RECORDED',
        donationType: donationType || 'WHOLE_BLOOD',
        units: units != null ? Number(units) : 1,
        donatedAt: donatedAt ? new Date(donatedAt) : new Date(),
        notes: notes || undefined,
      });
    } else {
      return res.status(400).json({ message: 'pledgeId or donorId is required' });
    }

    await donation.populate('donor', 'name phone bloodGroup');
    return res.status(201).json({ donation });
  } catch (err) {
    console.error('recordDonation error:', err);
    return res.status(500).json({ message: 'Failed to record donation' });
  }
};

const verifyDonation = async (req, res) => {
  try {
    const donation = await Donation.findOne({ _id: req.params.id, hospital: req.user._id });
    if (!donation) return res.status(404).json({ message: 'Donation not found' });
    if (donation.state !== 'RECORDED') {
      return res.status(400).json({ message: 'Donation is not in RECORDED state' });
    }

    donation.state = 'VERIFIED';
    donation.status = 'FULFILLED';
    await donation.save();

    if (donation.request) {
      const request = await Request.findById(donation.request);
      if (request) {
        request.unitsFulfilled = (request.unitsFulfilled || 0) + (donation.units || 1);
        if (request.unitsFulfilled >= request.unitsRequired) {
          request.status = 'FULFILLED';
        }
        await request.save();
      }
    }

    // Update donor's last donation date and count
    await User.findByIdAndUpdate(donation.donor, {
      $set: { lastDonationDate: donation.donatedAt },
      $inc: { donationsCount: 1 },
    });

    // Issue certificate + email it. Failures are logged but don't
    // fail the verification — the cert can be regenerated later.
    issueCertificateForDonation(donation).catch((err) =>
      console.error('issueCertificateForDonation error:', err)
    );

    return res.json({ donation });
  } catch (err) {
    console.error('verifyDonation error:', err);
    return res.status(500).json({ message: 'Failed to verify donation' });
  }
};

const rejectDonation = async (req, res) => {
  try {
    const donation = await Donation.findOne({ _id: req.params.id, hospital: req.user._id });
    if (!donation) return res.status(404).json({ message: 'Donation not found' });
    if (donation.state !== 'RECORDED') {
      return res.status(400).json({ message: 'Donation is not in RECORDED state' });
    }

    donation.state = 'REJECTED';
    donation.status = 'CANCELLED';
    if (req.body.reason) donation.cancelReason = req.body.reason;
    await donation.save();

    if (donation.request) {
      await Request.findByIdAndUpdate(donation.request, { $pull: { donors: donation.donor } });
    }

    return res.json({ donation });
  } catch (err) {
    console.error('rejectDonation error:', err);
    return res.status(500).json({ message: 'Failed to reject donation' });
  }
};

const DONOR_LIST_FIELDS =
  'name email phone bloodGroup pincode lastDonationDate donationsCount donorEnrolled availabilityPreference manualUnavailableReason createdAt';

const getNearbyDonors = async (req, res) => {
  try {
    const { bloodGroup, status, search, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = { donorEnrolled: true, pincode: req.user.pincode };
    if (bloodGroup) filter.bloodGroup = bloodGroup;
    if (search) {
      const escaped = String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const rx = new RegExp(escaped, 'i');
      filter.$or = [{ name: rx }, { phone: rx }, { email: rx }];
    }

    const [docs, total] = await Promise.all([
      User.find(filter)
        .select(DONOR_LIST_FIELDS)
        .sort({ lastDonationDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(filter),
    ]);

    const enriched = docs.map((d) => {
      const obj = d.toObject();
      return {
        ...obj,
        effectiveStatus: computeEffectiveStatus(obj),
        daysUntilAvailable: daysUntilAvailable(obj),
      };
    });

    const donors = status ? enriched.filter((d) => d.effectiveStatus === status) : enriched;
    return res.json({ donors, meta: { total, page: Number(page), limit: Number(limit) } });
  } catch (err) {
    console.error('getNearbyDonors error:', err);
    return res.status(500).json({ message: 'Failed to load donors' });
  }
};

const getDonorHistory = async (req, res) => {
  try {
    // Pincode match is the authorization gate — hospitals can only inspect donors in their own area.
    const donor = await User.findOne({
      _id: req.params.donorId,
      donorEnrolled: true,
      pincode: req.user.pincode,
    }).select(DONOR_LIST_FIELDS);

    if (!donor) return res.status(404).json({ message: 'Donor not found in your area' });

    const donations = await Donation.find({ donor: donor._id, state: { $exists: true } })
      .sort({ donatedAt: -1 })
      .populate('hospital', 'name pincode')
      .populate('request', 'patient bloodGroup urgency');

    const obj = donor.toObject();
    return res.json({
      donor: {
        ...obj,
        effectiveStatus: computeEffectiveStatus(obj),
        daysUntilAvailable: daysUntilAvailable(obj),
      },
      donations,
    });
  } catch (err) {
    console.error('getDonorHistory error:', err);
    return res.status(500).json({ message: 'Failed to load donor history' });
  }
};

const getAcceptedPledges = async (req, res) => {
  try {
    const { search = '', limit = 50 } = req.query;
    const filter = {
      hospital: req.user._id,
      status: 'ACCEPTED',
      state: { $exists: false },
    };

    const pledges = await Donation.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .populate('donor', 'name email phone bloodGroup')
      .populate('request', 'patient');

    const lower = search.toLowerCase();
    const filtered = search
      ? pledges.filter((p) => {
          const donorName = p.donor?.name?.toLowerCase() ?? '';
          const patientName = p.request?.patient?.name?.toLowerCase() ?? '';
          return donorName.includes(lower) || patientName.includes(lower);
        })
      : pledges;

    return res.json({ pledges: filtered });
  } catch (err) {
    console.error('getAcceptedPledges error:', err);
    return res.status(500).json({ message: 'Failed to load accepted pledges' });
  }
};

module.exports = {
  getHospitalProfile,
  updateHospitalProfile,
  getHospitalRequests,
  verifyRequest,
  rejectRequest,
  getRequestPledges,
  markNoShow,
  getHospitalDonations,
  recordDonation,
  verifyDonation,
  rejectDonation,
  getNearbyDonors,
  getDonorHistory,
  getAcceptedPledges,
};
