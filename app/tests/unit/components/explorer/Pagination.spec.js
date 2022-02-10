import createWrapper from '../../../jest/script/wrapper'
import { enableAutoDestroy, RouterLinkStub } from '@vue/test-utils'
import Pagination from '@/components/explorer/Pagination.vue'

describe('Pagination.vue', () => {

  const defaultProps = {
    cpage: 1,
    tpages: 4,
  }

  let wrapper
  beforeEach(() => {
    if (wrapper) {
      wrapper.destroy()
    }
    wrapper = createWrapper(Pagination, {props:defaultProps}, true)
  })

  enableAutoDestroy(afterEach)

  it("disables home and prev on page 1", () => {
    expect(wrapper.find('.pagination-button-home').attributes("disabled")).toBe("disabled")
    expect(wrapper.find('.pagination-button-prev').attributes("disabled")).toBe("disabled")
  })

  it("disables next and end on last page", async () => {
    await wrapper.setProps({cpage: defaultProps.tpages})
    expect(wrapper.find('.pagination-button-next').attributes("disabled")).toBe("disabled")
    expect(wrapper.find('.pagination-button-end').attributes("disabled")).toBe("disabled")
  })

  it("goes to page one when home is clicked", async () => {
    await wrapper.setProps({cpage: 2})
    const button = wrapper.find('.pagination-button-home')
    expect(button.attributes("disabled")).toBeUndefined()
    await button.trigger('click')
    const pageEvent = wrapper.emitted('go-to-page')
    expect(pageEvent.length).toBe(1)
    expect(pageEvent[0][0]).toBe(1)
  })

  it("goes to the prev page when prev is clicked", async () => {
    const page = 3
    await wrapper.setProps({cpage: page})
    const button = wrapper.find('.pagination-button-prev')
    expect(button.attributes("disabled")).toBeUndefined()
    await button.trigger('click')
    const pageEvent = wrapper.emitted('go-to-page')
    expect(pageEvent.length).toBe(1)
    expect(pageEvent[0][0]).toBe(page - 1)
  })

  it("goes to the next page when next is clicked", async () => {
    const button = wrapper.find('.pagination-button-next')
    expect(button.attributes("disabled")).toBeUndefined()
    await button.trigger('click')
    const pageEvent = wrapper.emitted('go-to-page')
    expect(pageEvent.length).toBe(1)
    expect(pageEvent[0][0]).toBe(2)
  })

  it("goes to the last page when end is clicked", async () => {
    const button = wrapper.find('.pagination-button-end')
    expect(button.attributes("disabled")).toBeUndefined()
    await button.trigger('click')
    const pageEvent = wrapper.emitted('go-to-page')
    expect(pageEvent.length).toBe(1)
    expect(pageEvent[0][0]).toBe(defaultProps.tpages)
  })
})
