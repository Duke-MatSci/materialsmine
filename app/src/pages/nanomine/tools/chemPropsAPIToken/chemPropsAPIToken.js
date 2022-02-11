import {} from 'vuex'
// import { Auth } from '@/modules/Auth.js'
const SERVER = `${window.location.origin}/nmr/api`
const URL = SERVER

export default {
  name: 'ChemPropsAPIToken',
  data () {
    return {
      title: 'ChemPropsAPIToken',
      auth: { // mocked because auth is not yet implemented
        isLoggedIn: () => false,
        isTestUser: () => false
      },
      accessAuth: false,
      domainsecret: null,
      submitError: false,
      sValue: true,
      address: window.location.origin,
      chempropsToken: null,
      loginRequired: false,
      loginRequiredMsg: ''
    }
  },
  beforeMount: function () {
    const vm = this
    // vm.auth = new Auth()
    if (!vm.auth.isLoggedIn()) {
      vm.loginRequired = true
    }
  },
  async mounted () {
    const vm = this
    vm.checkIfApiExist()
  },
  methods: {
    getUserLoginLink () {
      let rv = '/secure'
      if (this.auth.isTestUser() === true) {
        rv = '/nmr/nmdevlogin'
      }
      return rv
    },
    async submitRequest () {
      this.submitError = false
      this.loginRequiredMsg = null
      if (this.auth.isLoggedIn() && this.domainsecret != null) {
        try {
          const cookies = this.auth.getCookieToken()
          let result = await fetch(`${URL}/create`, {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
              Authorization: 'Bearer ' + cookies
            },
            body: JSON.stringify({ domain: this.domainname, token: this.domainsecret })
          })
          if (result && result.status === 201) {
            result = await result.json()
            this.accessAuth = result
            return this.accessAuth
          } else {
            result = await result.json()
            this.submitError = true
            this.loginRequiredMsg = result.mssg
            return this.loginRequiredMsg
          }
        } catch (err) {
          this.submitError = true
          this.loginRequiredMsg = err
          console.log(err)
          throw err
        }
      } else {
        this.submitError = true
        this.loginRequiredMsg = 'Secret fields are required!'
      }
    },
    async checkIfApiExist () {
      if (this.auth.isLoggedIn()) {
        const cookies = this.auth.getCookieToken()
        let result = await fetch(`${URL}/check`, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + cookies
          }
        })
        if (result && result.status === 201) {
          result = await result.json()
          if (result && result.token) {
            this.accessAuth = result
            return this.accessAuth
          }
        }
      }
    }
  },
  created () {
    this.$store.commit('setAppHeaderInfo', { icon: 'workspaces', name: 'ChemProps API' })
  }
}
