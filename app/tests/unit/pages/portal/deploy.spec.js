import createWrapper from '../../../jest/script/wrapper'
import Deploy from '@/pages/portal/Deploy.vue'
import router from '@/router'

jest.spyOn(router, 'push').mockImplementation(() => {})
describe('Deploy Page.vue', () => {
  let wrapper
  let startProcess
  let closeDialogBox
  let startLoading
  let shutDownMessage
  let loadMessage
  let checkServerStatus
  let endProcess
  beforeEach(() => {
    wrapper = createWrapper(Deploy, {
      stubs: {
        MdButton: { template: '<button><slot/></button>' },
        MdAppDrawer: { template: '<div><slot/></div>' },
        MdPortal: { template: '<div><slot/></div>' }
      }
    })
    startProcess = jest.spyOn(wrapper.vm, 'startProcess')
    closeDialogBox = jest.spyOn(wrapper.vm, 'closeDialogBox')
    startLoading = jest.spyOn(wrapper.vm, 'startLoading')
    shutDownMessage = jest.spyOn(wrapper.vm, 'shutDownMessage')
    loadMessage = jest.spyOn(wrapper.vm, 'loadMessage')
    checkServerStatus = jest.spyOn(wrapper.vm, 'checkServerStatus')
    endProcess = jest.spyOn(wrapper.vm, 'endProcess')
  })

  afterEach(() => {
    jest.resetAllMocks()
    wrapper.destroy()
  })

  it('mounts properly', () => {
    expect(wrapper.exists()).toBeTruthy()
  })

  it('renders spinner component properly if loading property is true', async () => {
    const text = 'Some Random text'

    expect(wrapper.find('.viz-u-mgup-sm').exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'Spinner' }).exists()).toBe(false)
    await wrapper.setData({ loading: true, loadingMessage: text })
    expect(wrapper.findComponent({ name: 'Spinner' }).exists()).toBe(true)
    expect(wrapper.find('.viz-u-mgup-sm').exists()).toBe(false)
    expect(wrapper.findComponent({ name: 'Spinner' }).props().text).toMatch(text)
  })

  it('renders main text if loading is false', () => {
    const paragraph = wrapper.find('.md-body-1').text()
    expect(wrapper.vm.loading).toBe(false)
    expect(paragraph).toMatch('This task requires super admin priviledges, deploying unapproved changes will require a rollback')
  })

  it('renders buttons properly', () => {
    const button = wrapper.find('button')
    expect(wrapper.vm.loading).toBe(false)
    expect(button.attributes().class).toMatch('md-button btn btn--tertiary btn--noradius')
    expect(button.text()).toMatch('Pull and Deploy Latest Changes')
  })

  it('calls the right method when main button is clicked', async () => {
    const dialogBox = jest.spyOn(wrapper.vm, 'toggleDialogBox').mockImplementation(() => {})
    const button = wrapper.find('button')
    await button.trigger('click')
    expect(dialogBox).toHaveBeenCalledTimes(1)
  })

  it('closeDialogBox method works properly', async () => {
    const dialogBox = jest.spyOn(wrapper.vm, 'toggleDialogBox')
    await wrapper.vm.closeDialogBox()
    expect(dialogBox).toHaveBeenCalledTimes(0)
    await wrapper.find('button').trigger('click')
    await wrapper.vm.closeDialogBox()
    expect(dialogBox).toHaveBeenCalledTimes(2)
  })

  it('startLoading method works properly', async () => {
    expect(wrapper.find('.viz-u-mgup-sm').exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'Spinner' }).exists()).toBe(false)
    await wrapper.vm.startLoading()
    expect(wrapper.vm.loading).toBe(true)
    expect(wrapper.findComponent({ name: 'Spinner' }).exists()).toBe(true)
    expect(wrapper.find('.viz-u-mgup-sm').exists()).toBe(false)
    expect(wrapper.vm.loadingMessage).toMatch('Server is shutting down')
  })

  it('shutDownMessage method works properly', async () => {
    // it needs loading to be true
    await wrapper.setData({ loading: true })
    await wrapper.vm.shutDownMessage()
    expect(wrapper.vm.loading).toBe(true)
    expect(wrapper.findComponent({ name: 'Spinner' }).exists()).toBe(true)
    expect(wrapper.find('.viz-u-mgup-sm').exists()).toBe(false)
    expect(wrapper.vm.loadingMessage).toMatch('Server Shutdown Completed')
  })

  it('loadMessage method works properly', async () => {
    // it needs loading to be true
    await wrapper.setData({ loading: true })
    await wrapper.vm.loadMessage()
    expect(wrapper.vm.loading).toBe(true)
    expect(wrapper.findComponent({ name: 'Spinner' }).exists()).toBe(true)
    expect(wrapper.find('.viz-u-mgup-sm').exists()).toBe(false)
    expect(wrapper.vm.loadingMessage).toMatch('Loading Server')
  })

  it('startProcess method works properly', async () => {
    jest.useFakeTimers()
    jest.spyOn(global, 'setTimeout')
    closeDialogBox = closeDialogBox.mockImplementation(() => {})
    startLoading = startLoading.mockImplementation(() => {})
    shutDownMessage = shutDownMessage.mockImplementation(() => {})
    loadMessage = loadMessage.mockImplementation(() => {})
    checkServerStatus = checkServerStatus.mockImplementation(() => {})
    await wrapper.vm.startProcess()
    jest.runAllTimers()
    expect(closeDialogBox).toHaveBeenCalledTimes(1)
    expect(startLoading).toHaveBeenCalledTimes(1)
    expect(shutDownMessage).toHaveBeenCalledTimes(1)
    expect(loadMessage).toHaveBeenCalledTimes(1)
    expect(checkServerStatus).toHaveBeenCalledTimes(1)
    expect(setTimeout).toHaveBeenCalledTimes(3)
    expect(setTimeout).toHaveBeenNthCalledWith(1, expect.any(Function), 120000)
    expect(setTimeout).toHaveBeenNthCalledWith(2, expect.any(Function), 180000)
    expect(setTimeout).toHaveBeenNthCalledWith(3, expect.any(Function), 300000)
  })

  it('endProcess method works properly', async () => {
    await wrapper.setData({ loading: true, headerText: false })
    const commit = jest.spyOn(wrapper.vm.$store, 'commit').mockImplementation(() => {})
    await wrapper.vm.endProcess()
    expect(commit).toHaveBeenCalledWith('setSnackbar', {
      message: 'Deployment Successful',
      duration: 3000
    })
    expect(wrapper.vm.loading).toBe(false)
    expect(wrapper.vm.headerText).toBe(true)
  })

  it('shutDown method calls snackbar on error', async () => {
    closeDialogBox = closeDialogBox.mockImplementation(() => {})
    const commit = jest.spyOn(wrapper.vm.$store, 'commit').mockImplementation(() => {})
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        redirected: false,
        status: 502,
        statusText: 'Bad Gateway'
      })
    )
    await wrapper.vm.shutDown()
    expect(wrapper.vm.headerText).toBe(false)
    expect(commit).toHaveBeenCalledWith('setSnackbar', {
      message: 'Something went wrong',
      action: expect.any(Function)
    })
    expect(closeDialogBox).toHaveBeenCalledTimes(1)
  })

  it('checkServerStatus method restarts the process on error', async () => {
    closeDialogBox = closeDialogBox.mockImplementation(() => {})
    startProcess = startProcess.mockImplementation(() => {})
    const commit = jest.spyOn(wrapper.vm.$store, 'commit').mockImplementation(() => {})
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        redirected: false,
        status: 502,
        statusText: 'Bad Gateway'
      })
    )
    await wrapper.vm.checkServerStatus()
    expect(commit).toHaveBeenCalledWith('setSnackbar', {
      message: 'Restarting Deployment',
      duration: 3000
    })
    expect(closeDialogBox).toHaveBeenCalledTimes(1)
    expect(startProcess).toHaveBeenCalledTimes(1)
  })

  it('shutDown method calls startProcess', async () => {
    startProcess = startProcess.mockImplementation(() => {})
    closeDialogBox = closeDialogBox.mockImplementation(() => {})
    const commit = jest.spyOn(wrapper.vm.$store, 'commit').mockImplementation(() => {})
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ message: 'Successful' }),
        ok: true,
        redirected: false,
        status: 200,
        statusText: 'OK'
      })
    )
    await wrapper.vm.shutDown()
    expect(wrapper.vm.headerText).toBe(false)
    expect(commit).toHaveBeenCalledTimes(1)
    expect(closeDialogBox).toHaveBeenCalledTimes(0)
    expect(startProcess).toHaveBeenCalledTimes(1)
    expect(fetch).toHaveBeenCalledWith('/api/admin/call-script', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer ' + wrapper.vm.token
      }
    })
  })

  it('checkServerStatus method calls endProcess', async () => {
    endProcess = endProcess.mockImplementation(() => {})
    closeDialogBox = closeDialogBox.mockImplementation(() => {})
    const commit = jest.spyOn(wrapper.vm.$store, 'commit').mockImplementation(() => {})
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ message: 'Successful' }),
        ok: true,
        redirected: false,
        status: 200,
        statusText: 'OK'
      })
    )
    await wrapper.vm.checkServerStatus()
    expect(commit).toHaveBeenCalledTimes(1)
    expect(closeDialogBox).toHaveBeenCalledTimes(0)
    expect(endProcess).toHaveBeenCalledTimes(1)
    expect(fetch).toHaveBeenCalledWith('/api/admin/confirm-script-call', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer ' + wrapper.vm.token
      }
    })
  })
})
