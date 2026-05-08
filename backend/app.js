require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');

const connectDB = require('./src/config/db');
const errorHandler = require('./src/middleware/errorHandler');
const limiter = require('./src/middleware/rateLimit');

// Route modules
const authRoutes        = require('./src/modules/auth/auth.routes');
const donorRoutes       = require('./src/modules/donor/donor.routes');
const hospitalRoutes    = require('./src/modules/hospital/hospital.routes');
const requestRoutes     = require('./src/modules/request/request.routes');
const pledgeRoutes      = require('./src/modules/pledge/pledge.routes');
const donationRoutes    = require('./src/modules/donation/donation.routes');
const certificateRoutes = require('./src/modules/certificate/certificate.routes');

// Public verify controller (no auth)
const { verifyPublic }  = require('./src/modules/certificate/certificate.controller');

// Jobs
const expireRequestsJob = require('./src/jobs/expireRequests.job');

const app = express();

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

// ── Body / cookie parsing ────────────────────────────────────────────────────
app.use(express.json());
app.use(cookieParser());

// ── Global rate limit ────────────────────────────────────────────────────────
app.use(limiter.global);

// ── DB ────────────────────────────────────────────────────────────────────────
connectDB();

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/healthz', (req, res) => res.json({ success: true, data: { ok: true } }));

// ── Public routes ─────────────────────────────────────────────────────────────
app.get('/api/verify/:verificationId', limiter.verifyPublic, verifyPublic);

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api/donor',        donorRoutes);
app.use('/api/hospital',     hospitalRoutes);
app.use('/api/requests',     requestRoutes);
app.use('/api',              pledgeRoutes);       // /api/requests/:id/pledges + /api/pledges/:id
app.use('/api/hospital/donations', donationRoutes);
app.use('/api/certificates', certificateRoutes);

// ── Central error handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  expireRequestsJob.start();
});

module.exports = app;
