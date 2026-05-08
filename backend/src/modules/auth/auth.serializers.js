const { computeEffectiveStatus, daysUntilAvailable, availableOnDate } = require('../../utils/donorStatus');

const serializeUser = (doc) => {
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  delete obj.password;
  delete obj.__v;
  obj.accountType = 'user';
  obj.effectiveStatus = computeEffectiveStatus(obj);
  obj.daysUntilAvailable = daysUntilAvailable(obj);
  obj.availableOn = availableOnDate(obj);
  return obj;
};

const serializeHospital = (doc) => {
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  delete obj.password;
  delete obj.__v;
  obj.accountType = 'hospital';
  return obj;
};

const serialize = (doc, accountType) =>
  accountType === 'hospital' ? serializeHospital(doc) : serializeUser(doc);

module.exports = { serializeUser, serializeHospital, serialize };
