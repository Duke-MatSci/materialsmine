import { JobMgr } from '@/modules/JobMgr.js'
// import { Auth } from '@/modules/Auth.js'
import ReferenceContainer from '@/components/nanomine/ReferenceContainer.vue'
import Dialog from '@/components/Dialog.vue'
import DatasetCreateOrSelect from '@/components/nanomine/DatasetCreateOrSelect.vue'
import { mapMutations, mapGetters } from 'vuex'

export default {
  name: 'XMLUploader',
  components: {
    ReferenceContainer,
    dialogBox: Dialog,
    DatasetCreateOrSelect
  },
  data: () => ({
    title: 'File Upload',
    dialog: false,
    templateName: '',
    templateUrl: '',
    template: null,
    files: [],
    filesDisplay: [],
    templateUploaded: false,
    jobId: '',
    datasetOptions: { mineOnly: 'always' },
    datasetSelected: null,
    references: [
      '10.1063/1.4943679',
      '10.1063/1.5046839'
    ],
    auth: {
      // AUTH MOCKED because auth is not yet implemented
      isLoggedIn: () => false,
      isTestUser: () => false
    }
  }),
  computed: {
    ...mapGetters({
      dialogBoxActive: 'dialogBox'
    })
  },
  beforeMount: function () {
    // this.auth = new Auth()
    if (!this.auth.isLoggedIn()) {
      this.renderDialog('Login Required', 'Login is required before uploading files.')
    }
  },
  methods: {
    goBack () {
      return window.history.go(-1)
    },
    datasetSelectedHandler (dataset) {
      this.datasetSelected = dataset
    },
    setLoading: function () {
      this.$store.commit('isLoading')
    },
    resetLoading: function () {
      this.$store.commit('notLoading')
    },
    pickFile () {
      this.$refs.myUpload.click()
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
    resetFiles: function () {
      this.files = []
      this.filesDisplay = []
    },
    onTemplatePicked (e) {
      this.resetTemplate()
      const files = e.target.files
      const file = {}
      const f = files[0]
      if (f !== undefined) {
        this.templateName = f.name
        file.fileName = this.templateName
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
    onFilePicked (e) {
      this.resetFiles()
      const files = e.target.files
      for (let i = 0; i < files.length; i++) {
        const file = {}
        const f = files[i]
        if (f !== undefined) {
          file.fileName = f.name
          if (file.fileName.lastIndexOf('.') <= 0) {
            return
          }
          const fr = new FileReader()
          fr.readAsDataURL(f)
          fr.addEventListener('load', () => {
            file.fileUrl = fr.result
            this.files.push(file)
            this.filesDisplay.push(file)
          })
        }
      }
    },
    successDlgClicked: function () {
      this.$router.go(-1) // go back to previous page
    },
    submit: function () {
      if (this.template != null) {
        this.files.unshift(this.template)
      } else {
        this.renderDialog('Upload Error', 'Missing Template File')
        return
      }
      this.setLoading()
      const jm = new JobMgr()
      const vm = this
      jm.setJobType('xmlconv')
      jm.setJobParameters({ datasetId: this.datasetSelected._id, templateName: this.templateName })
      this.files.forEach(function (v) {
        jm.addInputFile(v.fileName, v.fileUrl)
      })
      return jm.submitJob(function (jobId) {
        vm.jobId = jobId
        vm.resetLoading()
        vm.renderDialog('Uploader Job Submitted Successfully', `Your uploader job is: ${jobId}
        You should receive an email with a link to the job output.`, vm.successDlgClicked)
      }, function (errCode, errMsg) {
        vm.renderDialog('Upload Error', `Error submitting files for upload: errCode: ${errCode} msg: ${errMsg}`)
        vm.resetLoading()
      })
    },
    ...mapMutations({
      toggleDialogBox: 'setDialogBox'
    }),
    renderDialog (title, content, closeHandler) {
      this.dialog = {
        title,
        content,
        closeHandler: closeHandler || this.toggleDialogBox
      }
      this.toggleDialogBox()
    }
  },
  created () {
    this.$store.commit('setAppHeaderInfo', { icon: 'cloud_upload', name: 'Data Uploader' })
  }
}
