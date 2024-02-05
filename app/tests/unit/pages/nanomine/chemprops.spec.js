import createWrapper from '../../../jest/script/wrapper'
import { enableAutoDestroy } from '@vue/test-utils'
import ChemProps from '@/pages/nanomine/tools/chemProps/ChemProps.vue'

describe('ChemProps.vue', () => {
  let wrapper
  beforeEach(() => {
    wrapper = createWrapper(ChemProps, {
      stubs: {
        dialogBox: { template: '<div id="dialogBox"><slot/></div>' }
      }
    })
  })
  enableAutoDestroy(afterEach)

  it('mounts properly', () => {
    expect(wrapper.exists()).toBeTruthy()
  })

  // TODO write tests for form logic, once SMILES api is in place
  describe('ChemProps.vue request button', () => {
    afterEach(async () => {
      await jest.clearAllMocks()
      await wrapper.destroy()
    })

    it.skip('does not show token to unauthorised users', async () => {
      const snackbar = jest.spyOn(wrapper.vm.$store, 'commit')
      const isLoggedIn = wrapper.vm.isAuth
      const tokenVisible = () => wrapper.vm.tokenVisible
      const button = wrapper.find('button')

      expect(tokenVisible()).toBe(false)

      button.trigger('click')

      expect(isLoggedIn).toBe(false)
      expect(snackbar).toHaveBeenCalledWith('setSnackbar', {
        duration: 4000,
        message: 'Unauthorized User'
      })
      expect(snackbar).toHaveBeenCalledTimes(1)
      expect(tokenVisible()).toBe(false)
    })

    it.skip('does show token to authorised users', async () => {
      // log in user
      const user = {
        token: 'token',
        userId: 'userId',
        displayName: 'displayName',
        isAdmin: 'isAdmin',
        surName: 'surName',
        givenName: 'givenName'
      }
      await wrapper.vm.$store.commit('auth/setUser', user)
      // throw [wrapper.vm.isAuth, wrapper.vm.$store.getters['auth/token']]

      const tokenVisible = () => wrapper.vm.tokenVisible
      const button = wrapper.find('button')

      expect(tokenVisible()).toBe(false)
      button.trigger('click')
      expect(tokenVisible()).toBe(true)
    })

    // TODO write tests for form logic, once SMILES api is in place
  })
})
