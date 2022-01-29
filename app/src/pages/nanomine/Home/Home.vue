<template>
  <div>
    <div class="section_visualize">
      <div class="visualize--links">
          <div class="visualize--link-icons visualize--link-left" @click.prevent="pushChart('prev')"><i class="material-icons">keyboard_arrow_left</i></div>
          <div class="visualize--link-icons visualize--link-right" @click.prevent="pushChart('next')"><i class="material-icons">keyboard_arrow_right</i></div>
      </div>
      <div class="wrapper">
          <div class="visualize_header">
              <h1 title="Visualization Headline" class="visualize_header-h1">Visualize and Interact with Your Data</h1>
          </div>
          <div class="visualize_accordion" title="Visualization Container">
            <div class="visualize_chart" :class="`charts-${index + 1}`" v-for="(chart, index) in gifChart" :key="index">
              <div class="visualize_chart-content" :class="`charts_content-${index + 1}`" @click.prevent="navigateFunction(chart.url)">
                <img :src="chart.img" :alt="chart.title" />
                <span>{{ chart.title }}</span>
              </div>
            </div>
          </div>

          <div class="visualize_btn">
              <a href="/explorer/gallery" class="btn-text">Explore the chart gallery</a>
          </div>
          <div class="visualize_text">
              <p>Our chart builder leverages <strong>SPARQL</strong> and <strong>Vega-Lite</strong> for rich, interactive charts of data from the MaterialsMine knowledge graph. Visit our Charts Gallery to view examples, and contact us to get your data integrated.</p>
          </div>
      </div>
    </div>
    <div class="section_quicklinks">
      <div class="wrapper">
          <div class="grid grid_col-3 grid_gap-smaller">
              <div class="quicklinks" @click.prevent="navigateFunction('/xml-uploader')">
                  <div class="quicklinks_content">
                      <h2>Upload your data</h2>
                      <i class="material-icons">vertical_align_top</i>
                      <div class="quicklinks_content-description">Add new data sources to the repository into the data uploader</div>
                  </div>
              </div>
              <div class="quicklinks quicklinks-border" @click.prevent="navigateFunction('/tools')">
                  <div class="quicklinks_content">
                      <h2>Use custom tools</h2>
                      <i class="material-icons">flash_on</i>
                      <div class="quicklinks_content-description">Use custom tools to gain further insights into data</div>
                  </div>
              </div>
              <div class="quicklinks" @click.prevent="navigateFunction('/news')">
                  <div class="quicklinks_content">
                      <h2>Learn more</h2>
                      <i class="material-icons">emoji_objects</i>
                      <div class="quicklinks_content-description">Find the latest research articles and community update</div>
                  </div>
              </div>
          </div>
      </div>
    </div>
  </div>
</template>

<script>

export default {
  name: 'HomeNM',
  data () {
    return {
      gifChart: [
        {
          img: require('@/assets/img/chartgifs/characterization-radial.gif'),
          title: 'Tooltips',
          url: 'https://materialsmine.org/wi/viz/16fb67daba5c4c39'
        },
        {
          img: require('@/assets/img/chartgifs/crossfiltering.gif'),
          title: 'Crossfiltering',
          url: 'https://materialsmine.org/wi/viz/a66e1f86fe47ef6d'
        },
        {
          img: require('@/assets/img/chartgifs/matrix-filler-combo.gif'),
          title: 'Dynamic Selection',
          url: 'https://materialsmine.org/wi/viz/598daf9fd610e982'
        },
        {
          img: require('@/assets/img/chartgifs/meta-analysis.gif'),
          title: 'Pan & Zoom',
          url: 'https://materialsmine.org/wi/viz/6675f5b909cf5059'
        },
        {
          img: require('@/assets/img/chartgifs/tensile-chart.gif'),
          title: 'Conditional Highlighting',
          url: 'https://materialsmine.org/wi/viz/fca5e763f0284284'
        }
      ],
      exploreChart: [],
      pushedCharts: [],
      screen: 0
    }
  },
  methods: {
    pushChart (args) {
      let movedChart; const vm = this
      if (window.matchMedia('(max-width: 40.5em)').matches) {
        vm.screen = 1
      } else if (window.matchMedia('(max-width: 56.25em)').matches) {
        vm.screen = 2
      } else {
        vm.screen = 3
      }
      if (args === 'prev') {
        if (!this.pushedCharts.length) {
          return false
        } else {
          movedChart = this.pushedCharts[this.pushedCharts.length - 1]
          this.gifChart.unshift(movedChart)
          this.pushedCharts.pop()
        }
      } else {
        if (!this.gifChart.length) {
          return false
        } else if (this.gifChart.length <= this.screen) {
          return false
        } else {
          movedChart = this.gifChart[0]
          this.pushedCharts.push(movedChart)
          this.gifChart.shift()
        }
      }
    },
    navigateFunction (arg) {
      this.$router.push(arg)
    }
  },
  created () {
    this.$store.commit('setAppHeaderInfo', {
      icon: '',
      pagetype: 'home',
      name: 'Welcome to MaterialsMine! An open source repository for nanocomposite data (NanoMine), and mechanical metamaterials data (MetaMine)'
    })
  }
}
</script>
