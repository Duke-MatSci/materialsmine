import { mapState } from 'vuex';
<template>
    <div>
        <div style="font-size: 20px; font-weight: bold; padding: 10px 0">
            Hyperparameter
        </div>
        <div style="font-weight: bold">Number of neighbors:</div>
        <div style="width: 80%">
            The size of local neighborhood (in terms of number of neighboring
            sample points) used for manifold approximation. Larger values result
            in more global views of the manifold, while smaller values result in
            more local data being preserved. (Default: 15)
        </div>
        <div
            style="
                display: flex;
                justify-content: space-between;
                flex-wrap: wrap;
            "
        >
            <div style="width: 80%">
                <div class="nuplot-range-slider">
                    <input
                        id="parame-selector-slider"
                        class="nuplot-range-slider"
                        type="range"
                        min="5"
                        max="50"
                        step="1"
                        v-model="knnUmap"
                        @change="handleKnnUmapChange"
                    />
                    <div
                        style="
                            display: flex;
                            justify-content: space-between;
                            width: 90%;
                            padding-top: 30px;
                        "
                    >
                        <div
                            style="color: gray"
                            v-for="tick in ticks"
                            :key="tick"
                        >
                            {{ tick }}
                        </div>
                    </div>
                    <div
                        class="nuplot-slider-tooltip"
                        id="parame-selector-slider-id"
                    ></div>
                </div>
            </div>
            <div style="width: 20%">
                <md-field>
                    <md-input
                        v-model="knnUmap"
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
      this.$store.dispatch('metamineNU/setKnnUmap', event.target.value)
    }
  }
}
</script>
