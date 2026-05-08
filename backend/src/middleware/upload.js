const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { PROOF_UPLOAD_DIR } = require('../config/storage');
const ApiError = require('../utils/ApiError');

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'application/pdf'];

const storage = multer.diskStorage({
  destination: PROOF_UPLOAD_DIR,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME.includes(file.mimetype)) return cb(null, true);
  cb(new ApiError(400, 'VALIDATION_FAILED', 'Only JPEG, PNG, and PDF files are allowed'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = upload;
