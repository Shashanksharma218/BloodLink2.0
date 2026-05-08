const path = require('path');

const STORAGE_ROOT = path.join(__dirname, '..', '..', 'storage');

const PROOF_UPLOAD_DIR = path.join(STORAGE_ROOT, 'uploads', 'proofs');
const CERTIFICATE_DIR = path.join(STORAGE_ROOT, 'certificates');

const getCertificatePath = (verificationId) => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  return path.join(CERTIFICATE_DIR, String(yyyy), mm, `${verificationId}.pdf`);
};

const getCertificateSubdir = () => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  return path.join(CERTIFICATE_DIR, String(yyyy), mm);
};

module.exports = {
  STORAGE_ROOT,
  PROOF_UPLOAD_DIR,
  CERTIFICATE_DIR,
  getCertificatePath,
  getCertificateSubdir,
};
