const {expect} = require('chai');
const isAuth = require('../../src/middlewares/isAuth');
const {signToken} = require('../../src/utils/jwtService');

const logger = require('../logger');

describe('authValidation middleware service', function () {
  it('rejects unauthorized request', async function () {
    expect(isAuth.bind(this, {logger}, {}, () => {})).to.throw('Not authenticated.');
  });

  it('authorizes request', async function () {
    const env = {
      TKNS: 'testToken'
    };
    const tkn = await signToken({env}, {userId: 'testuser'});
    const req = {
      headers: {authorization: `Bearer ${tkn}`},
      env: env
    };
    isAuth(req, {}, () => {});
    expect(req.userId).to.equal('testuser');
  });
});