import createWrapper from '../../../jest/script/wrapper'
import DatasetCreateOrSelect from '@/components/nanomine/DatasetCreateOrSelect.vue'

var wrapper = null

global.fetch = jest.fn()
global.fetch.mockReturnValueOnce(
  Promise.resolve({
    data: {
      data: [{ seq: 1, doi: 'testDOI1', title: 'testTitle1', datasetComment: 'testComment1', userID: '0' }]
    }
  }))
  .mockReturnValueOnce(
    Promise.resolve()
  )
  .mockReturnValueOnce(
    Promise.resolve({
      data: {
        data: [{ seq: 1, doi: 'testDOI1', title: 'testTitle1', datasetComment: 'testComment1', userID: '0' },
          { seq: 2, doi: 'testDOI2', title: 'testTitle2', datasetComment: 'testComment2', userID: '0' }]
      }
    })
  )

describe('DatasetCreateOrSelect.vue', () => {
  beforeAll(() => {
    wrapper = createWrapper(DatasetCreateOrSelect, {})
  })

  it('mounts properly', () => {
    expect(wrapper.exists()).toBeTruthy()
  })

  it('displays the provided dataset', () => {
    expect(wrapper.text()).toContain('testDOI1')
    expect(wrapper.text()).toContain('testTitle1')
    expect(wrapper.text()).toContain('testComment1')
  })

  it('requests and displays a new dataset', async () => {
    wrapper.vm.addDatasetSave()
    await wrapper.vm.$nextTick() // one tick to get response, second to update list
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('testDOI1')
    expect(wrapper.text()).toContain('testTitle1')
    expect(wrapper.text()).toContain('testComment1')
    expect(wrapper.text()).toContain('testDOI2')
    expect(wrapper.text()).toContain('testTitle2')
    expect(wrapper.text()).toContain('testComment2')
  })

  it('returns search results', async () => {
    wrapper.setData({ datasetSearch: 'testDOI2' })
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('testDOI2')
    expect(wrapper.text()).not.toContain('testDOI1')
  })
})
