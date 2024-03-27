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
      errors: [],
      fileName: ''
    }
  },
  computed: {
    ...mapGetters({
      dialogBoxActive: 'dialogBox',
      isAuth: 'auth/isAuthenticated'
    }),
    reducedName () {
      const file = this.fileName
      const arr = file.split('/')
      return arr.length > 3 ? arr[3].substring(0, 40) : file
    }
  },
  methods: {
    async onInputChange (e) {
      this.displayInfo('Uploading File...')
      const file = [...e.target?.files]

      const isFileValid = this.validateFile(file[0]?.name)

      if (!isFileValid) return this.displayInfo('Unsupported file format')

      try {
        if (this.isAuth) {
          const { fileLink } = await this.$store.dispatch('uploadFile', {
            file,
            isTemp: true
          })
          if (fileLink) {
            this.fileName = fileLink
            this.displayInfo('Upload Successful', 1500)
          }
        } else {
          return this.displayInfo('To upload a file, you need to log in', 3000)
        }
      } catch (err) {
        this.$store.commit('setSnackbar', {
          message: err?.message || 'Something went wrong',
          action: () => this.onInputChange(e)
        })
      } finally {
        e.target.value = null
      }
    },
    displayInfo (msg, duration) {
      if (msg) {
        this.$store.commit('setSnackbar', {
          message: msg,
          duration: duration ?? 3000
        })
      }
    },
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
    validateFile (fileName) {
      if (!fileName) return false
      const supportedTypes = [
        'png',
        'jpg',
        'jpeg',
        'tiff',
        'tif',
        'csv',
        'zip',
        'xls',
        'xlsx'
      ]
      const fileExtention = fileName.split('.').at(-1)
      if (!fileExtention) return false
      return supportedTypes.includes(fileExtention)
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
        const payload = {
          fullName: this.name,
          email: this.email,
          purpose: this.contactType,
          message: this.message,
          attachments: this.fileName
        }
        const query = await this.$store.dispatch('contact/contactUs', payload)
        if (!query) {
          throw new Error('Failed to Submit')
        }
        this.openDialogBox({
          type: 'Success',
          header: 'Submitted successfully',
          content: 'We will get back to you shortly'
        })
        this.resetForm()
      } catch (error) {
        this.$store.commit(
          'setSnackbar',
          {
            message: error?.message ?? 'Something went wrong!',
            action: () => this.onSubmit()
          },
          { root: true }
        )
      }
    },
    async removeImage () {
      const name = this.fileName
      if (!name) return

      const { deleted, error } = await this.$store.dispatch('deleteFile', {
        name,
        isTemp: true
      })
      if (!error && deleted) {
        this.fileName = ''
        return
      }
      this.$store.commit('setSnackbar', {
        message: 'Something went wrong',
        action: () => this.removeImage()
      })
    },
    loginAlert () {
      this.displayInfo(
        'Login Required: Login is required before uploading files.'
      )
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
