const Request = require('../models/Request');
const Donation = require('../models/Donation');
const Hospital = require('../models/Hospital');
const { computeEffectiveStatus } = require('../utils/donorStatus');

const ACTIVE_STATUSES = ['PENDING_VERIFICATION', 'VERIFIED', 'PARTIALLY_FULFILLED'];
// Excludes PENDING_VERIFICATION so donors can't see or pledge to a request
// before a hospital admin has verified it.
const DONOR_VISIBLE_STATUSES = ['VERIFIED', 'PARTIALLY_FULFILLED'];

const getDonorFeed = async (req, res) => {
  try {
    const donor = req.user;
    const { limit = 20, page = 1 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const donorStatus = computeEffectiveStatus(donor);
    if (donorStatus === 'RECOVERING' || donorStatus === 'INELIGIBLE') {
      return res.json({
        requests: [],
        total: 0,
        page: Number(page),
        limit: Number(limit),
        donorStatus,
      });
    }

    const filter = {
      status: { $in: DONOR_VISIBLE_STATUSES },
      bloodGroup: donor.bloodGroup,
      donors: { $ne: donor._id },
    };

    const [requests, total] = await Promise.all([
      Request.find(filter)
        .sort({ urgency: 1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('hospital', 'name pincode address'),
      Request.countDocuments(filter),
    ]);

    return res.json({ requests, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error('getDonorFeed error:', err);
    return res.status(500).json({ message: 'Failed to retrieve feed' });
  }
};

const createRequest = async (req, res) => {
  try {
    const {
      patientName, patientAge, patientGender,
      bloodGroup, unitsRequired,
      hospitalId, urgency, requiredBy,
      notes,
    } = req.body;

    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) return res.status(404).json({ message: 'Hospital not found' });

    const request = await Request.create({
      patient: {
        name: patientName,
        age: patientAge != null ? Number(patientAge) : undefined,
        gender: patientGender,
      },
      bloodGroup,
      unitsRequired: Number(unitsRequired),
      hospital: hospitalId,
      pincode: hospital.pincode,
      requester: req.user._id,
      urgency: urgency || 'NORMAL',
      requiredBy: requiredBy ? new Date(requiredBy) : undefined,
      patientContact: {
        name: req.body.contactName,
        phone: req.body.contactPhone,
        relationship: req.body.contactRelationship,
      },
      notes: notes || undefined,
      proofDocument: req.file
        ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
        : undefined,
    });

    await request.populate('hospital', 'name pincode');
    return res.status(201).json({ request });
  } catch (err) {
    console.error('createRequest error:', err);
    return res.status(500).json({ message: err.message || 'Failed to create request' });
  }
};

const getMyRequests = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = { requester: req.user._id };
    if (status) filter.status = status;

    const [requests, total] = await Promise.all([
      Request.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('hospital', 'name pincode'),
      Request.countDocuments(filter),
    ]);

    return res.json({ requests, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error('getMyRequests error:', err);
    return res.status(500).json({ message: 'Failed to retrieve requests' });
  }
};

const getRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate('hospital', 'name pincode address')
      .populate('requester', 'name phone');

    if (!request) return res.status(404).json({ message: 'Request not found' });
    return res.json(request);
  } catch (err) {
    console.error('getRequest error:', err);
    return res.status(500).json({ message: 'Failed to retrieve request' });
  }
};

const cancelRequest = async (req, res) => {
  try {
    const request = await Request.findOne({ _id: req.params.id, requester: req.user._id });
    if (!request) return res.status(404).json({ message: 'Request not found' });

    if (!ACTIVE_STATUSES.includes(request.status)) {
      return res.status(400).json({ message: 'Cannot cancel request in current status' });
    }

    request.status = 'CANCELLED';
    await request.save();

    return res.json({ request });
  } catch (err) {
    console.error('cancelRequest error:', err);
    return res.status(500).json({ message: 'Failed to cancel request' });
  }
};

const getRequestPledges = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id).select('_id');
    if (!request) return res.status(404).json({ message: 'Request not found' });

    const pledges = await Donation.find({ request: req.params.id, status: 'ACCEPTED' })
      .populate('donor', 'name email phone bloodGroup pincode');

    return res.json({ pledges });
  } catch (err) {
    console.error('getRequestPledges error:', err);
    return res.status(500).json({ message: 'Failed to retrieve pledges' });
  }
};

const acceptPledge = async (req, res) => {
  try {
    const donor = req.user;
    const request = await Request.findById(req.params.id);

    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (!DONOR_VISIBLE_STATUSES.includes(request.status)) {
      return res.status(400).json({ message: 'Request is not accepting pledges' });
    }

    const donorStatus = computeEffectiveStatus(donor);
    if (donorStatus === 'RECOVERING' || donorStatus === 'INELIGIBLE') {
      return res.status(403).json({
        message: 'You are not currently eligible to pledge',
        status: donorStatus,
      });
    }

    const alreadyPledged = request.donors.some((d) => d.toString() === donor._id.toString());
    if (alreadyPledged) {
      return res.status(409).json({ message: 'Already pledged for this request' });
    }

    request.donors.push(donor._id);
    if (request.status === 'VERIFIED') request.status = 'PARTIALLY_FULFILLED';
    await request.save();

    const pledge = await Donation.create({
      donor: donor._id,
      request: request._id,
      hospital: request.hospital,
      status: 'ACCEPTED',
    });

    return res.status(201).json({ pledge });
  } catch (err) {
    console.error('acceptPledge error:', err);
    return res.status(500).json({ message: 'Failed to accept pledge' });
  }
};

module.exports = {
  getDonorFeed,
  createRequest,
  getMyRequests,
  getRequest,
  cancelRequest,
  getRequestPledges,
  acceptPledge,
};
