import { mapMutations, mapGetters } from 'vuex'
import { JobMgr } from '@/modules/JobMgr.js'
import ReferenceContainer from '@/components/nanomine/ReferenceContainer'
import Dialog from '@/components/Dialog'
// import { Auth } from '@/modules/Auth.js'
export default {
  name: 'Dynamfit',
  components: {
    ReferenceContainer,
    dialogbox: Dialog
  },
  data () {
    return {
      // title: 'Dynamfit',
      templateName: '',
      templateUrl: '',
      template: null,
      templateUploaded: false,
      weight: 1.0,
      stdRadios: '',
      nEle: 20,
      dtRadios: '',
      uploadError: false,
      uploadErrorMsg: '',
      loginRequired: false,
      loginRequiredMsg: '',
      successDlg: false,
      jobId: '',
      references: [],
      examplePage: 'noExample',
      dialog: {
        title: ''
      },
      auth: {
        // AUTH MOCKED because auth is not yet implemented
        isLoggedIn: () => false,
        isTestUser: () => false
      }
    }
  },
  beforeMount: function () {
    // this.auth = new Auth()
    if (!this.auth.isLoggedIn()) {
      this.loginRequired = true
      this.loginRequiredMsg = 'Login is required.'
    }
  },
  mounted () {
    this.references = this.$store.getters.dynamfitReferences
  },
  methods: {
    ...mapMutations({
      toggleDialogBox: 'setDialogBox'
    }),
    setLoading: function () {
      this.$store.commit('isLoading')
    },
    resetLoading: function () {
      this.$store.commit('notLoading')
    },
    pickTemplate () {
      this.$refs.myTemplate.click()
    },
    resetTemplate: function () {
      this.templateName = ''
      this.templateUrl = ''
      this.template = null
      this.templateUploaded = false
    },
    onTemplatePicked (e) {
      console.log('inside onTemplatePicked')
      this.resetTemplate()
      const files = e.target.files
      console.log('shouldnt reach here')
      const file = {}
      const f = files[0]
      if (f !== undefined) {
        this.templateName = f.name
        file.fileName = this.templateName
        if (this.templateName.lastIndexOf('.') <= 0) {
          console.log('Error No Extension: ' + this.templateName)
        }
        const fr = new FileReader()
        fr.readAsDataURL(f)
        fr.addEventListener('load', () => {
          this.templateUrl = fr.result
          file.fileUrl = this.templateUrl
          this.template = file
          this.templateUploaded = true
        })
      } else {
        this.resetTemplate()
      }
    },
    successDlgClicked: function () {
      console.log('Success dlg button clicked')
      // this.$router.go(-1) // go back to previous page
      this.successDlg = false
    },
    submit: function () {
      if (!this.templateUploaded) {
        if (this.examplePage === 'inputTest') {
          this.renderDialog('Upload Error', 'Please upload EXAMPLE.X_T.')
        } else {
          this.renderDialog('Upload Error', 'Please upload the .X_T file.')
        }
        return
      }
      if (this.weight === '') {
        this.renderDialog(
          'Input Error',
          'Please input the weighting parameter.'
        )
        return
      }
      if (this.stdRadios === '') {
        this.renderDialog(
          'Input Error',
          'Please select the type of the standard deviation.'
        )
        return
      }
      if (this.nEle === '') {
        this.renderDialog(
          'Input Error',
          'Please input the number of Prony elements.'
        )
        return
      }
      if (this.dtRadios === '') {
        this.renderDialog('Input Error', 'Please select the data type.')
        return
      }
      console.log('Job Submitted!')
      this.setLoading()
      const jm = new JobMgr()
      jm.setJobType('dynamfit')
      jm.setJobParameters({
        templateName: this.templateName,
        weight: this.weight,
        stddev: this.stdRadios,
        nEle: this.nEle,
        dt: this.dtRadios
      })
      jm.addInputFile(this.templateName, this.templateUrl)
      return jm.submitJob(
        function (jobId) {
          console.log('Success! JobId is: ' + jobId)
          this.jobId = jobId
          this.resetLoading()
          this.successDlg = true
        },
        function (errCode, errMsg) {
          console.log('error: ' + errCode + ' msg: ' + errMsg)
          this.uploadError = true
          this.uploadErrorMsg =
            'Error submitting files for upload: errCode: ' +
            errCode +
            ' msg: ' +
            errMsg
          this.resetLoading()
        }
      )
    },
    displayExample: function (example) {
      const examplePages = ['noExample', 'exampleInput', 'inputTest']
      if (examplePages.includes(example)) {
        this.examplePage = example
      } else {
        this.examplePage = 'noExample'
      }
    },
    renderDialog (title, content, minWidth) {
      this.dialog = {
        title,
        content,
        minWidth
      }
      this.toggleDialogBox()
    }
  },
  watch: {
    examplePage: function () {
      if (this.examplePage === 'exampleInput') {
        this.stdRadios = 'std1'
        this.dtRadios = 'dt2'
      } else {
        this.stdRadios = ''
        this.dtRadios = ''
      }
    }
  },
  created () {
    this.$store.commit('setAppHeaderInfo', {
      icon: 'workspaces',
      name: 'Dynamfit'
    })
  },
  computed: {
    ...mapGetters({
      dialogBoxActive: 'dialogBox'
    })
  }
}
