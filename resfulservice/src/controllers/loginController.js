const User = require('../models/user');
const { signToken } = require('../utils/jwtService');

async function externalService (token) {
  return {
    email: 'john4@gmail.com',
    username: 'john1',
    name: 'john doe',
    isAdin: false
  };
}

exports.login = async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ message: 'Not Authenticated' });

  try {
    const response = await externalService(token);
    if (!response) return res.status('Invalid Authorization');

    if (!/\S+@\S+\.\S+/.test(response.email)) return res.status(403).json({ message: 'Invalid Email' });

    const dupEmail = await User.countDocuments({ email: response.email });
    if (dupEmail) return res.status(403).json({ message: 'Email already exist' });

    const user = new User(response);
    await user.save();

    const generatedToken = signToken(req, { userId: user._id });

    return res.status(200).json({
      token: generatedToken
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'error login in', statusCode: 500 });
  }
};
