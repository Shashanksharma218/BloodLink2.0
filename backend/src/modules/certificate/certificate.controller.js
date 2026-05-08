const path = require('path');
const fs = require('fs');
const certificateService = require('./certificate.service');
const asyncHandler = require('../../utils/asyncHandler');
const { ok } = require('../../utils/respond');
const ApiError = require('../../utils/ApiError');

const download = asyncHandler(async (req, res) => {
  const cert = await certificateService.getForDownload(req.params.id, req.actor.id);

  if (!fs.existsSync(cert.pdfPath)) {
    throw ApiError.invalidState('Certificate PDF file not found. Please try again shortly.');
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="certificate-${cert.verificationId}.pdf"`
  );
  fs.createReadStream(cert.pdfPath).pipe(res);
});

const verifyPublic = asyncHandler(async (req, res) => {
  const data = await certificateService.verifyPublic(req.params.verificationId);
  return ok(res, data);
});

module.exports = { download, verifyPublic };
