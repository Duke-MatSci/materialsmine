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

  it('provides field input for dataset title', () => {
    const step2 = wrapper.findAll('.md-stepper').at(1)
    const fields = step2.findAll('.md-field')
    expect(fields.at(0).text()).toContain('Title')
  })

  it('provides field inputs for contact point', () => {
    const step2 = wrapper.findAll('.md-stepper').at(1)
    const fields = step2.findAll('.md-field')
    expect(fields.at(1).text()).toContain('ORCID')
    expect(fields.at(2).text()).toContain('Email')
    expect(fields.at(3).text()).toContain('First name')
    expect(fields.at(4).text()).toContain('Last name')
  })

  it('provides input for description', () => {
    const step2 = wrapper.findAll('.md-stepper').at(1)
    expect(step2.findAll('.md-has-textarea').at(0).text()).toContain('Description')
  })

  it('provides autocomplete field for organizations', () => {
    const step2 = wrapper.findAll('.md-stepper').at(1)
    const orgField = step2.findAll('.md-field').at(6)
    expect(orgField.html()).toContain('Organization')
  })
})
