function escape(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function layout({ title, preheader, body }) {
  const safePreheader = escape(preheader || '');
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escape(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1e293b;">
    <span style="display:none;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">${safePreheader}</span>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;padding:32px 16px;">
      <tr>
        <td align="center">
          <table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
            <tr>
              <td style="background:#dc2626;padding:20px 28px;">
                <table cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="vertical-align:middle;">
                      <span style="display:inline-block;width:32px;height:32px;background:#ffffff;border-radius:8px;text-align:center;line-height:32px;color:#dc2626;font-weight:700;font-size:18px;vertical-align:middle;">&#10084;</span>
                    </td>
                    <td style="padding-left:10px;vertical-align:middle;">
                      <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.01em;">BloodLink</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 28px;">
                ${body}
              </td>
            </tr>
            <tr>
              <td style="background:#f8fafc;padding:20px 28px;border-top:1px solid #e2e8f0;">
                <p style="margin:0;font-size:12px;color:#64748b;line-height:1.5;">
                  This message was sent by BloodLink. If you weren't expecting it, you can safely ignore this email.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function button(href, label) {
  return `<table cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
    <tr>
      <td style="background:#dc2626;border-radius:8px;">
        <a href="${escape(href)}" style="display:inline-block;padding:12px 24px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">${escape(label)}</a>
      </td>
    </tr>
  </table>`;
}

function paragraph(text) {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#1e293b;">${text}</p>`;
}

function heading(text) {
  return `<h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#0f172a;">${escape(text)}</h1>`;
}

function muted(text) {
  return `<p style="margin:16px 0 0;font-size:13px;color:#64748b;line-height:1.5;">${text}</p>`;
}

function dataRow(label, value) {
  return `<tr>
    <td style="padding:8px 0;font-size:13px;color:#64748b;">${escape(label)}</td>
    <td style="padding:8px 0;font-size:13px;color:#0f172a;text-align:right;font-weight:500;">${escape(value)}</td>
  </tr>`;
}

function dataTable(rows) {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0;border-top:1px solid #e2e8f0;">${rows.map((r) => dataRow(r[0], r[1])).join('')}</table>`;
}

module.exports = { layout, button, paragraph, heading, muted, dataTable, escape };
