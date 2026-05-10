const path = require('path');
const fs = require('fs');
const Certificate = require('../models/Certificate');

const CERT_DIR = path.join(__dirname, '..', '..', 'uploads', 'certificates');

const downloadCertificate = async (req, res) => {
  try {
    const cert = await Certificate.findById(req.params.id);
    if (!cert) return res.status(404).json({ message: 'Certificate not found' });

    // Donor can download their own certificate; hospital can download
    // certificates issued at their own hospital.
    const isOwnerDonor = req.role === 'user' && cert.donor.toString() === req.user._id.toString();
    const isOwnerHospital = req.role === 'hospital' && cert.hospital.toString() === req.user._id.toString();
    if (!isOwnerDonor && !isOwnerHospital) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (!cert.pdfPath) {
      return res.status(422).json({ message: 'Certificate PDF is still being generated' });
    }

    const filePath = path.join(__dirname, '..', '..', 'uploads', cert.pdfPath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Certificate file missing' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="BloodLink-Certificate-${cert.certificateNumber}.pdf"`
    );
    return fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    console.error('downloadCertificate error:', err);
    return res.status(500).json({ message: 'Failed to download certificate' });
  }
};

const verifyByPublicId = async (req, res) => {
  try {
    const cert = await Certificate.findOne({ verificationId: req.params.verificationId });
    if (!cert) return res.status(404).json({ message: 'Certificate not found' });

    return res.json({
      donorName: cert.donorName,
      hospitalName: cert.hospitalName,
      bloodGroup: cert.bloodGroup,
      donationType: cert.donationType,
      units: cert.units,
      donatedAt: cert.donatedAt,
      certificateNumber: cert.certificateNumber,
      verificationId: cert.verificationId,
      issuedAt: cert.issuedAt,
    });
  } catch (err) {
    console.error('verifyByPublicId error:', err);
    return res.status(500).json({ message: 'Failed to verify certificate' });
  }
};

module.exports = { downloadCertificate, verifyByPublicId };
