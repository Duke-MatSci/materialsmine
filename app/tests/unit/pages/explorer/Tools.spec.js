import createWrapper from '../../../jest/script/wrapper'
import { enableAutoDestroy, RouterLinkStub } from '@vue/test-utils'
import ExplorerTools from '@/pages/explorer/Tools.vue'

describe('Tools.vue', () => {
  let wrapper
  beforeEach(async () => {
    wrapper = await createWrapper(ExplorerTools, { }, true)
  })

  enableAutoDestroy(afterEach)

  it('renders tools tab correctly', () => {
    expect.assertions(1)
    const catHeader = wrapper.find('.visualize_header-h1')
    expect(catHeader.exists()).toBe(true)
  })

  it('renders the right page layout', () => {
    expect.assertions(4)
    const sections = wrapper.findAll('div > .section_teams > .curate > div')
    expect(sections.length).toEqual(4)
    expect(sections.at(0).attributes().class).toBeUndefined()
    expect(sections.at(1).attributes().class).toEqual('u_margin-top-med')
    expect(sections.at(2).attributes().class).toEqual('u_margin-top-med')
  })

  it('renders curate category headers', () => {
    expect.assertions(5)
    const catHeaders = wrapper.findAll('.visualize_header-h1')
    expect(catHeaders.length).toEqual(4)
    expect(catHeaders.at(0).text()).toBe('Tools')
    expect(catHeaders.at(1).text()).toBe('Image Binarization')
    expect(catHeaders.at(2).text()).toBe('Microstructure Characterization')
    expect(catHeaders.at(3).text()).toBe('Microstructure Reconstruction')
  })

  it('renders a card for dynamfit', () => {
    const sectionItem = wrapper.findAll('.md-layout-item.md-layout-item_card')
    expect(sectionItem.at(0).findComponent(RouterLinkStub).props().to).toEqual('/explorer/tools/dynamfit')
  })
})
