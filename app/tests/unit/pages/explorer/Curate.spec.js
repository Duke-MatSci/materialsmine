import createWrapper from '../../../jest/script/wrapper'
import { enableAutoDestroy, RouterLinkStub } from '@vue/test-utils'
import ExplorerCurate from '@/pages/explorer/Curate.vue'

describe('Curate.vue', () => {
  let wrapper
  beforeEach(async () => {
    wrapper = await createWrapper(ExplorerCurate, { }, false)
  })

  enableAutoDestroy(afterEach)

  it('renders curate tab correctly', () => {
    expect.assertions(1)
    const catHeader = wrapper.find('.visualize_header-h1')
    expect(catHeader.exists()).toBe(true)
  })

  it('renders the right page layout', () => {
    expect.assertions(4)
    const sections = wrapper.findAll('div > .section_teams > .curate > div')
    expect(sections.length).toEqual(3)
    expect(sections.at(0).attributes().class).toBeUndefined()
    expect(sections.at(1).attributes().class).toEqual('u_margin-top-med')
    expect(sections.at(2).attributes().class).toEqual('u_margin-top-med')
  })

  it('renders curate category headers', () => {
    expect.assertions(4)
    const catHeaders = wrapper.findAll('.visualize_header-h1')
    expect(catHeaders.length).toEqual(3)
    expect(catHeaders.at(0).text()).toBe('Curate')
    expect(catHeaders.at(1).text()).toBe('Valid Curation List Entry')
    expect(catHeaders.at(2).text()).toBe('Create Visualization')
  })

  it('renders valid curation list Item', () => {
    expect.assertions(7)
    const section = wrapper.findAll('div > .section_teams > .curate > div').at(1)
    const sectionItem = section.findAll('.md-layout-item.md-layout-item_card')
    expect(section.find('h2.visualize_header-h1.metamine_footer-ref-header').text()).toEqual('Valid Curation List Entry')
    expect(section.find('.md-layout.md-layout-responsive').exists()).toBeTruthy()
    expect(sectionItem.length).toBe(3)
    expect(sectionItem.at(0).attributes().class).toEqual('md-layout-item md-layout-item_card')
    expect(sectionItem.at(0).findComponent(RouterLinkStub).props().to).toEqual('/explorer/curate/validList/all')
    expect(sectionItem.at(1).findComponent(RouterLinkStub).props().to).toEqual('/explorer/curate/validList')
    expect(sectionItem.at(2).findComponent(RouterLinkStub).props().to).toEqual('/explorer/curate/validList/update')
  })
})
