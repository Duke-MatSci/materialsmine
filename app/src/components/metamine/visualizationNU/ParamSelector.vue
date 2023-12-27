<template>
  <div>
    <div
      class="md-title article_metadata_strong section_footer utility-transparentbg"
    >
      Hyperparameter
    </div>
    <div class="article_metadata_strong">Number of neighbors:</div>
    <div style="width: 80%">
      The size of local neighborhood (in terms of number of neighboring sample
      points) used for manifold approximation. Larger values result in more
      global views of the manifold, while smaller values result in more local
      data being preserved. (Default: 15)
    </div>
    <div class="u_display-flex md-layout u--layout-flex-justify-sb tool_page">
      <div class="md-layout-item md-size-80">
        <div
          class="nuplot-range-slider u--margin-centered u_centralize_text viz-u-postion__rel"
        >
          <input
            id="parame-selector-slider"
            class="nuplot-range-slider u--margin-centered u_centralize_text viz-u-postion__abs utility-transparentbg"
            type="range"
            min="5"
            max="50"
            step="1"
            :value="knnUmap"
            @change="handleKnnUmapChange"
          />
          <div
            class="u_display-flex u--layout-flex-justify-sb tools_box-content-odd"
            style="padding-top: 30px"
          >
            <div class="u--color-grey-sec" v-for="tick in ticks" :key="tick">
              {{ tick }}
            </div>
          </div>
          <div
            class="nuplot-slider-tooltip"
            id="parame-selector-slider-id"
          ></div>
        </div>
      </div>
      <div class="utility-roverflow md-layout-item md-size-20">
        <md-field>
          <md-input
            :value="knnUmap"
            type="number"
            @change="handleKnnUmapChange"
          ></md-input>
        </md-field>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'ParamSelector',
  mounted: () => {
    const slider = document.getElementById('parame-selector-slider')
    const tooltip = document.getElementById('parame-selector-slider-id')

    slider.addEventListener('input', () => {
      const value = parseInt(slider.value)
      tooltip.textContent = value
      tooltip.style.left = `calc(${((value - 5) / 45) * 100}% - 15px)`
    })

    slider.addEventListener('mousemove', (e) => {
      const value = parseInt(slider.value)
      tooltip.style.left = `calc(${((value - 5) / 45) * 100}% - 15px)`
      tooltip.style.display = 'block'
      tooltip.style.top = `-${tooltip.offsetHeight + 5}px`
    })

    slider.addEventListener('mouseout', () => {
      tooltip.style.display = 'none'
    })
  },
  computed: {
    ...mapState('metamineNU', {
      knnUmap: (state) => state.knnUmap
    })
  },
  data () {
    return {
      ticks: [5, 25, 50]
    }
  },
  methods: {
    handleKnnUmapChange (event) {
      this.$store.commit('metamineNU/setKnnUmap', event.target.value)
    }
  }
}
</script>
