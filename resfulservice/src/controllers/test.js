const User = require('../models/user');
const { successWriter, errorWriter } = require('../utils/logWriter');

exports.testUser = async (req, res, next) => {
  try {
    const foundUser = await User.find().limit(1);
    successWriter(req, 'success', 'testUser');
    res.status(200).json({
      message: 'Fetched user successfully.',
      foundUser
    });
  } catch (err) {
    next(errorWriter(req, err, 'testUser', 500));
  }
};
