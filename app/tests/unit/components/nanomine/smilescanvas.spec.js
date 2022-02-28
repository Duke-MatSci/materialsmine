import createWrapper from '../../../jest/script/wrapper'
import SmilesCanvas from '@/components/nanomine/SmilesCanvas.vue'

var wrapper = null

const smilesCanvasProps = {
  smilesOptions: {
    Padding: 0.0,
    atomVisualization: 'default', // 'balls',
    explicitHydrogens: true,
    terminalCarbons: true,
    debug: false
  },
  smilesInput: '',
  formulaHandler: jest.fn(),
  onSuccessHandler: jest.fn(),
  onErrorHandler: jest.fn()
}

describe('SmilesCanvas.vue', () => {
  beforeAll(() => {
    wrapper = createWrapper(SmilesCanvas, {
      props: smilesCanvasProps
    })
  })

  it('mounts properly', () => {
    expect(wrapper.exists()).toBeTruthy()
  })

  // Can't debug why, but SmilesCanvas is unable to locate the canvas tag
  // internally when run using jest, so it errors out and doesn't parse
  // anything. This does not happen when loaded in browser.
  it.skip('parses uSMILES successfully', () => {
    wrapper.setProps({ smilesInput: 'C(C(Cl)[*])[*]' })
    expect(smilesCanvasProps.formulaHandler.mock.calls[0]).toMatch('C2H3Cl')
  })
})
