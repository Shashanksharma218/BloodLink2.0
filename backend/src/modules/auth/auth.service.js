const bcrypt = require('bcryptjs');
const User = require('../../models/User');
const Hospital = require('../../models/Hospital');
const ApiError = require('../../utils/ApiError');

const getModel = (accountType) => (accountType === 'hospital' ? Hospital : User);

const register = async ({ accountType, name, email, password, phone, pincode, bloodGroup, donorEnrolled, address, licenseNumber }) => {
  const Model = getModel(accountType);

  const existing = await Model.findOne({ email });
  if (existing) throw ApiError.conflict('Email already registered', 'DUPLICATE');

  const hashed = await bcrypt.hash(password, 10);

  const payload =
    accountType === 'hospital'
      ? { name, email, password: hashed, phone, pincode, address, licenseNumber }
      : {
          name, email, password: hashed, phone, pincode, bloodGroup,
          ...(typeof donorEnrolled === 'boolean' && { donorEnrolled }),
        };

  return Model.create(payload);
};

const login = async ({ accountType, email, password }) => {
  const Model = getModel(accountType);
  const account = await Model.findOne({ email });

  if (!account) throw ApiError.unauthorized('Invalid credentials');

  const valid = await bcrypt.compare(password, account.password);
  if (!valid) throw ApiError.unauthorized('Invalid credentials');

  if (account.deletedAt) throw ApiError.unauthorized('Account deactivated');
  if (accountType === 'hospital' && account.state === 'SUSPENDED') {
    throw ApiError.forbidden('Hospital account is suspended');
  }

  return account;
};

const changePassword = async ({ account, currentPassword, newPassword }) => {
  const valid = await bcrypt.compare(currentPassword, account.password);
  if (!valid) throw ApiError.badRequest('Current password is incorrect');

  account.password = await bcrypt.hash(newPassword, 10);
  await account.save();
};

module.exports = { register, login, changePassword };
