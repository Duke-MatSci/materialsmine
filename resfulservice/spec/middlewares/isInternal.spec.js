const { expect } = require('chai');
const sinon = require('sinon');
const { logger } = require('../common/utils');
const { mockUser, next } = require('../mocks');
const jwtService = require('../../src/utils/jwtService')
const { setInternal, getInternal } = require('../../src/middlewares/isInternal');

describe('isInternal Middleware service', function () {
  afterEach(() => sinon.restore());

  const req = { 
    logger,
    get: () => {}
  }

  const res = {
    header: () => {},
    status: () => {},
    json: () => {},
    send: () => {}
  };

  context('getInternal', () => {
    it('rejects unauthorized request when no authorization header', async function () {
      sinon.stub(req, 'get').returns(null)
      try {
        getInternal(req, res, next);
      } catch (error) {
        expect(error.message).to.equal('Not authorized.');
      }
    });
  
    it('rejects unauthorized request when decoding token throws error', async function () {
      sinon.stub(req, 'get').returns("Bearer i2od2nlw4aeiavi2q3")
      sinon.stub(jwtService, 'decodeToken').throws('JsonWebTokenError: jwt malformed');
      try {
        getInternal(req, res, next);
      } catch (error) {
        expect(error.message).to.equals('JsonWebTokenError: jwt malformed');
      }
    });
  
    it('authorizes request', async function () {
      sinon.stub(req, 'get').returns("Bearer i2od2nlw4aeiavi2q3")
      const  nextSpy = sinon.spy();
      sinon.stub(jwtService, 'decodeToken').returns(mockUser);
      getInternal(req, res, nextSpy);
      sinon.assert.calledOnce(nextSpy);
    });
  })

  context('setInternal', () => {
    
    it('rejects unauthorized request when decoding token throws error', async function () {
      sinon.stub(jwtService, 'signToken').throws('Error');
      try {
        setInternal(req, res, next);
      } catch (error) {
        expect(error.message).to.equals('Error');
      }
    });
  
    it('authorizes request', async function () {
      sinon.stub(jwtService, 'signToken').returns({ token: 'adia4kla49qnpove'});
      const result = setInternal(req, res, next);
      expect(result).to.have.property('token');
    });
  })
});
