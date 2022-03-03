import ReferenceContainer from '@/components/nanomine/ReferenceContainer'
import Dialog from '@/components/Dialog'
import ImageUpload from '@/components/nanomine/ImageUpload'
import { JobMgr } from '@/modules/JobMgr.js'
import ToolCard from '@/components/nanomine/ToolCard'

import { mapGetters, mapMutations } from 'vuex'
// import {Auth} from '@/modules/Auth.js'
import Jszip from 'jszip'

export default {
  name: 'MCRToolTemplate',
  components: {
    ToolCard,
    ReferenceContainer,
    ImageUpload,
    dialogbox: Dialog
  },
  props: {
    tool: {
      type: Object,
      required: true
    },
    card: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  sockets: {
    finished: function (data) {
      this.results.jobid = data
      this.results.uri = '/nmf/jobdata/' + data
      this.setLoading()
      return fetch(this.results.uri + '/job_output_parameters.json')
        .then(function (response) {
          this.results.files = response.data.files // use files array instead of individual file references
          this.results.obtained = true
          this.resetLoading()
        })
        .catch(function (err) {
          this.renderDialog({
            title: 'Socket Error',
            content: err.message,
            reason: 'socketError'
          })
          this.resetLoading()
        })
    },
    hello: function (data) {
      if (data === 'connection received' && this.tool.useWebsocket === true) {
        this.useWebsocket = true
      }
    }
  },
  data: function () {
    return {
      pageContent: {
        references: []
      },
      job: {
        submit: {
          submitButtonTitle: ''
        }
      },
      jobId: '',
      dialog: {
        title: '',
        content: '',
        reason: ''
      },
      files: undefined,
      selectedOptions: {},
      useWebsocket: false,
      results: {
        obtained: false,
        files: undefined,
        uri: undefined,
        jobid: undefined,
        submitted: false,
        downloading: false
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
      this.renderDialog({
        title: 'Authorization Error',
        content: 'Login is required, please log in',
        reason: 'loginRequired'
      })
    }
  },
  mounted () {
    this.resetContent()
    this.$socket.emit('testConnection')
  },
  computed: {
    toolName: function () {
      if (this.tool) {
        return this.tool.name || ''
      } else {
        return this.toolProp
      }
    },
    ...mapGetters({
      dialogBoxActive: 'dialogBox'
    })
  },
  methods: {
    resetContent () {
      this.$store.commit('setAppHeaderInfo', { icon: 'workspaces', name: this.tool.title })
    },
    ...mapMutations({
      toggleDialogBox: 'setDialogBox'
    }),
    renderDialog ({ title, content, reason }) {
      if (!this.dialogBoxActive) {
        this.dialog = {
          title,
          content,
          reason
        }
      }
      this.toggleDialogBox()
    },
    successDlg () {
      let contentSockets
      if (this.tool.useWebsocket) {
        contentSockets = 'Please stay on this page. Results may take up to a few minutes to load.'
      } else {
        contentSockets = 'You should receive an email with a link to the job output.'
      }
      this.renderDialog({
        title: `${this.tool.jobTitle} Job Submitted Successfully`,
        content: `Your ${this.tool.jobTitle} job is: ${this.toolId}<br />${contentSockets}`,
        reason: 'successDlg'
      })
    },
    uploadError (errorMsg) {
      this.renderDialog({
        title: 'Upload Error',
        content: errorMsg,
        reason: 'uploadError'
      })
    },
    download: async function () {
      const jszipObj = new Jszip()
      const vm = this
      vm.results.downloading = true

      function getBase64 (image) {
        return new Promise((resolve, reject) => {
          image.onload = function () {
            canvas.width = image.width
            canvas.height = image.height
            ctx.drawImage(image, 0, 0)
            resolve(canvas.toDataURL())
          }
        })
      }

      // add images to zip file
      for (let i = 0; i < vm.results.files.length; i++) {
        var canvas = document.createElement('canvas')
        var ctx = canvas.getContext('2d')
        var image = new Image()
        image.src = vm.results.uri + '/' + vm.results.files[i].output

        var base64Image = await getBase64(image)

        jszipObj.file('output-' + (i + 1) + '.jpg', base64Image.split(',').pop(), { base64: true })
      }

      // create zip file & download
      jszipObj.generateAsync({ type: 'base64', compression: 'DEFLATE' })
        .then(function (base64) {
          var downloadFile = 'data:application/zip;base64,' + base64
          var link = document.createElement('a')
          link.href = downloadFile
          link.download = 'output.zip'
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          vm.results.downloading = false
        })
    },
    getResultImage: function (index, type) {
      if (type === 'input') {
        return this.results.uri + '/' + this.results.files[index].input
      } else {
        return this.results.uri + '/' + this.results.files[index].output
      }
    },

    setFiles: function (files) {
      this.files = files // the actual file object
    },

    setSelectors: function (selectedOptions) {
      this.selectedOptions = selectedOptions
    },

    setLoading: function () {
      this.$store.commit('isLoading')
    },

    resetLoading: function () {
      this.$store.commit('notLoading')
    },

    submit: function () {
      this.setLoading()

      if (this.files === undefined) {
        this.renderDialog({
          title: 'File Error',
          content: 'Please select a file to process.',
          reason: 'noFiles'
        })
        this.resetLoading()
        return
      }

      const jm = new JobMgr()
      jm.setJobType(this.tool.submit.submitJobTitle)

      var jobParameters = { InputType: this.files.fileType, useWebsocket: this.useWebsocket } // Figure out which file type
      for (var key in this.selectedOptions) {
        if (key === 'phase') {
          jobParameters[key] = this.phaseToString(this.selectedOptions[key])
        } else if (key === 'dimensions') {
          jobParameters[key] = this.dimensionToString(this.selectedOptions[key])
        } else {
          jobParameters[key] = this.selectedOptions[key]
        }
      }
      if ('submitJobType' in this.tool.submit) {
        jobParameters.jobtype = this.tool.submit.submitJobType
      }
      jm.setJobParameters(jobParameters)

      jm.addInputFile(this.files.name, this.files.url)

      return jm.submitJob(function (jobId) {
        this.$socket.emit('newJob', jobId)
        this.results.submitted = true
        this.results.obtained = false
        this.toolId = jobId
        this.resetLoading()
        this.successDlg = true
      }, function (errCode, errMsg) {
        this.renderDialog({
          title: 'Job Error',
          content: `error: ${errCode} msg: ${errMsg}`,
          reason: `jobError-${errCode}`
        })
        this.resetLoading()
      })
    },

    phaseToString: function (phaseObj) {
      var returnString = ''
      for (var key in phaseObj) {
        if (returnString !== '') {
          returnString += '|'
        }
        returnString += phaseObj[key].x_offset + '*' + phaseObj[key].y_offset
      }
      return returnString
    },

    dimensionToString: function (dimensionObj) {
      if ('ratio' in dimensionObj === false) {
        return '1'
      } else if (dimensionObj.ratio === null || dimensionObj.ratio === 0) {
        return '1'
      }
      return dimensionObj.ratio.toString()
      // return dimensionObj['width'] + '*' + dimensionObj['height'] + '*' + dimensionObj['units']
    }
  },
  watch: {
    $route (to, from) {
      this.resetContent()
    }
  }
}
