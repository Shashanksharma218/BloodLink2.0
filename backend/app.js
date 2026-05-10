require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const donorRoutes = require('./src/routes/donorRoutes');
const donorProfileRoutes = require('./src/routes/donorProfileRoutes');
const hospitalRoutes = require('./src/routes/hospitalRoutes');
const requestRoutes = require('./src/routes/requestRoutes');
const pledgeRoutes = require('./src/routes/pledgeRoutes');
const certificateRoutes = require('./src/routes/certificateRoutes');
const eraktkoshRoutes = require('./src/routes/eraktkoshRoutes');
const { verifyByPublicId } = require('./src/controllers/certificateController');
const { seedEraktkoshMastersIfEmpty } = require('./scripts/seedEraktkoshMasters');

const app = express();

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(uploadsDir));

// Connect to Mongo, then trigger a no-op-if-already-seeded eRaktKosh seed.
// We don't await here so server bind isn't blocked on the seed network call.
connectDB().then(() => seedEraktkoshMastersIfEmpty());

app.get('/', (req, res) => {
  res.json({ message: 'BloodLink API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/donors', donorRoutes);
app.use('/api/donor', donorProfileRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/hospital', hospitalRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/pledges', pledgeRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/eraktkosh', eraktkoshRoutes);

// Public certificate verification endpoint (no auth)
app.get('/api/verify/:verificationId', verifyByPublicId);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
