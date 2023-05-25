const User = require('../models/user');
const UAParser = require('ua-parser-js');
const { setInternal } = require('../middlewares/isInternal');
const { successWriter, errorWriter } = require('../utils/logWriter');
const { supportedBrowser, userRoles } = require('../../config/constant');

// Generate and send token info to FE
const _redirect = ({ _id, email, displayName, givenName, surName, roles }, req, res) => {
  const isAdmin = roles === userRoles.isAdmin;

  successWriter(req, 'success', 'Found/Created user successfully');
  const token = setInternal(req, { _id, email, displayName, givenName, surName, isAdmin, roles });
  successWriter(req, 'success', 'Login token generated successfully');

  return res
    .redirect(`${req.env.ROUTER}/auth/${JSON
      .stringify({
        userId: _id,
        token,
        displayName,
        isAdmin
        })}`);
};

// Validate user or create if it does not exists
const _validateUser = async (req) => {
  const { logger, env } = req;
  logger.info('_validateUser(): Function entry');

  const email = req.headers[env.MM_AUTH_EMAIL_HEADER] ?? env.MM_USER_EMAIL;
  const userExist = await User.findOne({ email });

  if (userExist) return userExist;

  const user = new User({
    userid: req.headers[env.MM_AUTH_USER_HEADER] ?? 'anon',
    email,
    givenName: req.headers[env.MM_AUTH_GIVEN_NAME_HEADER] ?? env.MM_USER,
    surName: req.headers[env.MM_AUTH_SURNAME_HEADER] ?? env.MM_USER,
    displayName: req.headers[env.MM_AUTH_DISPLAYNAME_HEADER] ?? env.MM_USER,
    roles: req.env?.MM_RUNTIME_ENV === 'dev' ? userRoles.isAdmin : userRoles.member
  });

  const savedUser = await user.save();
  return savedUser;
};

/**
 * Alternative Auth Service for dev purposes
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns {*} response
 */
exports.devLoginService = async (req, res, next) => {
  const { logger } = req;
  logger.info('devLoginService(): Function entry');

  try {
    const user = await _validateUser(req);
    return _redirect(user, req, res);
  } catch (err) {
    next(errorWriter(req, err, 'authenticationService', 500));
  }
};

/**
 * Auth Service
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns {*} response
 */
exports.authenticationService = async (req, res, next) => {
  const { logger, env } = req;
  logger.info('authenticationService(): Function entry');

  const uaParser = new UAParser();
  const userAgent = req.headers['user-agent'];
  const browser = uaParser.setUA(userAgent).getBrowser().name;
  if (!supportedBrowser.includes(browser)) return res.status(200).json({ message: 'Successful!' });

  // 1. Check environment & determine Login type
  const currentEnv = env?.MM_RUNTIME_ENV;
  logger.info(`authenticationService(): current environment: ${currentEnv}`);
  if (currentEnv === 'dev') return this.devLoginService(req, res, next);

  try {
    // 2. Auth service
    if (!req.headers[env.MM_AUTH_EMAIL_HEADER]) {
      logger.info('authenticationService(): userEmail Error: No user info, auth service failure');
      return res.redirect(req.env.ROUTER);
    }

    const user = await _validateUser(req);
    return _redirect(user, req, res);
  } catch (err) {
    next(errorWriter(req, err, 'authenticationService', 500));
  }
};
