export default {
  name: 'Contact',
  data () {
    return {
      name: null,
      email: null,
      contactType: null,
      platform: null,
      message: null,
      errors: []
    }
  },
  methods: {
    validateForm: function () {
      this.errors = []
      if (!this.name) {
        this.errors.push('Name required')
      }
      if (!this.email) {
        this.errors.push('Email required')
      } else if (!this.validEmail(this.email)) {
        this.errors.push('Valid email required.')
      }

      if (!this.contactType) {
        this.errors.push('Contact type required')
      }

      if (!this.message || this.message.trim() === '') {
        this.errors.push('Message required')
      }
      if (!this.platform) {
        this.errors.push('Please select nanomine or metamine platform')
      }

      if (!this.errors.length) {
        return true
      }
    },
    validEmail: function (email) {
      const re =
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      return re.test(email)
    },

    resetForm: function () {
      this.name = null
      this.email = null
      this.message = null
      this.contactType = null
      this.message = null
      this.errors = []
    },

    onSubmit: async function () {
      this.validateForm()
      if (this.errors.length) {
        return
      }

      await fetch('/nmr/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          // platform: this.platform,
          contactType: this.contactType,
          contactText: this.message
        })
      }).catch((err) => {
        console.log(err)
      })

      this.resetForm()
    }
  },
  created () {
    this.$store.commit('setAppHeaderInfo', {
      icon: 'mail',
      name: 'Contact Us'
    })
  }
}
