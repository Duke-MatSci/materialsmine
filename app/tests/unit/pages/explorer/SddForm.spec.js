import createWrapper from '../../../jest/script/wrapper'
import { enableAutoDestroy } from '@vue/test-utils'
import SddForm from '@/pages/explorer/curate/sdd/SddForm.vue'

describe('SddForm.vue', () => {
  let wrapper
  beforeEach(async () => {
    wrapper = await createWrapper(SddForm, {
      stubs: {
        MdPortal: { template: '<div><slot/></div>' }
      }
    }, true)
  })

  enableAutoDestroy(afterEach)

  it('renders steppers', () => {
    expect.assertions(1)
    const steppers = wrapper.findAll('.md-stepper')
    expect(steppers.length).toBe(3)
  })

  it('provides field input for doi', () => {
    const fields = wrapper.findAll('.md-field')
    expect(fields.at(0).text()).toContain('DOI')
  })

  it('contains input areas for spreadsheet and supplementary files', () => {
    expect.assertions(1)
    const fileDrop = wrapper.findAll('.form__file-input')
    expect(fileDrop.length).toBe(2)
  })
})
