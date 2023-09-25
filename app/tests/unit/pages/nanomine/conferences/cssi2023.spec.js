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
    const conferenceLink = links.at(0)
    // const posterLink = links.at(1) // Update when link is provided
    const metamaterialViz = links.at(2) // Update when visualization is integrated
    expect(conferenceLink.attributes('href')).toBe('https://www.cssi-pi2023.org/')
    expect(metamaterialViz.attributes('href')).toBe('https://metamaterials.northwestern.edu/')
  })

  it('provides a full list of publications', () => {
    const publications = wrapper.findAll('li')
    expect(publications.length).toBe(18)
  })
})
