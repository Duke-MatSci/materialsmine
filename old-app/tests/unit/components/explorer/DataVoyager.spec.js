import createWrapper from '../../../jest/script/wrapper'
import { enableAutoDestroy } from '@vue/test-utils'

import DataVoyager from '@/components/explorer/DataVoyager.vue'

describe('DataVoyager.vue', () => {
  // Suppress console specifically for Data Voyager tests, not globally
  beforeEach(() => {
    jest.spyOn(console, 'debug').mockImplementation(() => {})
    jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  enableAutoDestroy(afterEach)

  it('renders datavoyager in correct place', () => {
    const wrapper = createWrapper(DataVoyager, {}, false)
    const dvComponent = wrapper.findComponent('#voyager-embed > .voyager')
    expect(dvComponent.exists()).toBeTruthy()
  })
  it('displays field names when passed data', async () => {
    const wrapper = await createWrapper(DataVoyager, { props: { data } }, true)
    await wrapper.vm.$nextTick() // Render data
    expect(wrapper.text()).toContain('qualFieldTest')
    expect(wrapper.text()).toContain('quantFieldTest')
  })
  it('displays data panel containing fields when passed data', async () => {
    const wrapper = await createWrapper(DataVoyager, { props: { data } }, true)
    await wrapper.vm.$nextTick() // Render data
    const dataPanel = wrapper.findComponent('.Pane1')
    expect(dataPanel.exists()).toBeTruthy()
    expect(dataPanel.text()).toContain('Data')
    expect(dataPanel.text()).toContain('qualFieldTest')
    expect(dataPanel.text()).toContain('quantFieldTest')
  })
  it('displays encoding panel when passed data', async () => {
    const wrapper = await createWrapper(DataVoyager, { props: { data } }, true)
    await wrapper.vm.$nextTick() // Render data
    const encodingPanel = wrapper.findComponent('.Pane2')
    expect(encodingPanel.exists()).toBeTruthy()
    expect(encodingPanel.text()).toContain('Encoding')
  })
  it('generates at least one example chart from data', async () => {
    const wrapper = await createWrapper(DataVoyager, { props: { data } }, true)
    await wrapper.vm.$nextTick() // Render data
    const exampleChart = wrapper.findComponent('.chart')
    expect(exampleChart.exists()).toBeTruthy()
  })
})

const data = {
  values: [
    {
      qualFieldTest: 'ABC',
      quantFieldTest: 123
    },
    {
      qualFieldTest: 'DEF',
      quantFieldTest: 456
    },
    {
      qualFieldTest: 'GHI',
      quantFieldTest: 789
    }
  ]
}
