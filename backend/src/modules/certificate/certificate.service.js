const { v4: uuidv4 } = require('uuid');
const Certificate = require('../../models/Certificate');
const Donation = require('../../models/Donation');
const User = require('../../models/User');
const Hospital = require('../../models/Hospital');
const { generatePdfBuffer } = require('./certificate.template');
const { saveFile, ensureDir } = require('../../providers/storage.provider');
const { getCertificatePath, getCertificateSubdir } = require('../../config/storage');
const ApiError = require('../../utils/ApiError');

const BASE_URL = () => process.env.API_BASE_URL || 'http://localhost:5000';

/**
 * Creates the Certificate DB row (inside a transaction session).
 * PDF is generated separately after the transaction commits.
 */
const createRecord = async (donation, { session } = {}) => {
  const verificationId = uuidv4();
  const qrPayload = `${BASE_URL()}/api/verify/${verificationId}`;

  const [cert] = await Certificate.create(
    [{
      donation: donation._id,
      donor: donation.donor,
      verificationId,
      qrPayload,
      pdfPath: '',
    }],
    { session }
  );

  return cert;
};

/**
 * Generates the PDF for an existing Certificate row and saves to local FS.
 * Called after the verify transaction commits.
 */
const generatePdf = async (cert, donation) => {
  const [donor, hospital] = await Promise.all([
    User.findById(donation.donor).select('name bloodGroup').lean(),
    Hospital.findById(donation.hospital).select('name address').lean(),
  ]);

  const pdfPath = getCertificatePath(cert.verificationId);
  ensureDir(getCertificateSubdir());

  const buffer = await generatePdfBuffer(cert, donation, donor, hospital);
  saveFile(pdfPath, buffer);

  await Certificate.findByIdAndUpdate(cert._id, { pdfPath });
  return pdfPath;
};

const getForDownload = async (certId, donorId) => {
  const cert = await Certificate.findById(certId);
  if (!cert) throw ApiError.notFound('Certificate not found');
  if (cert.donor.toString() !== donorId.toString()) throw ApiError.forbidden();
  if (cert.state === 'REVOKED') throw ApiError.invalidState('This certificate has been revoked');
  if (!cert.pdfPath) throw ApiError.invalidState('Certificate PDF is not yet available');
  return cert;
};

const verifyPublic = async (verificationId) => {
  const cert = await Certificate.findOne({ verificationId })
    .populate('donor', 'name')
    .populate({
      path: 'donation',
      select: 'donationType donatedAt hospital',
      populate: { path: 'hospital', select: 'name' },
    })
    .lean();

  if (!cert) throw ApiError.notFound('Certificate not found');

  // Return minimal public info only — no full donor PII
  const donorName = cert.donor?.name || '';
  const initial = donorName.split(' ').slice(1).map((n) => `${n[0]}.`).join(' ');
  const publicName = `${donorName.split(' ')[0]} ${initial}`.trim();

  return {
    verificationId: cert.verificationId,
    state: cert.state,
    donorName: publicName,
    donationType: cert.donation?.donationType,
    donatedAt: cert.donation?.donatedAt,
    hospitalName: cert.donation?.hospital?.name,
    issuedAt: cert.issuedAt,
  };
};

module.exports = { createRecord, generatePdf, getForDownload, verifyPublic };
