<template>
  <div class="u_width--max utility-bg_border-dark md-card-header u--b-rad">
    <label class="form-label md-subheading">
      <div>Upload Compatible Viscoelastic Data</div>
      <div>
        <p><em>(accepted formats: '.csv', '.tsv')</em></p>
      </div>
    </label>
    <!-- File Upload  -->
    <div class="utility-margin-right viz-u-mgup-md viz-u-mgbottom-big">
      <label for="Viscoelastic_Data">
        <div class="form__file-input">
          <div class="md-theme-default">
            <label
              class="btn btn--primary md-button u--b-rad"
              for="Viscoelastic_Data"
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
            <span v-if="fileUpload" class="md-caption md-success">{{
              fileUpload
            }}</span>
          </div>
        </div>
      </label>
    </div>
    <!-- Dropdown -->
    <div>
      <label for="model" class="md-body-2">Select Fitting Method</label>
      <div class="md-field viz-u-mgbottom-big">
        <select
          :disabled="disableInput"
          v-model="model"
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
      <label for="prony" class="md-body-2">Select Number of Prony Terms</label>
      <div
        class="nuplot-range-slider u--margin-centered u_centralize_text viz-u-postion__rel"
      >
        <input
          :disabled="disableInput"
          @mouseenter="showToolTip = true"
          @mouseleave="showToolTip = false"
          name="prony"
          v-model.lazy.number="range"
          type="range"
          min="1"
          max="100"
          :class="[disableInput ? 'nuplot-masked' : '']"
          class="nuplot-range-slider u--layout-width u--margin-centered u_centralize_text viz-u-postion__abs utility-transparentbg"
        />
        <div
          :style="{ left: `${range - 5}%` }"
          v-if="showToolTip"
          class="u_margin-top-med viz-u-display__show nuplot-slider-tooltip"
          id="parame-selector-slider-id"
        >
          {{ range }}
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
        v-model="fitSettings"
        :class="[
          disableInput ? 'nuplot-masked' : '',
          'u--layout-flex viz-u-mgup-sm viz-u-mgbottom-sm'
        ]"
      >
        Show Basis Functions
      </md-checkbox>
    </div>
  </div>
</template>
<script>
export default {
  name: 'ChartSetting',
  data () {
    return {
      range: 100,
      showToolTip: false,
      fitSettings: false,
      model: 'Linear',
      fileUpload: ''
    }
  },
  mounted () {},
  watch: {
    model: function (newVal) {
      if (!newVal) return
      this.updateChart()
    },
    fileUpload: function (newVal) {
      if (!newVal) return
      this.$store.commit('resetSnackbar')
      this.updateChart()
    },
    fitSettings: function (newVal, oldVal) {
      if (newVal === oldVal) return
      this.updateChart()
    },
    range: function (newVal) {
      if (!newVal) return
      this.updateChart()
    }
  },
  methods: {
    async onInputChange (e) {
      this.displayInfo('Uploading File...')
      const file = [...e.target?.files]
      const allowedTypes = ['csv', 'tsv', 'tab-separated-values', 'plain']
      try {
        const extention = file[0]?.type?.replace(/(.*)\//g, '')
        if (!extention || !allowedTypes.includes(extention)) {
          return this.displayInfo('Unsupported file format')
        }
        const { fileName } = await this.$store.dispatch('uploadFile', { file })
        this.fileUpload = fileName
        this.displayInfo('Upload Successful', 1500)
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
    async updateChart () {
      const payload = {
        fileName: this.fileUpload,
        numberOfProny: this.range,
        model: this.model,
        fitSettings: this.fitSettings
      }
      await this.$store.dispatch('explorer/fetchDynamfitData', payload)
    }
  },
  computed: {
    disableInput () {
      return (
        !this.fileUpload ||
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
