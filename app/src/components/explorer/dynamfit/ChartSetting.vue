<template>
  <div class="u_width--max utility-bg_border-dark md-card-header u--b-rad">
    <label class="form-label md-subheading">
      <div>Upload Compatible Viscoelastic Data</div>
      <div>
        <p><em>(accepted formats: '.csv', '.tsv')</em></p>
      </div>
    </label>
    <!-- File Upload  -->
    <div class="search_box_form u_centralize_items">
      <div class="utility-margin-right viz-u-mgup-md viz-u-mgbottom-big">
        <template v-if="!dynamfit.fileUpload">
          <label for="Viscoelastic_Data" class="u--inline">
            <div class="form__file-input">
              <div class="md-theme-default">
                <label class="btn btn--primary u--b-rad" for="Viscoelastic_Data"
                  ><p class="md-body-1">Upload file</p></label
                >
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
        </template>
        <template v-else>
          <button
            class="md-button btn btn--tertiary btn--noradius"
            @click.prevent="resetChart"
          >
            Reset
          </button>
          <span class="md-caption md-success viz-u-display__show">{{
            dynamfit.fileUpload
          }}</span>
        </template>
      </div>
      <div>
        <div class="new-item-button-container" v-if="!useSample">
          <button @click="openSidebar" class="btn btn--primary u--b-rad">
            Explore xml
          </button>
          <div class="new-item-new-badge">New</div>
        </div>
        <div v-if="isSidebarOpen" class="sidebar">
          <button
            class="md-fab md-fixed md-dense md-fab-top-right md-button btn--primary dialog-box_close"
            @click="closeSidebar"
          >
            <md-icon class="utility-navfonticon u--font-emph-xl">close</md-icon>
          </button>
          <h2 class="md-title metamine_footer-ref-header u_margin-bottom-small">
            Explore existing xml
          </h2>
          <hr />

          <div class="u_display-flex grid_gap-small metamine_footer-ref-header">
            <div
              class="u_display-flex u--layout-flex-column grid_gap-smaller utility-half-width"
            >
              <label>Domain</label>
              <select
                class="form__input form__input--adjust utility-padding-sm"
                v-model="selectedProperty"
              >
                <option value="temperature">Temperature</option>
                <option value="frequency">Frequency</option>
                <option value="time">Time</option>
              </select>
            </div>

            <div
              class="u_display-flex u--layout-flex-column grid_gap-smaller utility-half-width"
            >
              <label>Limit</label>
              <input
                class="form__input form__input--adjust utility-padding-sm"
                type="number"
                v-model.number="limit"
                min="1"
              />
            </div>
          </div>

          <div
            class="metamine_footer-ref-header u_display-flex u_centralize_content"
          >
            <button @click="search" class="btn btn--primary u--b-rad">
              Search
            </button>
          </div>

          <div
            v-if="optionalChaining(() => results?.xmls?.length) && !currentItem"
            class="metamine_footer-ref-header"
          >
            <h3>Results ({{ currentPage * limit }} of {{ results.counts }})</h3>
            <hr />
            <div class="list-container">
              <div
                v-for="item in results.xmls"
                :key="item.title"
                class="u_display-flex grid_gap-small u_margin-bottom-small"
              >
                <input
                  type="radio"
                  :id="item.title"
                  :value="item"
                  v-model="currentItem"
                  style="accent-color: #09233c"
                />
                <label :for="item.title">{{ item.title }}</label>
              </div>
            </div>
            <pagination
              v-if="totalPages > 1 && !currentItem"
              :cpage="currentPage"
              :tpages="totalPages"
              @go-to-page="goToPage"
            />
          </div>
          <div v-if="currentItem" class="metamine_footer-ref-header">
            <h3>
              {{ currentItem.title }}
              <span class="u--color-grey-sec u--margin-neg md-body-1"
                >({{ currentItem.contains.length }} viscoelastic data)</span
              >
            </h3>
            <hr />
            <div class="list-container">
              <div
                v-for="(item, index) in currentItem.contains"
                :key="index"
                class="u_display-flex grid_gap-small u_margin-bottom-small"
              >
                <input
                  type="radio"
                  :id="index"
                  :value="{ ...item, index: index }"
                  v-model="selectedItemProperty"
                  style="accent-color: #09233c"
                />
                <label :for="item"
                  ><span style="display: block"
                    ><strong>Description:</strong> {{ item.property }}</span
                  ><span class="u--color-grey-sec u--margin-neg md-body-1"
                    ><strong>Table:</strong> {{ item.table }}</span
                  ></label
                >
              </div>
            </div>
            <button
              @click="goBack"
              class="select-btn btn btn--primary u--margin-rightlg"
            >
              Go Back
            </button>
            <button @click="handleSelect" class="select-btn btn btn--primary">
              Select
            </button>
          </div>
        </div>
      </div>
    </div>
    <!-- Dropdown -->
    <div>
      <label for="model" class="md-body-2">Select Fitting Method</label>
      <div class="md-field viz-u-mgbottom-big">
        <select
          :disabled="disableInput"
          v-model="dynamfit.model"
          :class="[
            disableInput ? 'nuplot-masked' : '',
            'form__select u--b-rad'
          ]"
          name="model"
          id="model"
        >
          <option value="Linear">Linear</option>
          <option value="LASSO">LASSO</option>
          <option value="Ridge">Ridge</option>
        </select>
      </div>
    </div>

    <!-- Slider  -->
    <div class="viz-u-mgbottom-sm">
      <label for="prony" class="md-body-2">
        Select Number of Prony Terms <span>[{{ dynamfit.range }}]</span>
      </label>
      <div
        class="nuplot-range-slider u--margin-centered u_centralize_text viz-u-postion__rel"
      >
        <input
          :disabled="disableInput"
          @mouseenter="showToolTip = true"
          @mouseleave="showToolTip = false"
          name="prony"
          v-model.lazy.number="dynamfit.range"
          type="range"
          min="1"
          max="100"
          :class="[disableInput ? 'nuplot-masked' : '']"
          class="nuplot-range-slider u--layout-width u--margin-centered u_centralize_text viz-u-postion__abs utility-transparentbg"
        />
        <div
          :style="{ left: `${dynamfit.range - 5}%` }"
          v-if="showToolTip"
          class="u_margin-top-med viz-u-display__show nuplot-slider-tooltip"
          id="parame-selector-slider-id"
        >
          {{ dynamfit.range }}
        </div>
      </div>
      <div class="u--layout-flex u--layout-flex-justify-sb u--color-grey-sec">
        <div>0</div>
        <div>100%</div>
      </div>
    </div>

    <!-- Checkbox -->
    <div>
      <label for="fitSettings" class="md-body-2">Additional Settings</label>
      <md-checkbox
        :disabled="disableInput"
        v-model="dynamfit.fitSettings"
        :class="[
          disableInput ? 'nuplot-masked' : '',
          'u--layout-flex viz-u-mgup-sm viz-u-mgbottom-sm'
        ]"
      >
        Show Basis Functions
      </md-checkbox>
    </div>
    <div class="grid grid_col-2">
      <div class="">
        <a
          v-if="!dynamfit.fileUpload.length"
          class="btn-text"
          style="border-radius: 0% !important"
          href="#"
          v-on:click="useSampleFile"
          ><span class="md-body-1">Use Sample </span></a
        >
        <span
          ><md-icon
            v-if="!dynamfit.fileUpload.length"
            class="u_superscript-icon utility-color"
            :title="sampleTitle()"
            >help_outline</md-icon
          ></span
        >
      </div>
      <div class="utility-align--right">
        <a
          class="btn-text"
          style="border-radius: 0% !important"
          href="/dynamfit-template.tsv"
          download
          ><span class="md-body-1">Download Template</span></a
        >
        <span
          ><md-icon
            class="u_superscript-icon utility-color"
            :title="downloadTitle()"
            >help_outline</md-icon
          ></span
        >
      </div>
    </div>
  </div>
</template>
<script>
import { mapState, mapGetters } from 'vuex'
import optionalChainingUtil from '@/mixins/optional-chaining-util'
import pagination from '@/components/explorer/Pagination'
export default {
  name: 'ChartSetting',
  mixins: [optionalChainingUtil],
  components: {
    pagination
  },
  data () {
    return {
      showToolTip: false,
      isTemp: true,
      useSample: false,
      isSidebarOpen: false,
      selectedProperty: 'temperature',
      limit: 2,
      results: [],
      currentItem: null,
      selectedItemProperty: null,
      currentPage: 1,
      totalPages: 0
    }
  },
  watch: {
    dynamfit: {
      handler: function (newVal) {
        if (!newVal) return
        this.updateChart()
      },
      deep: true
    },
    limit () {
      return this.search()
    }
  },
  methods: {
    sampleTitle () {
      // eslint-disable-next-line
      return `An example set of E', E" data for PMMA which can be used to explore the Prony Series fitting and conversion tool.`;
    },
    downloadTitle () {
      // eslint-disable-next-line
      return `An example tsv file of 3 columns containing: frequency, E', E"; no header row. Format your data as this template then 'upload file' to use the Prony Series fitting and conversion tool.`;
    },
    async onInputChange (e) {
      this.useSample = false
      this.displayInfo('Uploading File...')
      const file = [...e.target?.files]
      const allowedTypes = ['csv', 'tsv', 'tab-separated-values', 'plain']
      try {
        const extension =
          file[0]?.type?.replace(/(.*)\//, '') ||
          file[0]?.name.split('.').pop()
        if (!extension || !allowedTypes.includes(extension)) {
          return this.displayInfo('Unsupported file format')
        }
        const { fileName } = await this.$store.dispatch('uploadFile', {
          file,
          isTemp: this.isTemp
        })
        if (fileName) {
          this.dynamfit.fileUpload = fileName
          this.displayInfo('Upload Successful', 1500)
        }
      } catch (err) {
        this.$store.commit('setSnackbar', {
          message: err?.message || 'Something went wrong',
          action: () => this.onInputChange(e)
        })
      }
    },
    async useSampleFile () {
      this.closeSidebar()
      this.useSample = true
      this.displayInfo('Using sample file', 1500)
      this.dynamfit.fileUpload = 'test.tsv'
    },
    async resetChart () {
      const name = this.dynamfit.fileUpload
      if (!name) return

      // DO NOT call BE to delete for sample file
      if (!this.useSample) {
        const { deleted, error } = await this.$store.dispatch('deleteFile', {
          name,
          isTemp: this.isTemp
        })
        if (!error && deleted) {
          return this.clearDynamfitData()
        }
      } else {
        return this.clearDynamfitData()
      }

      // TODO: WILL NEED TO FIX THIS LATER!
      // this.$store.commit('setSnackbar', {
      //   message: error ?? 'Something went wrong',
      //   action: () => this.resetChart()
      // })
    },
    displayInfo (msg, duration) {
      if (msg) {
        this.$store.commit('setSnackbar', {
          message: msg,
          duration: duration ?? 3000
        })
      }
    },
    clearDynamfitData () {
      // First reset useSample flag if in use
      this.useSample = false
      this.$store.commit('explorer/resetDynamfit')
      this.$store.commit('explorer/resetDynamfitData')
    },
    async updateChart () {
      const payload = {
        fileName: this.dynamfit.fileUpload,
        numberOfProny: this.dynamfit.range,
        model: this.dynamfit.model,
        fitSettings: this.dynamfit.fitSettings,
        useSample: this.useSample
      }
      await this.$store.dispatch('explorer/fetchDynamfitData', payload)
    },
    openSidebar () {
      this.isSidebarOpen = true
    },
    closeSidebar () {
      this.isSidebarOpen = false
    },
    goBack () {
      this.currentItem = null
      this.selectedItemProperty = null
    },
    async handleSelect () {
      if (!this.selectedItemProperty) {
        this.$store.commit('setSnackbar', {
          message: 'Please select an item before proceeding.',
          type: 'error',
          duration: 4000
        })
        return
      }

      this.isSidebarOpen = false
      try {
        const payload = {
          title: this.currentItem.title,
          property: this.selectedItemProperty.property,
          table: this.selectedItemProperty.table,
          index: this.selectedItemProperty.index
        }
        console.log('payload', payload)
        const response = await fetch('/api/mn/loadxml', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + this.token
          },
          body: JSON.stringify(payload)
        })

        // if (response.data.fileName) {
        //   this.dynamfit.fileUpload = response.data.fileName;
        //   this.$store.commit('setSnackbar', {
        //     message: 'Upload Successful!',
        //     type: 'success'
        //   });
        // } else {
        //   throw new Error('Unexpected response format');
        // }

        // Get filename from the Content-Disposition header, if available
        let filename = 'download.csv'
        const disposition = response.headers.get('content-disposition')
        if (disposition && disposition.indexOf('attachment') !== -1) {
          const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
          const matches = filenameRegex.exec(disposition)
          if (matches != null && matches[1]) {
            filename = matches[1].replace(/['"]/g, '')
          }
        }

        // Convert the response to a Blob
        const blob = await response.blob()
        // Create a temporary URL for the Blob
        const url = window.URL.createObjectURL(blob)
        // Create a temporary link element
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', filename)
        document.body.appendChild(link)
        link.click()
        // Cleanup: remove link and revoke the object URL
        link.remove()
        window.URL.revokeObjectURL(url)
      } catch (err) {
        this.$store.commit('setSnackbar', {
          message: err.message || 'Something went wrong. Please try again.',
          type: 'error',
          duration: 1000
        })
      }
    },
    async search () {
      const payload = {
        has: this.selectedProperty,
        limit: this.limit || 2,
        page: this.currentPage
      }
      try {
        const response = await fetch('/api/xml/xml-has-property', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + this.token
          },
          body: JSON.stringify(payload)
        })

        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.message)
        }
        this.results = data
        this.totalPages = Math.ceil(data.counts / this.limit)
      } catch (err) {
        this.$store.commit('setSnackbar', {
          message: err.message || 'Something went wrong. Please try again.',
          type: 'error',
          duration: 10000
        })
      }
    },
    async goToPage (page) {
      if (page < 1 || page > this.totalPages) return
      this.currentPage = page
      await this.search()
    }
  },
  computed: {
    ...mapState('explorer', {
      dynamfit: (state) => state.dynamfit
    }),
    ...mapGetters({ token: 'auth/token' }),
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
  }
}
</script>
