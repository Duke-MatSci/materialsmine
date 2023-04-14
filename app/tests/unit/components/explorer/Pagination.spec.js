import createWrapper from '../../../jest/script/wrapper'
import { enableAutoDestroy } from '@vue/test-utils'
import Pagination from '@/components/explorer/Pagination.vue'

callWindowObject()

// WindowObject mock Since jest jsDOM doesn't recognise window.matchMedia Property
function setWidth (arg, arg2) {
  return arg === arg2
}

function callWindowObject (arg) {
  const resp = Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: setWidth(query, arg),
      media: query,
      onchange: null
    }))
  })
  return resp
}

test('Pagination.vue if tpages is less than or equal 7 on desktop', () => {
  const defaultProps = {
    cpage: 1,
    tpages: 7
  }
  const wrapper = createWrapper(Pagination, { props: defaultProps }, true)
  expect(wrapper.vm.lengths).toBe(defaultProps.tpages)
  expect(wrapper.findAll('button').length).toBe(defaultProps.tpages)
})

test('Pagination.vue if tpages is less than or equal 7 on mobile', () => {
  const defaultProps = {
    cpage: 1,
    tpages: 7
  }
  callWindowObject('(max-width: 27.5em)')
  const wrapper = createWrapper(Pagination, { props: defaultProps }, true)
  expect(wrapper.vm.lengths).toBe(3)
  expect(wrapper.findAll('button').length).toBe(5)
})

test('Pagination.vue if tpages is less than or equal 4 on mobile', () => {
  const defaultProps = {
    cpage: 1,
    tpages: 4
  }
  callWindowObject('(max-width: 27.5em)')
  const wrapper = createWrapper(Pagination, { props: defaultProps }, true)
  expect(wrapper.vm.lengths).toBe(defaultProps.tpages)
  expect(wrapper.findAll('button').length).toBe(defaultProps.tpages)
})

describe('Pagination.vue', () => {
  const defaultProps = {
    cpage: 1,
    tpages: 14
  }
  let wrapper
  beforeEach(() => {
    jest.resetAllMocks()
    if (wrapper) {
      wrapper.destroy()
    }
    callWindowObject()
    wrapper = createWrapper(Pagination, { props: defaultProps }, true)
  })

  enableAutoDestroy(afterEach)

  it('mounts properly', () => {
    expect(wrapper.find('.explorer_page-nav.u_margin-top-med').exists()).toBe(true)
    expect(wrapper.find('button').attributes().class).toBe('md-button md-icon-button md-dense md-primary btn--primary')
    expect(wrapper.find('.md-icon').attributes().class).toBe('md-icon md-icon-font u--default-size md-theme-default')
  })

  it('displays the right number of element', () => {
    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBe(7)
    // expect end ellipsis
    expect(buttons.at(5).find('.md-icon').exists()).toBe(true)
  })

  it('calls the right method when the ellipsis at the end is clicked', async () => {
    const nextRow = jest.spyOn(wrapper.vm, 'nextRow').mockImplementation(() => {})
    const next = wrapper.findAll('button').at(5)
    await next.trigger('click')
    expect(nextRow).toHaveBeenCalledTimes(1)
  })

  it('displays the both ellipsis ', async () => {
    await wrapper.vm.nextRow()
    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBe(9)
    expect(buttons.at(0).text()).toBe('1')
    expect(buttons.at(8).text()).toBe(`${defaultProps.tpages}`)
    expect(buttons.at(1).find('.md-icon').exists()).toBe(true)
    expect(buttons.at(7).find('.md-icon').exists()).toBe(true)
  })

  it('calls the right method when the ellipsis at the beginning is clicked', async () => {
    const prevRow = jest.spyOn(wrapper.vm, 'prevRow').mockImplementation(() => {})
    await wrapper.vm.nextRow()
    const prev = wrapper.findAll('button').at(1)
    await prev.trigger('click')
    expect(prevRow).toHaveBeenCalledTimes(1)
  })

  it('calls the right method when the a number is clicked', async () => {
    const goToItem = jest.spyOn(wrapper.vm, 'goToItem').mockImplementation(() => {})
    await wrapper.findAll('button').at(3).trigger('click')
    await wrapper.findAll('button').at(4).trigger('click')
    expect(goToItem).toHaveBeenNthCalledWith(1, 4)
    expect(goToItem).toHaveBeenNthCalledWith(2, 5)
  })

  it('calls the right method when the last button is clicked', async () => {
    const goToEnd = jest.spyOn(wrapper.vm, 'goToEnd').mockImplementation(() => {})
    const buttons = wrapper.findAll('button')
    await buttons.at(buttons.length - 1).trigger('click')
    expect(goToEnd).toHaveBeenCalledTimes(1)
  })

  // functions assertion
  it('returns true if page entered exists', () => {
    expect(wrapper.vm.itemExists(wrapper.vm.cpage)).toBe(true)
    expect(wrapper.vm.itemExists(defaultProps.tpages)).toBe(true)
  })

  it('returns false if page entered does not exists', () => {
    expect(wrapper.vm.itemExists(wrapper.vm.cpage - 1)).toBe(false)
    expect(wrapper.vm.itemExists(defaultProps.tpages + 1)).toBe(false)
  })

  it('returns the right class if method argument equals page entered ', () => {
    expect(wrapper.vm.itemInput).toEqual(defaultProps.cpage)
    expect(wrapper.vm.isActiveClass(defaultProps.cpage)).toBe('btn--primary')
  })

  it('returns the right class if method argument does not equals page entered ', () => {
    expect(wrapper.vm.itemInput).not.toEqual(defaultProps.cpage + 1)
    expect(wrapper.vm.isActiveClass(defaultProps.cpage + 1)).toBe('u--color-primary')
  })

  it('resets row count and calls the right method', async () => {
    const spy = jest.spyOn(wrapper.vm, 'goToItem').mockImplementation(() => {})
    await wrapper.setData({ offset: 5, rowNumber: 2 })
    await wrapper.vm.goToBeginning()
    expect(wrapper.vm.offset).toBe(0)
    expect(wrapper.vm.rowNumber).toBe(1)
    expect(spy).toHaveBeenCalledWith(1)
  })

  it('moves to the last row of number', async () => {
    await wrapper.setData({ offset: 5, rowNumber: 2 })
    await wrapper.vm.goToLastRow()
    expect(wrapper.vm.offset).toBe(9)
    expect(wrapper.vm.rowNumber).toBe(3)
  })

  it('goToEnd method calls the right methods with the right arguement ', async () => {
    const goToLastRow = jest.spyOn(wrapper.vm, 'goToLastRow').mockImplementation(() => {})
    const goToItem = jest.spyOn(wrapper.vm, 'goToItem').mockImplementation(() => {})
    await wrapper.vm.goToEnd()
    expect(goToLastRow).toHaveBeenCalledTimes(1)
    expect(goToItem).toHaveBeenCalledWith(wrapper.vm.tpages)
  })

  it('goToItem method does nothing if the arguement given does not exist or equals current page', async () => {
    await wrapper.vm.goToItem(defaultProps.cpage)
    await wrapper.vm.goToItem(defaultProps.tpages + 1)
    expect(wrapper.emitted()).not.toHaveProperty('go-to-page')
  })

  it('goToItem method emits the arguement given ', async () => {
    await wrapper.vm.goToItem(3)
    expect(wrapper.emitted('go-to-page')[0]).toEqual([3])
  })

  it('nextRow method modifies the offset and rowNumber ', async () => {
    const offset = wrapper.vm.offset
    const rowNumber = wrapper.vm.rowNumber
    const lengths = wrapper.vm.lengths
    await wrapper.vm.nextRow()
    expect(wrapper.vm.offset).not.toEqual(offset)
    expect(wrapper.vm.offset).toEqual(offset + lengths)
    expect(wrapper.vm.rowNumber).toEqual(rowNumber + 1)
  })

  it('nextRow goes to lastRow if rowNumber is at it limit ', async () => {
    const goToLastRow = jest.spyOn(wrapper.vm, 'goToLastRow').mockImplementation(() => {})
    const limit = wrapper.vm.factor - 1
    await wrapper.setData({ rowNumber: limit })
    await wrapper.vm.nextRow()
    expect(goToLastRow).toHaveBeenCalledTimes(1)
  })

  it('nextRow does nothing if at last row', async () => {
    const goToLastRow = jest.spyOn(wrapper.vm, 'goToLastRow')
    await wrapper.vm.goToLastRow()
    const offset = wrapper.vm.offset
    const rowNumber = wrapper.vm.rowNumber
    await wrapper.vm.nextRow()
    expect(goToLastRow).toHaveBeenCalledTimes(1)
    expect(wrapper.vm.offset).toEqual(offset)
    expect(wrapper.vm.rowNumber).toEqual(rowNumber)
  })

  it('prevRow does nothing if at the first row', async () => {
    const offset = wrapper.vm.offset
    const rowNumber = wrapper.vm.rowNumber
    await wrapper.vm.prevRow()
    expect(wrapper.vm.offset).toEqual(offset)
    expect(wrapper.vm.rowNumber).toEqual(rowNumber)
  })

  it('prevRow goes back by no of lengths ', async () => {
    await wrapper.setData({ offset: 5, rowNumber: 2 })
    await wrapper.vm.prevRow()
    expect(wrapper.vm.offset).toBe(0)
    expect(wrapper.vm.rowNumber).toBe(1)
  })
})
