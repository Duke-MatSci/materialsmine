import createWrapper from '../../../jest/script/wrapper'
import { enableAutoDestroy } from '@vue/test-utils'
import SpreadsheetUpload from '@/pages/explorer/curate/spreadsheet/SpreadsheetUpload.vue'

const apollo = {
  verifyUser: {
    isAuth: true,
    user: {
      username: 'Test User'
    }
  }
}

describe('SpreadsheetUpload.vue', () => {
  const defaultProps = {
    datasetId: '123456789'
  }
  let wrapper
  beforeEach(async () => {
    wrapper = await createWrapper(SpreadsheetUpload, {
      props: defaultProps,
      mocks: {
        $apollo: {
          loading: false
        }
      },
      stubs: {
        MdPortal: { template: '<div><slot/></div>' }
      }
    }, true)
    await wrapper.setData({ verifyUser: apollo.verifyUser })
  })

  enableAutoDestroy(afterEach)

  it('shows the current dataset ID', () => {
    expect.assertions(1)
    expect(wrapper.text()).toContain(defaultProps.datasetId)
  })

  it('renders steppers', () => {
    expect.assertions(1)
    const steppers = wrapper.findAll('.md-stepper')
    expect(steppers.length).toBe(6)
  })

  it('contains drop areas for spreadsheet and supplementary files', () => {
    expect.assertions(1)
    const steppers = wrapper.findAll('.form__drop-area')
    expect(steppers.length).toBe(2)
  })

  it.skip('provides field input for doi', () => {
    expect.assertions(2)
    const steppers = wrapper.findAll('.md-field')
    expect(steppers.length).toBe(1)
    expect(steppers.at(0).text()).toContain('DOI')
  })

  it('verifies provided information', async () => {
    expect.assertions(1)
    await wrapper.setData({ doi: '10.000' })
    const verificationStep = wrapper.findAll('.md-stepper').at(4)
    // TODO: test for files
    expect(verificationStep.html()).toContain('10.000')
  })

  it('provides a button for changing dataset ID', async () => {
    expect.assertions(1)
    const editButton = wrapper.find('#editId')
    expect(editButton.exists()).toBe(true)
  })

  it('renders a submit button', async () => {
    expect.assertions(1)
    const submitButton = wrapper.find('#submit')
    expect(submitButton.exists()).toBe(true)
  })
})
