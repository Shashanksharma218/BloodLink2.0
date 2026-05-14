/* eslint-disable no-console */
// One-shot dashboard seeder.
//
// Populates ~24 months of backdated history so the donor / hospital / seeker
// dashboards have real numbers to render. Idempotent: if seed records already
// exist, the script exits without changes.
//
// Run:   npm run seed:dashboard   (from backend/)

require('dotenv').config();

const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const connectDB = require('../src/config/db');
const User = require('../src/models/User');
const Hospital = require('../src/models/Hospital');
const Donation = require('../src/models/Donation');
const Request = require('../src/models/Request');
const Certificate = require('../src/models/Certificate');

const HOSPITAL_EMAIL = 'bloodlink.iiitu@gmail.com';
const DONOR_EMAIL = 'babumanu2004@gmail.com';
const TARGET_PINCODE = '125001';

const SEED_TAG = '[SEED]';
const SEED_USER_EMAIL_PREFIX = 'seed.donor';
const SEED_USER_DOMAIN = '@bloodlink.local';
const SEED_CERT_PREFIX = 'SEED-BL';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const URGENCIES = ['CRITICAL', 'HIGH', 'NORMAL'];
const GENDERS = ['Male', 'Female', 'Other'];
const RELATIONSHIPS = ['Son', 'Daughter', 'Spouse', 'Sibling', 'Parent', 'Friend'];
const REJECT_REASONS = [
  'Documents invalid – Patient records incomplete',
  'Duplicate – Request already exists',
  'Out of jurisdiction – Patient not in our catchment',
];

const DUMMY_DONORS = [
  { name: 'Rohit Sharma',  bloodGroup: 'O+',  phone: '9812340001' },
  { name: 'Priya Verma',   bloodGroup: 'A+',  phone: '9812340002' },
  { name: 'Amit Yadav',    bloodGroup: 'B+',  phone: '9812340003' },
  { name: 'Sneha Gupta',   bloodGroup: 'AB+', phone: '9812340004' },
  { name: 'Vikram Singh',  bloodGroup: 'O-',  phone: '9812340005' },
  { name: 'Anjali Mehra',  bloodGroup: 'A-',  phone: '9812340006' },
  { name: 'Karan Kapoor',  bloodGroup: 'B-',  phone: '9812340007' },
  { name: 'Pooja Iyer',    bloodGroup: 'O+',  phone: '9812340008' },
  { name: 'Rahul Joshi',   bloodGroup: 'AB-', phone: '9812340009' },
  { name: 'Neha Bansal',   bloodGroup: 'A+',  phone: '9812340010' },
];

const PATIENT_NAMES = [
  'Suresh Kumar', 'Meera Devi', 'Rakesh Choudhary', 'Sunita Sharma', 'Manoj Tiwari',
  'Lata Saxena', 'Vinod Aggarwal', 'Kavita Rao', 'Ashok Gupta', 'Rekha Verma',
  'Harish Bansal', 'Geeta Yadav', 'Rajesh Khanna', 'Pinky Aggarwal', 'Devraj Singh',
  'Bhavna Mishra', 'Yogesh Sehgal', 'Sushma Gupta', 'Naveen Aroda', 'Anita Gulati',
  'Mahesh Pandey', 'Shanti Devi', 'Kiran Bedi', 'Mohan Lal', 'Renu Saini',
];

const DAY = 24 * 60 * 60 * 1000;
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const daysAgo = (d) => new Date(Date.now() - d * DAY);
const oid = () => new mongoose.Types.ObjectId();

function certNumber(when) {
  const ymd = `${when.getUTCFullYear()}${String(when.getUTCMonth() + 1).padStart(2, '0')}${String(when.getUTCDate()).padStart(2, '0')}`;
  const suffix = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${SEED_CERT_PREFIX}-${ymd}-${suffix}`;
}

function planDonationDates({ count, mostRecentMin, mostRecentMax, gapMin, gapMax }) {
  // Returns dates from most-recent to oldest. Each gap respects the 56-day
  // recovery rule so donations remain individually valid.
  const out = [];
  let cur = rand(mostRecentMin, mostRecentMax);
  for (let i = 0; i < count; i++) {
    out.push(daysAgo(cur));
    cur += rand(gapMin, gapMax);
  }
  return out;
}

async function alreadySeeded() {
  const u = await User.findOne({ email: { $regex: '^seed\\.donor' } }).lean();
  if (u) return true;
  const c = await Certificate.findOne({ certificateNumber: { $regex: `^${SEED_CERT_PREFIX}` } }).lean();
  if (c) return true;
  return false;
}

async function main() {
  await connectDB();

  if (await alreadySeeded()) {
    console.log('Seed records already present (found dummy donor or SEED- certificate).');
    console.log('Skipping. To re-seed, clear tagged records first — see cleanup snippet below.');
    printCleanupHint();
    await mongoose.disconnect();
    process.exit(0);
  }

  const hospital = await Hospital.findOne({ email: HOSPITAL_EMAIL });
  if (!hospital) throw new Error(`Hospital account not found: ${HOSPITAL_EMAIL}`);

  const donor = await User.findOne({ email: DONOR_EMAIL });
  if (!donor) throw new Error(`Donor account not found: ${DONOR_EMAIL}`);

  console.log(`Anchor hospital: ${hospital.name} <${hospital.email}>`);
  console.log(`Anchor donor:    ${donor.name} <${donor.email}>`);

  // ── Anchor account adjustments ────────────────────────────────────────────
  hospital.pincode = TARGET_PINCODE;
  hospital.isVerified = true;
  if (!hospital.licenseNumber) hospital.licenseNumber = 'BL-IIITU-2024-001';
  await hospital.save();

  donor.pincode = TARGET_PINCODE;
  donor.donorEnrolled = true;
  donor.availabilityPreference = 'AVAILABLE';
  // donationsCount + lastDonationDate are set further down once we know dates.
  await donor.save();

  // ── Dummy donors ──────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('seedDummy-not-for-login', 10);
  const dummies = DUMMY_DONORS.map((d, i) => ({
    _id: oid(),
    name: d.name,
    email: `${SEED_USER_EMAIL_PREFIX}${String(i + 1).padStart(2, '0')}${SEED_USER_DOMAIN}`,
    password: passwordHash,
    phone: d.phone,
    bloodGroup: d.bloodGroup,
    pincode: TARGET_PINCODE,
    donorEnrolled: true,
    availabilityPreference: 'AVAILABLE',
    lastDonationDate: null,
    donationsCount: 0,
    emailVerified: true,
    createdAt: daysAgo(rand(500, 720)),
    updatedAt: daysAgo(rand(0, 60)),
    __v: 0,
  }));
  await User.collection.insertMany(dummies);
  console.log(`Inserted ${dummies.length} dummy donors.`);

  // Donor lookup table for cert generation (we need name + bloodGroup).
  const donorMeta = new Map();
  donorMeta.set(String(donor._id), { _id: donor._id, name: donor.name, bloodGroup: donor.bloodGroup });
  for (const d of dummies) {
    donorMeta.set(String(d._id), { _id: d._id, name: d.name, bloodGroup: d.bloodGroup });
  }

  const allDonorIds = [donor._id, ...dummies.map((d) => d._id)];

  // ── Requests ──────────────────────────────────────────────────────────────
  const requests = [];

  // Helper to push a request shell.
  function addRequest({ status, when, unitsRequired, unitsFulfilled, bloodGroup, urgency, rejectionReason, requiredBy, requester, notes }) {
    requests.push({
      _id: oid(),
      patient: { name: pick(PATIENT_NAMES), age: rand(8, 78), gender: pick(GENDERS) },
      bloodGroup,
      unitsRequired,
      unitsFulfilled,
      hospital: hospital._id,
      requester,
      pincode: TARGET_PINCODE,
      urgency,
      requiredBy,
      status,
      patientContact: {
        name: 'Family',
        phone: '98' + String(rand(10000000, 99999999)),
        relationship: pick(RELATIONSHIPS),
      },
      notes: `${SEED_TAG} ${notes}`,
      rejectionReason,
      donors: [],
      createdAt: when,
      updatedAt: when,
      __v: 0,
    });
  }

  // 24 historical FULFILLED — one for each of the past 24 months.
  for (let m = 0; m < 24; m++) {
    const when = new Date(Date.now() - (m * 30 + rand(0, 25)) * DAY);
    const units = rand(1, 3);
    addRequest({
      status: 'FULFILLED',
      when,
      unitsRequired: units,
      unitsFulfilled: units,
      bloodGroup: pick(BLOOD_GROUPS),
      urgency: pick(URGENCIES),
      requiredBy: new Date(when.getTime() + rand(2, 5) * DAY),
      requester: pick(allDonorIds),
      notes: 'Historical fulfilled request',
    });
  }

  // 2 VERIFIED, partial fulfillment, currently active.
  for (let i = 0; i < 2; i++) {
    const when = daysAgo(rand(2, 12));
    const units = rand(2, 4);
    addRequest({
      status: 'VERIFIED',
      when,
      unitsRequired: units,
      unitsFulfilled: Math.max(0, units - rand(1, 2)),
      bloodGroup: pick(BLOOD_GROUPS),
      urgency: pick(URGENCIES),
      requiredBy: new Date(Date.now() + rand(2, 7) * DAY),
      requester: pick(allDonorIds),
      notes: 'Active verified request',
    });
  }

  // 1 PENDING_VERIFICATION — fills the hospital Queue.
  {
    const when = daysAgo(rand(0, 2));
    addRequest({
      status: 'PENDING_VERIFICATION',
      when,
      unitsRequired: 2,
      unitsFulfilled: 0,
      bloodGroup: pick(BLOOD_GROUPS),
      urgency: 'CRITICAL',
      requiredBy: new Date(Date.now() + 3 * DAY),
      requester: donor._id, // babumanu2004 as seeker → also lights up seeker dashboard
      notes: 'Pending verification (queue)',
    });
  }

  // 2 REJECTED, in the past.
  for (let i = 0; i < 2; i++) {
    const when = daysAgo(rand(60, 400));
    addRequest({
      status: 'REJECTED',
      when,
      unitsRequired: rand(1, 3),
      unitsFulfilled: 0,
      bloodGroup: pick(BLOOD_GROUPS),
      urgency: pick(URGENCIES),
      requiredBy: new Date(when.getTime() + 3 * DAY),
      requester: pick(allDonorIds),
      rejectionReason: pick(REJECT_REASONS),
      notes: 'Rejected request',
    });
  }

  // 1 EXPIRED.
  {
    const when = daysAgo(rand(120, 500));
    addRequest({
      status: 'EXPIRED',
      when,
      unitsRequired: 2,
      unitsFulfilled: 0,
      bloodGroup: pick(BLOOD_GROUPS),
      urgency: 'NORMAL',
      requiredBy: new Date(when.getTime() + 3 * DAY),
      requester: pick(allDonorIds),
      notes: 'Expired request',
    });
  }

  // ── Donations + Certificates ─────────────────────────────────────────────
  const donations = [];
  const certificates = [];

  function makeDonation({ donorId, donatedAt, request, status = 'FULFILLED', state = 'VERIFIED', units = 1, donationType = 'WHOLE_BLOOD', notes = 'Donation' }) {
    const id = oid();
    const d = {
      _id: id,
      donor: donorId,
      hospital: hospital._id,
      status,
      donationType,
      units,
      donatedAt,
      notes: `${SEED_TAG} ${notes}`,
      createdAt: donatedAt,
      updatedAt: donatedAt,
      __v: 0,
    };
    if (state) d.state = state;
    if (request) d.request = request;
    return d;
  }

  function makeCertificate(donationDoc) {
    const meta = donorMeta.get(String(donationDoc.donor));
    const issuedAt = new Date(donationDoc.donatedAt.getTime() + DAY);
    return {
      _id: oid(),
      donation: donationDoc._id,
      donor: donationDoc.donor,
      hospital: hospital._id,
      donorName: meta.name,
      hospitalName: hospital.name,
      bloodGroup: meta.bloodGroup,
      donationType: donationDoc.donationType,
      units: donationDoc.units,
      donatedAt: donationDoc.donatedAt,
      certificateNumber: certNumber(issuedAt),
      verificationId: crypto.randomBytes(16).toString('hex'),
      issuedAt,
      createdAt: issuedAt,
      updatedAt: issuedAt,
      __v: 0,
    };
  }

  function linkableFulfilledRequest(bloodGroup) {
    return requests.find(
      (r) => r.status === 'FULFILLED' && r.bloodGroup === bloodGroup && !r.donors.some((id) => String(id) === bloodGroup),
    );
  }

  // Babumanu — 12 verified donations, ~60–72 days apart, latest ~65 days ago
  // so the donor remains AVAILABLE (not RECOVERING).
  const babumanuDates = planDonationDates({
    count: 12,
    mostRecentMin: 60,
    mostRecentMax: 72,
    gapMin: 60,
    gapMax: 75,
  });

  for (const date of babumanuDates) {
    const candidate = requests.find(
      (r) => r.status === 'FULFILLED' && r.bloodGroup === donor.bloodGroup,
    );
    const don = makeDonation({
      donorId: donor._id,
      donatedAt: date,
      request: candidate?._id,
      notes: 'Babumanu verified donation',
    });
    donations.push(don);
    certificates.push(makeCertificate(don));
    if (candidate) candidate.donors.push(donor._id);
  }

  donor.donationsCount = babumanuDates.length;
  donor.lastDonationDate = babumanuDates[0];
  await donor.save();

  // Dummy donors — 3–8 verified donations each, scattered across 24 months.
  for (const dd of dummies) {
    const count = rand(3, 8);
    const dates = planDonationDates({
      count,
      mostRecentMin: 30,
      mostRecentMax: 200,
      gapMin: 60,
      gapMax: 95,
    });

    for (const date of dates) {
      const candidate = requests.find(
        (r) => r.status === 'FULFILLED' && r.bloodGroup === dd.bloodGroup,
      );
      const don = makeDonation({
        donorId: dd._id,
        donatedAt: date,
        request: candidate?._id,
        notes: `Donation by ${dd.name}`,
      });
      donations.push(don);
      certificates.push(makeCertificate(don));
      if (candidate) candidate.donors.push(dd._id);
    }

    await User.collection.updateOne(
      { _id: dd._id },
      { $set: { donationsCount: count, lastDonationDate: dates[0] } },
    );
  }

  // 3 RECORDED donations — feed the "Awaiting Verify" hospital KPI.
  for (let i = 0; i < 3; i++) {
    const d = pick(dummies);
    donations.push(
      makeDonation({
        donorId: d._id,
        donatedAt: daysAgo(rand(1, 5)),
        status: 'ACCEPTED',
        state: 'RECORDED',
        notes: 'Awaiting verification',
      }),
    );
  }

  // ACCEPTED pledges (no state) — drives the donor's Active Pledges and the
  // hospital's pledge counts on the queue/active pages.
  const verifiedRequests = requests.filter((r) => r.status === 'VERIFIED');
  if (verifiedRequests.length) {
    // Babumanu's active pledge on the first verified request.
    const target = verifiedRequests[0];
    donations.push({
      _id: oid(),
      donor: donor._id,
      hospital: hospital._id,
      request: target._id,
      status: 'ACCEPTED',
      donationType: 'WHOLE_BLOOD',
      units: 1,
      donatedAt: daysAgo(0),
      notes: `${SEED_TAG} Babumanu active pledge`,
      createdAt: daysAgo(2),
      updatedAt: daysAgo(2),
      __v: 0,
    });
    target.donors.push(donor._id);

    // Two pledges per verified request from dummies.
    for (const r of verifiedRequests) {
      for (let i = 0; i < 2; i++) {
        const d = pick(dummies);
        donations.push({
          _id: oid(),
          donor: d._id,
          hospital: hospital._id,
          request: r._id,
          status: 'ACCEPTED',
          donationType: 'WHOLE_BLOOD',
          units: 1,
          donatedAt: daysAgo(0),
          notes: `${SEED_TAG} Pledge by ${d.name}`,
          createdAt: daysAgo(rand(1, 5)),
          updatedAt: daysAgo(rand(1, 5)),
          __v: 0,
        });
        r.donors.push(d._id);
      }
    }
  }

  // ── Bulk insert ──────────────────────────────────────────────────────────
  await Request.collection.insertMany(requests);
  await Donation.collection.insertMany(donations);
  await Certificate.collection.insertMany(certificates);

  console.log('\n── Seed summary ─────────────────────────────');
  console.log(`Hospital pincode set:    ${TARGET_PINCODE}`);
  console.log(`Donor pincode aligned:   ${TARGET_PINCODE}`);
  console.log(`Dummy donors created:    ${dummies.length}`);
  console.log(`Requests inserted:       ${requests.length}`);
  console.log(`Donations inserted:      ${donations.length}`);
  console.log(`Certificates inserted:   ${certificates.length}`);
  console.log(`Babumanu donation count: ${donor.donationsCount}`);
  console.log(`Babumanu last donation:  ${donor.lastDonationDate.toISOString().slice(0, 10)}`);
  console.log('─────────────────────────────────────────────');
  printCleanupHint();

  await mongoose.disconnect();
  process.exit(0);
}

function printCleanupHint() {
  console.log('\nTo wipe seeded data (from mongosh):');
  console.log("  db.users.deleteMany({ email: /^seed\\.donor/ })");
  console.log("  db.requests.deleteMany({ notes: /^\\[SEED\\]/ })");
  console.log("  db.donations.deleteMany({ notes: /^\\[SEED\\]/ })");
  console.log("  db.certificates.deleteMany({ certificateNumber: /^SEED-/ })");
  console.log("  db.users.updateOne({ email: 'babumanu2004@gmail.com' }, { $set: { donationsCount: 0, lastDonationDate: null } })");
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
