import createWrapper from '../../../../jest/script/wrapper'
import XmlVisualizer from '@/pages/explorer/xml/XmlLoader.vue'

const xmlViewer = {
  id: '64394c8032bc6325505af6f9',
  title: 'L183_53_Portschke_2003.xml',
  xmlString: '<xml> <CD> <TITLE>Empire Burlesque</TITLE><ARTIST>Bob Dylan</ARTIST> <COUNTRY>USA</COUNTRY> <COMPANY>Columbia</COMPANY> <PRICE>10.90</PRICE> <YEAR>1985</YEAR> </CD> </xml>'
}

describe('XmlVisualizer.vue', () => {
  let wrapper
  beforeEach(async () => {
    wrapper = await createWrapper(XmlVisualizer, {
      mocks: {
        $apollo: {
          loading: false,
          queries: {
            xmlViewer: {
              refetch: jest.fn()
            }
          }
        }
      }
    }, false)
    await wrapper.setData({ xmlViewer: xmlViewer })
  })

  it('renders XmlVisualizer page correctly', () => {
    expect(wrapper.exists()).toBe(true)
  })

  it('renders page layout correctly', () => {
    expect(wrapper.findAll('div > section').length).toBe(1)
  })

  it('renders page main content layout when xmlViewer object is provided', () => {
    const section = wrapper.find('div > section')
    expect(section.attributes().class).toBe('u_width--max viz-u-postion__rel utility-roverflow')
    expect(section.findAll('div').length).toBe(2)
  })

  it('renders page content correctly', () => {
    const content = wrapper.findComponent('md-content-stub')
    expect(content.find('h2').attributes().class).toBe('visualize_header-h1 u_margin-top-med u_centralize_text')
    expect(content.find('h2').text()).toBe(xmlViewer.title)
    expect(content.find('.wrapper').exists()).toBe(true)
  })

  it('renders page drawer correctly', () => {
    const drawer = wrapper.findComponent('md-drawer-stub')
    expect(drawer.attributes().class).toBe('md-right')
    expect(drawer.findComponent('comment-stub').exists()).toBe(true)
    expect(drawer.findComponent('comment-stub').props().title).toBe(wrapper.vm.title)
    expect(drawer.findComponent('comment-stub').props().identifier).toBe(xmlViewer.id)
    expect(drawer.findComponent('md-button-stub').text()).toBe('close')
  })

  it('renders comment button correctly', () => {
    expect(wrapper.findAllComponents('md-button-stub').at(1).text()).toBe('comment')
    expect(wrapper.findAllComponents('md-button-stub').at(1).attributes().class).toBe('md-fab md-fixed md-dense md-fab-bottom-right md-primary btn--primary')
  })

  it('loads error message if xmlViewer empty correctly', async () => {
    await wrapper.setData({ xmlViewer: {} })
    const section = wrapper.find('div > section')
    expect(section.attributes().class).toBe('section_loader u--margin-toplg')
    expect(section.find('h2').text()).toBe('This XML no longer exists or has been moved')
  })
})
