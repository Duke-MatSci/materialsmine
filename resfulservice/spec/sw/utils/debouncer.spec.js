const sinon = require('sinon');
const Debouncer = require('../../../src/sw/utils/debouncer');

let clock;

describe('Debouncer', () => {
  beforeEach(() => {
    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    clock.restore();
  });

  it('debounce', () => {
    const spy = sinon.spy();
    const func = function () {
      console.log('eventually debounced was called!');
      spy();
    };
    const debouncedFunc = Debouncer.debounce(func, 1000);

    // Call it immediately
    debouncedFunc();

    // wait 1000ms
    clock.tick(1000);
    sinon.assert.calledOnce(spy); // func called
  });
});
