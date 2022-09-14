const { expect, should } = require('chai');
const { setInternal, getInternal } = require('../../src/middlewares/isInternal');
const logger = require('../logger');

should();

describe('isInternal middleware service', function() {
  it.skip('rejects req.isInternal undefined values', function() {
    expect(getInternal.bind(this, {logger}, {}, () => {})).to.throw('Not authorized.');
  });

  it.skip('authorizes request', async function() {
    let req = {
      logger,
      isInternal: undefined,
      internal: false,
      get: () => ({}),
    };
    setInternal(req, {}, () => {});
    req.isInternal = req.signedToken;
    req.signedToken.should.exist;
    getInternal(req, {}, () => {});
    req.internal.should.equal(true);
  });
});