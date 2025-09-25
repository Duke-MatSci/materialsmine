import createWrapper from '../../../../jest/script/wrapper'
import MRS2022 from '@/pages/nanomine/conferences/MRS2022.vue'

describe('MRS2022.vue', () => {
  let wrapper
  beforeAll(() => {
    wrapper = createWrapper(MRS2022, {})
  })

  it('mounts properly', () => {
    expect(wrapper.exists()).toBeTruthy()
  })

  it('provides relevant links', () => {
    const links = wrapper.findAll('a')
    expect(links.length).toBe(3)
    expect(links.at(0).text()).toContain('Tutorial details')
    expect(links.at(1).text()).toContain('Tutorial handout')
    expect(links.at(2).text()).toContain('2022 Materials Research Society Spring Meeting & Exhibit')
  })
})
