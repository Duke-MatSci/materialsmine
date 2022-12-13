const {expect} = require('chai');
const { errorWriter, successWriter } = require('../../src/utils/logWriter');

describe('LogWritter', function () {
  const req = { logger: { info: (_message) => { }, error: (_message) => { }, emerg: (_message) => { }, notice: (_message) => {} }};
  
  context('errorWriter', function () {
    it('should return the constructed error if error message is provided', () => {
      const error = errorWriter(req, 'Unauthorized', 'testFunction', 403, 'error');
      expect(error).to.have.property('message');
      expect(error.message).to.equal('Unauthorized');
    });

    it("should return a 'Server Error' if error message is not provided", () => {
      const error = errorWriter(req, undefined, 'testFunction', 500, 'error');
      expect(error).to.have.property('message');
      expect(error.message).to.equal('Server Error');
    })

    it("should return a constructed error if error type is not provided", () => {
      const error = errorWriter(req, 'Database connection error', 'testFunction', 500);
      expect(error).to.have.property('message');
      expect(error.message).to.equal('Database connection error');
    })
  });
})
