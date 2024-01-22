import createWrapper from '../../../jest/script/wrapper'
import { enableAutoDestroy } from '@vue/test-utils'
import DataInfo from '@/components/metamine/visualizationNU/DataInfo.vue'

describe('DataInfo.vue', () => {
  let wrapper
  beforeEach(async () => {
    wrapper = await createWrapper(DataInfo, {}, true)
  })

  enableAutoDestroy(afterEach)
  afterEach(async () => {
    wrapper.destroy()
  })

  it('renders layout properly ', () => {
    expect(
      wrapper
        .find('div.data-row > div.article_metadata_strong.md-title')
        .exists()
    ).toBe(true)
  })

  it('renders empty table if fetchedNames is empty ', () => {
    const chips = wrapper.findAll('div.md-chip.md-theme-default')
    expect(chips.length).toBe(0)
    expect(wrapper.vm.fetchedNames.length).toBe(0)
  })

  it('renders table based on fetchedNames properly ', async () => {
    expect.assertions(4)
    await wrapper.vm.$store.commit('metamineNU/setFetchedNames', fetchedNames)
    const chips = wrapper.findAll('div.md-chip.md-theme-default')
    expect(chips.length).toBe(fetchedNames.length)
    expect(wrapper.vm.fetchedNames.length).toBe(fetchedNames.length)

    for (let i = 0; i < chips.length; i++) {
      expect(chips.at(i).text()).toContain(fetchedNames[i].name)
    }
  })
})

const fetchedNames = [
  {
    key: 0,
    bucket_name: 'metamine',
    name: 'lattice_2d_sample.csv.csv',
    color: '#FFB347'
  },
  {
    key: 1,
    bucket_name: 'metamine',
    name: 'freeform_2d_sample.csv.csv',
    color: '#8A8BD0'
  }
]
