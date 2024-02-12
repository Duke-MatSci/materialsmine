const { decodeToken } = require('../utils/jwtService');
const { deleteFile } = require('../utils/fileManager');
const { errorWriter } = require('../utils/logWriter');

module.exports = (req, res, next) => {
  const authHeader = req?.headers?.authorization;
  if (!authHeader) {
    deleteUploadedFiles(req);
    // TODO (####): Update error writer to distinguish between logged error and response error
    // log.error('isAuth.js(): 401 - authHeader not provided');
    throw errorWriter(req, 'Not authenticated.', 'isAuth.js', 401);
  }
  const token = authHeader?.split(' ')[1];
  let decodedToken;
  try {
    decodedToken = decodeToken(req, token);
  } catch (err) {
    deleteUploadedFiles(req);
    throw errorWriter(req, err, 'isAuth.js', 500);
  }
  if (!decodedToken) {
    // log.error('isAuth.js(): 401 - decodedToken not found after jwt decode');
    deleteUploadedFiles(req);
    throw errorWriter(req, 'Not authenticated.', 'isAuth.js', 401);
  }

  req.userId = decodedToken.userId;
  req.user = decodedToken;
  next();
};

const deleteUploadedFiles = (req) => {
  if (req.files?.uploadfile) {
    req.files.uploadfile.forEach(({ path }) => {
      deleteFile(path, req);
    });
  }
};
