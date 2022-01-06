const User = require('../models/user');

exports.testUser = async (req, res, next) => {
  try {
    const foundUser = await User.find().limit(1);
    res.status(200).json({
      message: 'Fetched user successfully.',
      foundUser,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};