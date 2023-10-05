import createWrapper from '../../../../jest/script/wrapper'
import CSSI2023 from '@/pages/nanomine/conferences/CSSI2023.vue'

describe('CSSI2023.vue', () => {
  let wrapper
  beforeAll(() => {
    wrapper = createWrapper(CSSI2023, {})
  })

  it('mounts properly', () => {
    expect(wrapper.exists()).toBeTruthy()
  })

  it('provides links to relevant resources', () => {
    const links = wrapper.findAll('a')
    expect(links.length).toBeGreaterThan(3)
    expect(links.at(0).attributes('href')).toBe('https://www.cssi-pi2023.org/')
    expect(links.at(1).attributes('href')).toBe('https://doi.org/10.6084/m9.figshare.24201960.v1')
    expect(links.at(2).attributes('href')).toBe('https://metamaterials.northwestern.edu/') // Update when visualization is integrated
  })

  it('provides a full list of publications', () => {
    const publications = wrapper.findAll('li')
    expect(publications.length).toBe(18)
  })
})
