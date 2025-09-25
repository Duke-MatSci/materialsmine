import 'jest-canvas-mock'

/* eslint-env jest */
const noop = () => {}
Object.defineProperty(window, 'scrollTo', { value: noop, writable: true })
window.URL.createObjectURL = jest.fn()
global.console = {
  log: jest.fn(), // console.log are suppressed in tests

  // Keep native behavior for other methods
  error: console.error,
  warn: console.warn,
  info: console.info,
  debug: console.debug
}
global.fetch = jest.fn()
