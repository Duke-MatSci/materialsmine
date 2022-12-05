import DropZone from '@/components/curate/FileDrop.vue'
import FilePreview from '@/components/curate/FilePreview.vue'
import LoginRequired from '@/components/LoginRequired.vue'
import Dialog from '@/components/Dialog.vue'
import CurateNavBar from '@/components/curate/CurateNavBar.vue'
import Spinner from '@/components/Spinner.vue'
import useFileList from '@/modules/file-list'
import { VERIFY_AUTH_QUERY, USER_DATASET_IDS_QUERY, CREATE_DATASET_MUTATION } from '@/modules/gql/dataset-gql'
import { mapGetters, mapMutations } from 'vuex'

// Create separate file objects for spreadsheet vs supplementary files
const spreadsheetFn = useFileList()
const suppFn = useFileList()

export default {
  name: 'SpreadsheetHome',
  components: {
    dialogbox: Dialog,
    DropZone,
    FilePreview,
    CurateNavBar,
    Spinner,
    LoginReq: LoginRequired
  },
  data () {
    return {
      auth: true,
      verifyUser: null,
      loading: false,
      uploadInProgress: true,
      selectedDataset: {
        label: '',
        id: null
      },
      spreadsheetFiles: spreadsheetFn.files,
      suppFiles: suppFn.files,
      uploadedFiles: null,
      title: null,
      doi: null,
      active: 'first',
      first: false,
      second: false,
      third: false,
      fourth: false,
      fifth: false,
      sixth: false,
      isInvalidForm: false,
      dialog: {
        title: '',
        type: null,
        size: 60,
        disableClose: false
      },
      routes: [
        {
          label: 'Curate',
          path: '/explorer/curate'
        },
        {
          label: 'Spreadsheet',
          path: '/explorer/curate/spreadsheet'
        }
      ]
    }
  },
  props: {
    datasetId: {
      type: String
    }
  },
  computed: {
    ...mapGetters({
      userId: 'auth/userId',
      isAuthenticated: 'auth/isAuthenticated',
      dialogBoxActive: 'dialogBox'
    })
  },
  methods: {
    addSpreadsheet: spreadsheetFn.addFiles,
    removeSpreadsheet: spreadsheetFn.removeFile,
    modStatSpreadsheet: spreadsheetFn.modifyStatus,
    addSupp: suppFn.addFiles,
    removeSupp: suppFn.removeFile,
    modStatSupp: suppFn.modifyStatus,
    ...mapMutations({
      toggleDialogBox: 'setDialogBox'
    }),
    async navBack () {
      this.$router.back()
    },
    async createDataset () {
      await this.$apollo.mutate({
        mutation: CREATE_DATASET_MUTATION,
        variables: {
          input: {
            datasetId: `${this.datasetId}`,
            files: this.uploadedFiles.files,
            title: this.title,
            doi: this.doi
          }
        }
      }).then((data) => {
        console.log('data:', data)
      }).catch((error) => {
        console.error('error:', error)
      })
    },
    // Format files for submission
    processFiles () {
      var incompleteFiles = this.spreadsheetFiles.filter(file => file.status === 'incomplete')
        .concat(this.suppFiles.filter(file => file.status === 'incomplete'))
      return incompleteFiles.map(({ file }) => file)
    },
    onInputChange (e) {
      if (e.target.id === 'file-spreadsheet-input') {
        this.addSpreadsheet(e.target.files)
      } else {
        this.addSupp(e.target.files)
      }
      // reset so that selecting the same file again will still cause it to fire this change
      e.target.value = null
    },
    goToStep (id, index) {
      if (id === 'fourth' && index === 'sixth') {
        if (!this.title) {
          this.isInvalidForm = true
          return
        } else this.isInvalidForm = false
      }
      this[id] = true
      if (index) {
        this.active = index
      }
    },
    async submitFiles () {
      this.toggleDialogBox()
      this.uploadInProgress = 'Uploading files'
      this.renderDialog('Submitting dataset', 'loading', 40, true)
      await this.uploadFiles()
        .then(() => {
          this.uploadInProgress = 'Creating dataset'
          this.createDataset()
          setTimeout(() => {
            this.toggleDialogBox()
            this.uploadInProgress = false
            this.$router.push({ name: 'DatasetSingleView', params: { id: `${this.datasetId}` } })
          }, 1000)
        })
    },
    renderDialog (title, type, minWidth, disableClose = false) {
      this.dialog = {
        title,
        type,
        minWidth,
        disableClose
      }
      this.toggleDialogBox()
    },
    async uploadFiles () {
      const url = '/api/files/upload'
      const formData = new FormData()
      const files = this.processFiles()
      files.forEach((file) => formData.append('uploadfile', file))
      await fetch(url, {
        method: 'POST',
        body: formData,
        redirect: 'follow'
      })
        .then(response => response.json())
        .then(result => {
          this.uploadedFiles = result
          this.spreadsheetFiles.forEach((file, index) => this.modStatSpreadsheet(index, 'complete'))
          this.suppFiles.forEach((file, index) => this.modStatSupp(index, 'complete'))
        })
        .catch(error => console.log('error', error))
    },
    changeSelectedDataset (selection) {
      this.selectedDataset.label = selection.title || `${selection.datasetGroupId} (Untitled)`
      this.selectedDataset.id = selection.datasetGroupId
    },
    changeDatasetId () {
      this.$router.replace({ name: 'CurateSpreadsheet', params: { datasetId: this.selectedDataset.id } })
    }
  },
  apollo: {
    verifyUser: {
      query: VERIFY_AUTH_QUERY,
      fetchPolicy: 'cache-and-network'
    },
    getUserDataset: {
      query: USER_DATASET_IDS_QUERY,
      fetchPolicy: 'cache-and-network'
    }
  }
}
