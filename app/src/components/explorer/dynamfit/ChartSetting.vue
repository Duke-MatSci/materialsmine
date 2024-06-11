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
      <template v-if="!dynamfit.fileUpload">
        <label for="Viscoelastic_Data" class="u--inline">
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
            </div>
          </div>
        </label>
        <a
          class="btn btn--primary md-button u--inline u--margin-leftsm"
          style="border-radius: 0% !important"
          href="/dynamfit-template.tsv"
          download
          ><span class="md-body-1">Template</span></a
        >
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
  </div>
</template>
<script>
import { mapState } from 'vuex'
export default {
  name: 'ChartSetting',
  data () {
    return {
      showToolTip: false,
      isTemp: true
    }
  },
  mounted () {},
  watch: {
    dynamfit: {
      handler: function (newVal) {
        if (!newVal) return
        this.updateChart()
      },
      deep: true
    }
  },
  methods: {
    async onInputChange (e) {
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
    async resetChart () {
      const name = this.dynamfit.fileUpload
      if (!name) return

      const { deleted, error } = await this.$store.dispatch('deleteFile', {
        name,
        isTemp: this.isTemp
      })

      if (!error && deleted) {
        return this.clearDynamfitData()
      }
      this.$store.commit('setSnackbar', {
        message: error ?? 'Something went wrong',
        action: () => this.resetChart()
      })
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
      this.$store.commit('explorer/resetDynamfit')
      this.$store.commit('explorer/resetDynamfitData')
    },
    async updateChart () {
      const payload = {
        fileName: this.dynamfit.fileUpload,
        numberOfProny: this.dynamfit.range,
        model: this.dynamfit.model,
        fitSettings: this.dynamfit.fitSettings
      }
      await this.$store.dispatch('explorer/fetchDynamfitData', payload)
    }
  },
  computed: {
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
  }
}
</script>
