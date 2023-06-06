import DropZone from '@/components/curate/FileDrop.vue'
import FilePreview from '@/components/curate/FilePreview.vue'
import LoginRequired from '@/components/LoginRequired.vue'
import Dialog from '@/components/Dialog.vue'
import CurateNavBar from '@/components/curate/CurateNavBar.vue'
import Spinner from '@/components/Spinner.vue'
import useFileList from '@/modules/file-list'
import { VERIFY_AUTH_QUERY, USER_DATASET_IDS_QUERY } from '@/modules/gql/dataset-gql'
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
      tifFiles: [],
      newTifs: false,
      renameXlsx: false,
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
      navRoutes: [
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
      dialogBoxActive: 'dialogBox',
      token: 'auth/token'
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
    navBack () {
      this.$router.back()
    },
    // Format files for submission
    processFiles () {
      return this.spreadsheetFiles.filter(file => file.status === 'incomplete')
        .concat(this.suppFiles.filter(file => file.status === 'incomplete'))
        .map(({ file }) => file)
    },
    onInputChange (e) {
      if (e.target.id === 'file-spreadsheet-input') {
        const filteredXlsx = this.filterXlsx(e.target.files)
        this.addSpreadsheet(filteredXlsx)
      } else {
        this.filterTif(e.target.files)
        this.addSupp(e.target.files)
      }
      // reset so that selecting the same file again will still cause it to fire this change
      e.target.value = null
    },
    filterXlsx (files) {
      this.renameXlsx = false
      const newFiles = [...files]
      const filteredFiles = []
      for (let i = 0; i < newFiles.length; i++) {
        if (newFiles[i].name !== 'master_template.xlsx') {
          this.renameXlsx = true
        } else filteredFiles.push(newFiles[i])
      }
      return filteredFiles
    },
    filterTif (files) {
      this.newTifs = false
      const newFiles = [...files]
      const filteredFiles = []
      for (let i = 0; i < newFiles.length; i++) {
        if (newFiles[i].type.includes('tif')) {
          this.tifFiles.push(newFiles[i])
          this.newTifs = true
        } else filteredFiles.push(newFiles[i])
      }
      return filteredFiles
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
      try {
        await this.createSample()
      } catch (error) {
        this.$store.commit('setSnackbar', {
          message: error?.message ?? error
        })
      }
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
    async createSample () {
      this.toggleDialogBox()
      const url = `${window.location.origin}/api/curate/?dataset=${this.datasetId}`
      const formData = new FormData()
      const files = this.processFiles()
      files.forEach((file) => formData.append('uploadfile', file))
      formData.append('title', this.title)
      formData.append('doi', this.doi)
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        redirect: 'follow',
        headers: {
          Authorization: 'Bearer ' + this.token
        }
      })

      if (!!response?.ok) {
        this.uploadedFiles = result
        this.spreadsheetFiles.forEach((file, index) => this.modStatSpreadsheet(index, 'complete'))
        this.suppFiles.forEach((file, index) => this.modStatSupp(index, 'complete'))
        this.uploadInProgress = false
        this.$router.push({ name: 'DatasetSingleView', params: { id: `${this.datasetId}` } })
        // Todo: @Anya use the response here
        return this.toggleDialogBox()
      }
      throw new Error(`Error: ${response?.statusText}` ?? 'An error occurred')
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
