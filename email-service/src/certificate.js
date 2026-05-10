const PDFDocument = require('pdfkit');

const RED = '#dc2626';
const SLATE = '#0f172a';
const SLATE_MUTED = '#64748b';
const BORDER = '#e2e8f0';

function generateCertificatePdf(cert) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
        info: {
          Title: `BloodLink Donation Certificate ${cert.certificateNumber}`,
          Author: 'BloodLink',
          Subject: 'Blood Donation Certificate',
        },
      });

      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const W = doc.page.width;
      const H = doc.page.height;

      // Outer red border
      doc.lineWidth(8).strokeColor(RED).rect(20, 20, W - 40, H - 40).stroke();
      doc.lineWidth(1).strokeColor(RED).rect(36, 36, W - 72, H - 72).stroke();

      // Header band
      doc.fillColor(RED).rect(36, 36, W - 72, 70).fill();

      // Wordmark
      doc
        .fillColor('#ffffff')
        .font('Helvetica-Bold')
        .fontSize(22)
        .text('BloodLink', 60, 64, { align: 'left' });

      doc
        .fillColor('#fecaca')
        .font('Helvetica')
        .fontSize(10)
        .text('Certificate of Blood Donation', 60, 90, { align: 'left' });

      doc
        .fillColor('#ffffff')
        .font('Helvetica')
        .fontSize(10)
        .text(`#${cert.certificateNumber}`, 60, 64, { align: 'right', width: W - 120 });

      // Title
      doc
        .fillColor(SLATE)
        .font('Helvetica-Bold')
        .fontSize(34)
        .text('Certificate of Appreciation', 0, 150, { align: 'center', width: W });

      doc
        .moveTo(W / 2 - 60, 198)
        .lineTo(W / 2 + 60, 198)
        .lineWidth(2)
        .strokeColor(RED)
        .stroke();

      // Body
      doc
        .fillColor(SLATE_MUTED)
        .font('Helvetica')
        .fontSize(12)
        .text('This is to certify that', 0, 220, { align: 'center', width: W });

      doc
        .fillColor(SLATE)
        .font('Helvetica-Bold')
        .fontSize(28)
        .text(cert.donorName || 'Anonymous Donor', 0, 245, { align: 'center', width: W });

      const bodyText =
        `has voluntarily donated ${cert.units || 1} unit${(cert.units || 1) > 1 ? 's' : ''} ` +
        `of ${formatType(cert.donationType)} ${cert.bloodGroup ? `(blood group ${cert.bloodGroup}) ` : ''}` +
        `at ${cert.hospitalName || 'a partner hospital'} on ${cert.donatedAtLabel}.`;

      doc
        .fillColor(SLATE_MUTED)
        .font('Helvetica')
        .fontSize(13)
        .text(bodyText, 100, 295, { align: 'center', width: W - 200, lineGap: 4 });

      doc
        .fillColor(SLATE)
        .font('Helvetica-Oblique')
        .fontSize(13)
        .text('Your donation can save up to three lives. Thank you.', 100, 360, {
          align: 'center',
          width: W - 200,
        });

      // Footer details
      const footerY = H - 130;

      // Left block: certificate metadata
      doc
        .fillColor(SLATE_MUTED)
        .font('Helvetica')
        .fontSize(9)
        .text('Certificate Number', 80, footerY);
      doc
        .fillColor(SLATE)
        .font('Helvetica-Bold')
        .fontSize(11)
        .text(cert.certificateNumber, 80, footerY + 12);

      doc
        .fillColor(SLATE_MUTED)
        .font('Helvetica')
        .fontSize(9)
        .text('Issued On', 80, footerY + 36);
      doc
        .fillColor(SLATE)
        .font('Helvetica-Bold')
        .fontSize(11)
        .text(cert.issuedAtLabel, 80, footerY + 48);

      // Right block: verification
      const rightX = W - 280;
      doc
        .fillColor(SLATE_MUTED)
        .font('Helvetica')
        .fontSize(9)
        .text('Verify this certificate at', rightX, footerY, { width: 200 });
      doc
        .fillColor(RED)
        .font('Helvetica')
        .fontSize(9)
        .text(cert.verifyUrl || '', rightX, footerY + 12, { width: 200 });

      doc
        .fillColor(SLATE_MUTED)
        .font('Helvetica')
        .fontSize(9)
        .text('Verification ID', rightX, footerY + 36, { width: 200 });
      doc
        .fillColor(SLATE)
        .font('Courier')
        .fontSize(9)
        .text(cert.verificationId, rightX, footerY + 48, { width: 200 });

      // Centered seal
      const cx = W / 2;
      doc
        .lineWidth(2)
        .strokeColor(RED)
        .circle(cx, footerY + 30, 28)
        .stroke();
      doc
        .fillColor(RED)
        .font('Helvetica-Bold')
        .fontSize(8)
        .text('VERIFIED', cx - 24, footerY + 22, { width: 48, align: 'center' });
      doc
        .font('Helvetica')
        .fontSize(7)
        .text('BloodLink', cx - 24, footerY + 36, { width: 48, align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

function formatType(t) {
  switch (t) {
    case 'WHOLE_BLOOD': return 'whole blood';
    case 'PLASMA': return 'plasma';
    case 'PLATELETS': return 'platelets';
    default: return 'blood';
  }
}

module.exports = { generateCertificatePdf };
