// Maps recipient blood group → array of compatible donor blood groups.
// Based on WHO/AABB whole-blood compatibility guidelines.
const COMPATIBILITY_MAP = {
  'O-':  ['O-'],
  'O+':  ['O-', 'O+'],
  'A-':  ['O-', 'A-'],
  'A+':  ['O-', 'O+', 'A-', 'A+'],
  'B-':  ['O-', 'B-'],
  'B+':  ['O-', 'O+', 'B-', 'B+'],
  'AB-': ['O-', 'A-', 'B-', 'AB-'],
  'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
};

const BLOOD_GROUPS = Object.keys(COMPATIBILITY_MAP);

const getCompatibleDonorGroups = (recipientGroup) =>
  COMPATIBILITY_MAP[recipientGroup] || [];

const isCompatible = (donorGroup, recipientGroup) =>
  (COMPATIBILITY_MAP[recipientGroup] || []).includes(donorGroup);

module.exports = { COMPATIBILITY_MAP, BLOOD_GROUPS, getCompatibleDonorGroups, isCompatible };
