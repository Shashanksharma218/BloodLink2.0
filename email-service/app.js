require('dotenv').config();

const express = require('express');
const routes = require('./src/routes');

const app = express();

app.use(express.json({ limit: '1mb' }));

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'email-service' });
});

app.use('/', routes);

app.use((err, req, res, next) => {
  console.error('[email-service]', err);
  res.status(500).json({ message: err.message || 'Internal error' });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Email service running on port ${PORT}`);
});

module.exports = app;
