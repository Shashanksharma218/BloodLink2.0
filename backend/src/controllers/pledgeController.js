const Donation = require('../models/Donation');
const Request = require('../models/Request');

const getPledge = async (req, res) => {
  try {
    const pledge = await Donation.findOne({ _id: req.params.id, donor: req.user._id })
      .populate({
        path: 'request',
        select: 'bloodGroup unitsRequired patient hospital urgency requiredBy status',
        populate: { path: 'hospital', select: 'name pincode' },
      })
      .populate('hospital', 'name pincode');

    if (!pledge) return res.status(404).json({ message: 'Pledge not found' });
    return res.json({ pledge });
  } catch (err) {
    console.error('getPledge error:', err);
    return res.status(500).json({ message: 'Failed to retrieve pledge' });
  }
};

const cancelPledge = async (req, res) => {
  try {
    const { reason } = req.body;
    const pledge = await Donation.findOne({ _id: req.params.id, donor: req.user._id });

    if (!pledge) return res.status(404).json({ message: 'Pledge not found' });
    if (pledge.status !== 'ACCEPTED') {
      return res.status(400).json({ message: 'Cannot cancel this pledge' });
    }

    pledge.status = 'CANCELLED';
    if (reason) pledge.cancelReason = reason;
    await pledge.save();

    await Request.findByIdAndUpdate(pledge.request, {
      $pull: { donors: req.user._id },
    });

    return res.json({ pledge });
  } catch (err) {
    console.error('cancelPledge error:', err);
    return res.status(500).json({ message: 'Failed to cancel pledge' });
  }
};

module.exports = { getPledge, cancelPledge };
