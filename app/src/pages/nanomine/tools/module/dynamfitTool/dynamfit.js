import {} from 'vuex'
import { JobMgr } from '@/modules/JobMgr.js'
import ReferenceContainer from '@/components/nanomine/ReferenceContainer'
// import { Auth } from '@/modules/Auth.js'
export default {
  name: 'Dynamfit',
  components: {
    ReferenceContainer
  },
  data () {
    return {
      // title: 'Dynamfit',
      dialog: false,
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
      auth: { // mocked because auth is not yet implemented
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
        this.uploadError = true
        this.uploadErrorMsg = 'Please upload the .X_T file.'
        return
      }
      if (this.weight === '') {
        this.uploadError = true
        this.uploadErrorMsg = 'Please input the weighting parameter.'
        return
      }
      if (this.stdRadios === '') {
        this.uploadError = true
        this.uploadErrorMsg = 'Please select the type of the standard deviation.'
        return
      }
      if (this.nEle === '') {
        this.uploadError = true
        this.uploadErrorMsg = 'Please input the number of Prony elements.'
        return
      }
      if (this.dtRadios === '') {
        this.uploadError = true
        this.uploadErrorMsg = 'Please select the data type.'
        return
      }
      console.log('Job Submitted!')
      this.setLoading()
      const jm = new JobMgr()
      jm.setJobType('dynamfit')
      jm.setJobParameters({ templateName: this.templateName, weight: this.weight, stddev: this.stdRadios, nEle: this.nEle, dt: this.dtRadios })
      jm.addInputFile(this.templateName, this.templateUrl)
      return jm.submitJob(function (jobId) {
        console.log('Success! JobId is: ' + jobId)
        this.jobId = jobId
        this.resetLoading()
        this.successDlg = true
      }, function (errCode, errMsg) {
        console.log('error: ' + errCode + ' msg: ' + errMsg)
        this.uploadError = true
        this.uploadErrorMsg = 'Error submitting files for upload: errCode: ' + errCode + ' msg: ' + errMsg
        this.resetLoading()
      })
    }
  },
  created () {
    this.$store.commit('setAppHeaderInfo', { icon: 'workspaces', name: 'Dynamfit' })
  }
}
