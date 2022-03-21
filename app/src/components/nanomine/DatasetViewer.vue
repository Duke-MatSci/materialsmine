<template>
  <div class="datasets">
    <md-card style="width:100%;">
      <md-card-header class="dataset-header md-layout md-alignment-top-space-between">
        <span class="md-layout-item">
          <md-button class="md-primary md-raised md-icon-button" @click="toggleDatasetHide">
            <md-icon v-if="!datasetHideSelector">expand_more</md-icon>
            <md-icon v-else>expand_less</md-icon>
          </md-button>
          <md-button v-if="auth && auth.isLoggedIn()" class="md-primary md-raised md-icon-button"
            @click="toggleDatasetCard">
            <md-icon>library_add</md-icon>
          </md-button>
          <md-button v-if="datasetsHeaderInfoIcon" class="md-primary md-raised md-icon-button"
            @click="datasetInfoDialog()">
            <md-icon>info</md-icon>
          </md-button>
          {{datasetsHeaderTitle}}
        </span>
        <span class="md-layout-item" style="width:50%;" v-show="datasetSelected !== null">{{headerDOI}}</span>
      </md-card-header>
      <md-card v-if="addDatasetDialogActive">
        <md-field>
          <label>Enter a comment to describe this dataset as uniquely as possible</label>
          <md-input v-model="addDatasetComment"></md-input>
        </md-field>
        <md-button @click="addDatasetDialogActive=false; addDatasetComment=''" small>Cancel</md-button>
        <md-button @click="addDatasetSave()" small color="primary" class="white--text">Save</md-button>
      </md-card>

      <md-table v-model="displayDatasets" v-show="!datasetHideSelector" md-sort="seq" md-sort-order="asc" md-card
        md-fixed-header>
        <md-table-toolbar>
          <div class="md-toolbar-section-start">
            <h1 v-if="mineOnlyAlways" class="md-title">Datasets you've created</h1>
          </div>
          <div v-if="auth && auth.isLoggedIn() && !mineOnlyAlways">
            <md-checkbox v-model="showMineOnly" class="md-primary">Show mine only</md-checkbox>
          </div>
          <md-field md-clearable class="md-toolbar-section-end">
            <md-input placeholder="Filter datasets" v-model="datasetSearch"></md-input>
          </md-field>
        </md-table-toolbar>

        <md-table-empty-state md-label="No data available"
          :md-description="`Your search for '${datasetSearch}' returned no results.`"></md-table-empty-state>

        <template #md-table-row="{ item }">
          <md-table-row @click="datasetClick(item)" :key="item.seq">
            <md-table-cell md-label="ID" md-sort-by="seq" md-numeric>{{ item.seq }}</md-table-cell>
            <md-table-cell md-label="DOI" md-sort-by="doi">{{ item.doi }}</md-table-cell>
            <md-table-cell md-label="Title" md-sort-by="title">{{ item.title }}</md-table-cell>
            <md-table-cell md-label="Comment" md-sort-by="datasetComment">{{ item.datasetComment }}</md-table-cell>
          </md-table-row>
        </template>
      </md-table>
    </md-card>
    <dialog-box :active="dialogBoxActive">
      <template v-slot:title>{{ dialog.title }}</template>
      <template v-slot:content>{{ dialog.content }}</template>
      <template v-slot:actions>
        <md-button @click.native.prevent="toggleDialogBox">Close</md-button>
      </template>
    </dialog-box>
    <!--

    Dataset Info Dialog

    -->
    <dialog-box v-if="datasetInfoDialogActive">
      <template v-slot:title>Dataset Information</template>
      <template v-slot:content>
        <md-list class="md-double-line">
          <md-list-item v-for="(item, index) in datasetDialogInfo.items" :key="index">
            <v-subheader v-if="item.header" :key="item.header">
              {{ item.header }}
            </v-subheader>

            <md-divider v-else-if="item.divider" :key="index"></md-divider>

            <div v-else :key="item.title" class="md-list-item-text">
              <span v-html="item.title"></span>
              <span v-html="item.subtitle"></span>
            </div>
          </md-list-item>
        </md-list>
      </template>
      <template v-slot:actions>
        <md-button @click="datasetInfoDialogActive=false">
          <md-icon>close</md-icon>
        </md-button>
      </template>
    </dialog-box>

  </div>
</template>

<script>
// import { Auth } from '@/modules/Auth.js'
import Dialog from '@/components/Dialog.vue'
import * as _ from 'lodash'

export default {
  name: 'DatasetCreateOrSelect',
  components: {
    dialogBox: Dialog
  },
  props: {
    datasetOptions: { // Valid options: {mineOnly: 'true'|'false'|'always'}
      type: Object,
      default: () => {
        return {}
      }
    },
    selectHeader: {
      type: String,
      default: 'Choose a dataset'
    },
    selectedHandler: {
      type: Function,
      default: null
    }
  },
  data () {
    return {
      msg: 'Hi',
      showMineOnly: true,
      mineOnlyAlways: false,
      addDatasetDialogActive: false,
      addDatasetComment: '',
      datasetsError: false,
      datasetsErrorMsg: '',
      datasetTransformed: {},
      datasetHideSelector: true,
      datasetList: [],
      datasetSearch: '',
      displayDatasets: [],
      datasetSelected: null,
      datasetInfoDialogActive: false,
      datasetDialogInfo: {},
      auth: {
      // AUTH MOCKED because auth is not yet implemented
        getUserID: () => '0',
        getRunAsUser: () => false,
        isLoggedIn: () => false
      },
      dialogBoxActive: false,
      dialog: {}
    }
  },
  watch: {
    datasetOptions: function (options) {
      if (options) {
        this.overrideOptions(this.datasetOptions)
      } else {
        this.datasetOptions = {}
      }
    },
    datasetSearch: function () {
      this.datasetsFiltered()
    },
    datasetList: function () {
      this.datasetsFiltered()
    }
  },
  computed: {
    datasetsHeaderTitle () {
      if (this.datasetSelected) {
        return 'Selected Dataset:'
      } else {
        return this.selectHeader
      }
    },
    datasetsHeaderInfoIcon () {
      return !!this.datasetSelected
    },
    headerDOI () {
      if (this.datasetSelected) {
        // TODO need a remote config call to get values like this from server
        if (!this.datasetSelected.doi || this.datasetSelected.doi.length < 1 || this.datasetSelected.doi === 'unpublished-initial-create') {
          return this.datasetSelected.datasetComment
        } else {
          return this.datasetSelected.doi
        }
      }
      return null
    }
  },
  beforeMount () {
    const vm = this
    // vm.auth = new Auth()
    vm.getDatasets()
    vm.overrideOptions(vm.datasetOptions)
    this.datasetsFiltered()
  },
  methods: {
    overrideOptions (datasetOptions) {
      this.mineOnlyAlways = false
      if (datasetOptions.mineOnly === 'always') {
        this.mineOnlyAlways = true
        this.mineOnly = true
      } else if (datasetOptions.mineOnly === 'true') {
        this.mineOnly = true
      } else {
        this.mineOnly = false
      }
    },
    datasetInfoDialog: function () {
      this.datasetInfoDialogActive = true
    },
    toggleDatasetHide () {
      const vm = this
      vm.datasetHideSelector = !vm.datasetHideSelector
      vm.datasetSelected = null
      if (vm.selectedHandler && typeof vm.selectedHandler === 'function') {
        vm.selectedHandler(vm.datasetSelected)
      }
    },
    getDatasets () {
      const vm = this
      fetch('/nmr/dataset')
        .then(function (resp) {
          resp.data.data.forEach(function (v) {
            vm.datasetList.push(v)
          })
        })
        .catch(function (err) {
          vm.datasetsError = err
          if (vm.auth.isLoggedIn()) {
            vm.renderDialog('Datasets Error', 'Please try again later.')
          }
        })
    },
    transformDataset (entry) {
      const vm = this
      const transformed = {}
      _.keys(entry).forEach((k) => {
        if (k !== 'filesets' && k !== '__v' && k !== 'dttm_created' && k !== 'dttm_updated') {
          if (Array.isArray(entry[k])) {
            if (entry[k].length > 0) {
              transformed[k] = entry[k].join('; ')
            } else {
              transformed[k] = 'N/A'
            }
          } else {
            transformed[k] = entry[k]
          }
          if (transformed[k] === null) {
            transformed[k] = 'N/A'
          }
        }
      })
      this.datasetDialogInfo = {
        items: [
          { header: transformed.doi }
        ]
      }
      _.keys(transformed).forEach((k) => {
        vm.datasetDialogInfo.items.push({
          title: k,
          subtitle: transformed[k]
        })
        vm.datasetDialogInfo.items.push({
          divider: true,
          inset: true
        })
      })
      return transformed
    },
    datasetClick (entry) {
      this.datasetSelected = entry
      this.datasetTransformed = this.transformDataset(entry)
      this.datasetHideSelector = true
      this.filesetsList = this.datasetSelected.filesets
      this.Selected = null
      this.datasetsError = false
      this.datasetsErrorMsg = ''
      if (this.selectedHandler && typeof this.selectedHandler === 'function') {
        this.selectedHandler(this.datasetSelected)
      }
    },
    toggleDatasetCard () {
      this.addDatasetDialogActive = !this.addDatasetDialogActive
    },
    addDatasetSave () {
      const vm = this
      fetch('/nmr/dataset/create', {
        method: 'POST',
        body: JSON.stringify({
          dsInfo: {
            datasetComment: vm.addDatasetComment,
            isPublic: false,
            ispublished: false
          }
        })
      })
        .then(function (resp) {
          vm.addDatasetComment = ''
          vm.datasetsError = false
          vm.datasetsErrorMsg = ''
          vm.addDatasetDialogActive = false
          vm.getDatasets()
        })
        .catch(function (err) {
          vm.datasetsError = err
          vm.renderDialog('Dataset Error', 'Please make sure you are logged in, or try again later.')
        })
    },
    toggleDialogBox () {
      this.dialogBoxActive = !this.dialogBoxActive
    },
    renderDialog (title, content, closeHandler) {
      this.dialog = {
        title,
        content
      }
      this.toggleDialogBox()
    },
    datasetsFiltered () {
      const userID = this.auth.getUserID()
      const runAsUser = this.auth.getRunAsUser()
      const vm = this
      const filteredDatasets = this.datasetList.filter((i) => {
        if (vm.showMineOnly) {
          return i.userID && (i.userID === userID || i.userID === runAsUser)
        } else {
          return true
        }
      })
      if (this.datasetSearch) {
        this.displayDatasets = filteredDatasets.filter((i) => {
          return (`${i.seq || ''}${i.doi || ''}${i.title || ''}${i.datasetComment || ''}`.includes(this.datasetSearch))
        })
      } else {
        this.displayDatasets = filteredDatasets
      }
    }
  }
}
</script>

<style scoped>
  .datasets {
  }

  .dataset-header {
    background-color: #03A9F4;
    color: #ffffff;
    font-size: 22px;
    font-weight: bold;
  }

</style>
