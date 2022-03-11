import { mapMutations, mapGetters } from 'vuex'
import { JobMgr } from '@/modules/JobMgr.js'
import Dialog from '@/components/Dialog'
import ToolCard from '@/components/nanomine/ToolCard.vue'
// import { Auth } from '@/modules/Auth.js'
export default {
  name: 'Dynamfit',
  components: {
    ToolCard,
    dialogBox: Dialog
  },
  props: {
    card: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  data () {
    return {
      templateName: '',
      templateUrl: '',
      template: null,
      templateUploaded: false,
      weight: 1.0,
      stdRadios: '',
      nEle: 20,
      dtRadios: '',
      jobId: '',
      examplePage: 'noExample',
      auth: {
        // AUTH MOCKED because auth is not yet implemented
        isLoggedIn: () => false,
        isTestUser: () => false
      },
      references: [
        '10.1023/A:1009772018066'
      ]
    }
  },
  beforeMount: function () {
    // this.auth = new Auth()
    if (!this.auth.isLoggedIn()) {
      this.renderDialog('Authorization Error', 'Please log in.')
    }
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
          this.jobId = jobId
          this.resetLoading()
          this.renderDialog(
            'Dynamfit Job Submitted Successfully',
            `Your uploader job is: ${jobId}
             You should receive an email with a link to the job output.`
          )
        },
        function (errCode, errMsg) {
          this.renderDialog(
            'Error Submitting Files for Upload',
            `error code: ${errCode}
            message: ${errMsg}`
          )
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
