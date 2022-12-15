import createWrapper from '../../../jest/script/wrapper'
import { enableAutoDestroy } from '@vue/test-utils'
import CurateNavBar from '@/components/curate/CurateNavBar.vue'

describe('CurateNavBar.vue', () => {
  const defaultProps = {
    navRoutes: [
      {
        label: 'Curate',
        path: '/explorer/curate'
      },
      {
        label: 'Spreadsheet',
        path: '/explorer/curate/spreadsheet'
      }
    ],
    active: 'Test Active'
  }

  let wrapper
  beforeEach(() => {
    if (wrapper) {
      wrapper.destroy()
    }
    wrapper = createWrapper(CurateNavBar, { props: defaultProps }, true)
  })

  enableAutoDestroy(afterEach)

  it('renders route options correctly', async () => {
    expect.assertions(2)
    const routeItems = wrapper.findAll('.curate-menu-routes')
    expect(routeItems.length).toBe(3)
    expect(wrapper.text()).toContain(defaultProps.active)
  })

  it('renders all routes except one as link', async () => {
    expect.assertions(1)
    const routeItems = wrapper.findAll('a')
    expect(routeItems.length).toBe(2)
  })

  it('contains back button', async () => {
    expect.assertions(2)
    const navBack = wrapper.find('button')
    expect(navBack.exists()).toBe(true)
    expect(navBack.text()).toBe('arrow_back')
  })
})
