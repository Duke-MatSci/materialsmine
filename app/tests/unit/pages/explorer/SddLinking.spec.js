import createWrapper from '../../../jest/script/wrapper'
import { testDataset, testOrcid, testThumbnail } from '../../../jest/__mocks__/sddDatasetMock'
import { enableAutoDestroy } from '@vue/test-utils'
import SddLinking from '@/pages/explorer/curate/sdd/SddLinking.vue'
import store from '@/store/index'

// Mock store since we just to return test data
const dispatch = jest.spyOn(store, 'dispatch').mockImplementation(() => {
  store.commit('explorer/setCurrentDataset', testDataset)
  store.commit('explorer/setCurrentDatasetThumbnail', testThumbnail)
  store.commit('explorer/curation/setOrcidData', testOrcid)
})

describe('SddLinking.vue', () => {
  let wrapper
  beforeEach(async () => {
    // Reset store so watchers trigger
    store.commit('explorer/setCurrentDataset', null)
    store.commit('explorer/setCurrentDatasetThumbnail', null)
    store.commit('explorer/curation/setOrcidData', null)

    wrapper = await createWrapper(SddLinking, {
      stubs: {
        MdPortal: { template: '<div><slot/></div>' }
      },
      props: {
        datasetId: 'test-id'
      }
    }, true)
  })

  enableAutoDestroy(afterEach)

  it('fills page with data from store ', () => {
    expect(dispatch).toHaveBeenCalledWith('explorer/fetchSingleDataset', 'http://localhost/explorer/dataset/test-id')
    expect(wrapper.vm.dataset).toEqual(testDataset)
  })

  it('renders steppers after page loads', () => {
    const steppers = wrapper.findAll('.md-stepper')
    expect(steppers.length).toBe(4)
  })

  it('renders loaded data', () => {
    const step1 = wrapper.findAll('.md-stepper').at(0)
    expect(step1.text()).toContain(testDataset['http://purl.org/dc/terms/title'][0]['@value'])
    expect(step1.text()).toContain(testDataset['http://purl.org/dc/terms/description'][0]['@value'])
    expect(step1.text()).toContain(testOrcid['http://schema.org/familyName'][0]['@value'])
    expect(step1.text()).toContain(testOrcid['http://schema.org/givenName'][0]['@value'])
  })

  it('prompts for uri space', () => {
    const step2 = wrapper.findAll('.md-stepper').at(1)
    expect(step2.text()).toContain('namespace')
    const radios = step2.findAll('.md-radio')
    expect(radios.length).toBe(2)
    expect(radios.at(0).text()).toContain('default')
    expect(radios.at(1).text()).toContain('custom')
  })

  it('asks for delimiters for csv files', () => {
    const step3 = wrapper.findAll('.md-stepper').at(2)
    expect(step3.text()).toContain('delimiter')
    const numCsvs = testDataset['http://www.w3.org/ns/dcat#contactpoint']
      .filter(file => file['@id'].includes('csv')).length
    const inputFields = step3.findAll('.md-field')
    expect(inputFields.length).toBe(numCsvs)
  })

  it('asks about SDD files', async () => {
    const step4 = wrapper.findAll('.md-stepper').at(3)
    expect(step4.text()).toContain('SDD')
    const numFiles = testDataset['http://www.w3.org/ns/dcat#distribution'].length
    expect(step4.findAll('.md-checkbox').length).toBe(numFiles + 2)
    await step4.findAll('input').at(2).trigger('click')
    wrapper.vm.$nextTick()
    expect(step4.findAll('.md-checkbox').length).toBe(numFiles + 3)
  })
})
