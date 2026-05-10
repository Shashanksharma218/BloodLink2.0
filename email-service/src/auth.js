function requireSecret(req, res, next) {
  const expected = process.env.EMAIL_SERVICE_SECRET;
  if (!expected) {
    return res.status(500).json({ message: 'EMAIL_SERVICE_SECRET not configured' });
  }

  const header = req.headers.authorization || '';
  const provided = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!provided || provided !== expected) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  next();
}

module.exports = { requireSecret };
