<template>
  <div class="data-selector-wrapper">
    <div class="data-row u_margin-top-small">
      <div
        class="u--layout-flex u_searchimage_input u_centralize_items u--layout-flex-justify-sb"
      >
        <div class="article_metadata_strong md-title">Data</div>
        <div>
          <label for="Viscoelastic_Data">
            <div class="form__file-input">
              <div class="md-theme-default">
                <label
                  class="md-button btn btn--primary u_color_white u--shadow-none"
                  for="Viscoelastic_Data"
                >
                  <p class="">Upload file</p>
                </label>
                <div class="md-file">
                  <input
                    @change="onInputChange"
                    accept=".csv, .tsv, .txt"
                    type="file"
                    name="Viscoelastic_Data"
                    id="Viscoelastic_Data"
                  />
                </div>
              </div>
            </div>
          </label>
        </div>

        <button
          @click.prevent="downloadFile"
          class="md-button btn btn--tertiary u--shadow-none"
        >
          <div
            class="u--layout-flex u--layout-flex-justify-end u_margin-bottom-small"
          >
            <!-- <md-icon class="utility-navfonticon utility-color">download</md-icon> -->
            <span class="md-icon md-icon-font u--default-size u--inline"
              >download</span
            >
            <div>Download file</div>
          </div>
        </button>
      </div>
      <md-table
        class="u_width--max u_divider-fullspan utility-transparentbg viz-u-postion__rel viz-u-zIndex__min"
        :value="fetchedNames"
        md-sort="key"
        md-sort-order="asc"
      >
        <md-table-empty-state md-label="No data available">
        </md-table-empty-state>
        <template #md-table-row="{ item }">
          <md-table-row :key="item.name">
            <md-table-cell md-label="Name" md-sort-by="name">
              <md-chip
                :style="{ 'background-color': item.color, color: 'white' }"
              >
                {{ item.name.split('-').at(-1) }}
              </md-chip>
            </md-table-cell>
            <md-table-cell md-label="Select">
              <md-checkbox
                v-model="selectedValue"
                @change="onSelect"
                :value="item"
              ></md-checkbox>
            </md-table-cell>
          </md-table-row>
        </template>
      </md-table>
    </div>
    <div v-if="page === 'scatter'">
      <div class="u--layout-flex u--layout-flex-column" style="margin: 5px 0px">
        <div>
          <div class="query-xaxis-label">X-axis</div>
          <select
            class="u_width--max form__select"
            v-model="query1Value"
            name="xAxis"
            @change="handleQuery1Change"
          >
            <option v-for="item in columns" :value="item" v-bind:key="item">
              {{ item }}
            </option>
          </select>
        </div>
      </div>
      <div class="u--layout-flex u--layout-flex-column" style="margin: 5px 0px">
        <div>
          <div class="query-yaxis-label">Y-axis</div>
          <select
            class="u_width--max form__select"
            v-model="query2Value"
            name="yAxis"
            @change="handleQuery2Change"
          >
            <option v-for="item in columns" :value="item" v-bind:key="item">
              {{ item }}
            </option>
          </select>
        </div>
      </div>
    </div>
    <div v-if="page === 'hist'">
      <div class="u--layout-flex u--layout-flex-column" style="margin: 5px 0px">
        <div>
          <div class="query-xaxis-label">X-axis</div>
          <select
            class="u_width--max form__select"
            v-model="query1Value"
            name="xAxis"
            @change="handleQuery1Change"
          >
            <option v-for="item in columns" :value="item" v-bind:key="item">
              {{ item }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <template v-if="jsonName && (jsonData || !!jsonData.length)">
      <download-csv :data="jsonData" :name="jsonName.split('-').at(-1)">
        <button :ref="jsonName"></button>
      </download-csv>
    </template>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import JsonCSV from 'vue-json-csv'

export default {
  name: 'DataSelector',
  components: {
    downloadCsv: JsonCSV
  },
  mounted () {
    this.query1Value = this.query1
      ? this.query1
      : this.$route.query.pairwise_query1
    this.query2Value = this.query2
      ? this.query2
      : this.$route.query.pairwise_query2
    this.$store.commit(
      'metamineNU/setQuery1',
      this.$route.query.pairwise_query1,
      {
        root: true
      }
    )
    this.$store.commit(
      'metamineNU/setQuery2',
      this.$route.query.pairwise_query2,
      {
        root: true
      }
    )
    this.selectedValueArr = this.activeData
  },
  data () {
    return {
      columns: ['C11', 'C12', 'C22', 'C16', 'C26', 'C66'],
      query1Value: 'C11',
      query2Value: 'C12',
      selectedValueArr: [],
      jsonName: '',
      jsonData: null
    }
  },
  computed: {
    ...mapState('metamineNU', {
      activeData: (state) => state.activeData,
      fetchedNames: (state) => state.fetchedNames,
      dataLibrary: (state) => state.dataLibrary,
      page: (state) => state.page,
      query1: (state) => state.query1,
      query2: (state) => state.query2
    }),
    selectedValue: {
      get () {
        return this.fetchedNames.filter((item) =>
          this.activeData.map((data) => data.name).includes(item.name)
        )
      },
      set (val) {
        this.onSelect(val)
      }
    },
    fetchedNamesWithInfo () {
      return this.fetchedNames.map((element) => {
        element.showDropDown = false
        return element
      })
    },
    ...mapState('explorer', {
      dynamfit: (state) => state.dynamfit
    }),
    disableInput () {
      return (
        !this.dynamfit.fileUpload ||
        !this.dynamfitData ||
        !Object.keys(this.dynamfitData).length
      )
    },
    dynamfitData () {
      return this.$store.getters['explorer/getDynamfitData']
    }
  },
  methods: {
    handleQuery1Change () {
      this.changeRouteQuery()
      this.$store.commit('metamineNU/setQuery1', this.query1Value)
    },
    handleQuery2Change () {
      this.changeRouteQuery()
      this.$store.commit('metamineNU/setQuery2', this.query2Value)
    },
    changeRouteQuery () {
      const query = {
        pairwise_query1: this.query1Value,
        pairwise_query2: this.query2Value
      }
      this.$router.push({ query })
    },
    onSelectInfo (items) {
      this.showDropDown.map(
        (entry, index) => !!items.map((item) => item.key).includes(index)
      )
    },
    onSelect (items) {
      const self = this
      const selected = items
      this.fetchedNamesWithInfo.map((entry, index) =>
        items.map((item) => item.key).includes(index)
          ? (entry.showDropDown = true)
          : (entry.showDropDown = false)
      )
      const unselected = this.fetchedNames.filter(
        (item) => !selected.includes(item)
      )
      selected.map((dataNameObj, index) => {
        let sourceItems = self.activeData
        let destItems = self.dataLibrary
        const checked = destItems.filter(
          (item) => item.name === dataNameObj.name
        )
        destItems = destItems.filter((item) => item.name !== dataNameObj.name)
        sourceItems = [...sourceItems, ...checked]
        self.$store.commit('metamineNU/setActiveData', sourceItems)
        self.$store.commit('metamineNU/setDataLibrary', destItems)
      })
      unselected.map((dataNameObj, index) => {
        let sourceItems = self.dataLibrary
        let destItems = self.activeData
        const unchecked = destItems.filter(
          (item) => item.name === dataNameObj.name
        )
        destItems = destItems.filter((item) => item.name !== dataNameObj.name)
        sourceItems = [...sourceItems, ...unchecked]
        self.$store.commit('metamineNU/setActiveData', destItems)
        self.$store.commit('metamineNU/setDataLibrary', sourceItems)
      })
    },
    async onInputChange (e) {
      this.displayInfo('Uploading File...')
      const file = [...e.target?.files]
      const allowedTypes = ['csv', 'tsv', 'tab-separated-values', 'plain']
      try {
        const extension = file[0]?.type?.replace(/(.*)\//g, '')
        if (!extension || !allowedTypes.includes(extension)) {
          return this.displayInfo('Unsupported file format')
        }
        const { fileName } = await this.$store.dispatch('uploadFile', {
          file,
          isVisualizationCSV: true
        })
        if (fileName) {
          this.displayInfo('Upload Successful', 1500)
          this.$store.commit('metamineNU/setLoadingState', true)
          await this.$nextTick()
          setTimeout(async () => {
            this.$store.commit('metamineNU/setRefreshStatus', true)
            await this.$store.dispatch('metamineNU/fetchMetamineDataset')
          }, 500)
        }
      } catch (err) {
        this.$store.commit('setSnackbar', {
          message: err?.message || 'Something went wrong',
          action: () => this.onInputChange(e)
        })
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
    async downloadFile () {
      const rawJson = this.$store.getters['metamineNU/getRawJson']
      if (!rawJson) return
      for (let i = 0; i < this.selectedValue.length; i++) {
        const name = this.selectedValue[i].name
        this.jsonName = name
        this.jsonData = rawJson[name]
        await this.$nextTick()
        if (this.jsonData) {
          const elem = this.$refs[this.jsonName]
          await elem.click()
          elem.dispatchEvent(new Event('click'))
          await this.$nextTick()
        }
        this.jsonName = ''
        this.jsonData = null
      }
    }
  }
}
</script>
