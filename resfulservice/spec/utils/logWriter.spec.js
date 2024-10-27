// const { expect } = require('chai');
// const { errorWriter, successWriter } = require('../../src/utils/logWriter');

// // fs.promises.mkdir('/app/logs/', { recursive: true }).catch(console.error);

// describe.skip('LogWritter', function () {
//   const req = {
//     logger: {
//       info: (_message) => {},
//       error: (_message) => {},
//       emerg: (_message) => {},
//       notice: (_message) => {}
//     }
//   };

//   let mkdirStub;

//   beforeEach(() => {
//     // Stub the fs.promises.mkdir function
//     mkdirStub = sinon.stub(fs.promises, 'mkdir').resolves();
//   });

//   afterEach(() => {
//     // Restore the original function
//     mkdirStub.restore();
//   });

//   context('should create the logs directory', async () => {
//     // Call the function that uses fs.promises.mkdir
//     await fs.promises.mkdir('/app/logs/', { recursive: true });

//     // Assert that the mkdir function was called with the correct arguments
//     expect(mkdirStub.calledOnce).to.be.true;
//     expect(mkdirStub.calledWith('/app/logs/', { recursive: true })).to.be.true;
//   });

//   context('should handle errors when creating the logs directory', async () => {
//     // Make the stub reject with an error
//     mkdirStub.rejects(new Error('Failed to create directory'));

//     try {
//       await fs.promises.mkdir('/app/logs/', { recursive: true });
//     } catch (error) {
//       // Assert that the error was handled correctly
//       expect(error.message).to.equal('Failed to create directory');
//     }

//     // Assert that the mkdir function was called with the correct arguments
//     expect(mkdirStub.calledOnce).to.be.true;
//     expect(mkdirStub.calledWith('/app/logs/', { recursive: true })).to.be.true;
//   });

//   context('errorWriter', function () {
//     it('should return the constructed error if error message is provided', () => {
//       const error = errorWriter(
//         req,
//         'Unauthorized',
//         'testFunction',
//         403,
//         'error'
//       );
//       expect(error).to.have.property('message');
//       expect(error.message).to.equal('Unauthorized');
//     });

//     it("should return a 'Server Error' if error message is not provided", () => {
//       const error = errorWriter(req, undefined, 'testFunction', 500, 'error');
//       expect(error).to.have.property('message');
//       expect(error.message).to.equal('Server Error');
//     });

//     it('should return a constructed error if error type is not provided', () => {
//       const error = errorWriter(
//         req,
//         'Database connection error',
//         'testFunction',
//         500
//       );
//       expect(error).to.have.property('message');
//       expect(error.message).to.equal('Database connection error');
//     });
//   });
// });
