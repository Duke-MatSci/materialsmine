import { CONTACT_US_QUERY } from '@/modules/gql/contact-gql'
import dialogBox from '@/components/Dialog.vue'
import { mapMutations, mapGetters } from 'vuex'

export default {
  name: 'Contact',
  components: {
    dialogBox
  },
  data () {
    return {
      dialogTitle: '',
      dialogContent: '',
      dialogType: '',
      name: null,
      email: null,
      contactType: null,
      platform: null,
      message: null,
      errors: []
    }
  },
  computed: {
    ...mapGetters({
      dialogBoxActive: 'dialogBox'
    })
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
      this.$refs.contactForm.reset()
      this.errors = []
    },
    openDialogBox (element) {
      this.dialogType = element.type
      this.dialogTitle = element.header
      this.dialogContent = element.content
      this.toggleDialogBox()
    },
    closeDialogBox () {
      this.toggleDialogBox()
    },
    onSubmit: async function () {
      this.validateForm()
      if (this.errors.length) {
        return
      }
      try {
        await this.$apollo.mutate({
          mutation: CONTACT_US_QUERY,
          variables: {
            input: {
              fullName: this.name,
              email: this.email,
              purpose: this.contactType,
              message: this.message
            }
          }
        })
        this.openDialogBox({
          type: 'Success',
          header: 'Submitted successfully',
          content: 'We would get back to you shortly'
        })
        this.resetForm()
      } catch (error) {
        return this.openDialogBox({
          type: 'Error',
          header: 'Submit Error',
          content: 'Something went wrong!' // Todo: (@tolu) Show specific error message here & try again button!
        })
      }
    },
    ...mapMutations({
      toggleDialogBox: 'setDialogBox'
    })
  },
  watch: {
    dialogBoxActive (newVal, oldVal) {
      if (oldVal && !newVal && this.dialogType === 'Success') {
        this.$router.push('/nm')
      }
    }
  },
  created () {
    this.$store.commit('setAppHeaderInfo', {
      icon: 'mail',
      name: 'Contact Us'
    })
  }
}
