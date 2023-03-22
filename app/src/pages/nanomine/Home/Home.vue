<template>
  <div>
    <div class="section_visualize">
      <div class="visualize--links">
          <div class="visualize--link-icons visualize--link-left" @click.prevent="reduceAsset('prev')"><i class="material-icons">keyboard_arrow_left</i></div>
          <div class="visualize--link-icons visualize--link-right" @click.prevent="reduceAsset('next')"><i class="material-icons">keyboard_arrow_right</i></div>
      </div>
      <div class="wrapper">
          <div class="visualize_header">
              <h1 title="Visualization Headline" class="visualize_header-h1">Visualize and Interact with Your Data</h1>
          </div>
          <div class="visualize_accordion" title="Visualization Container">
            <div class="visualize_chart" :class="`charts-${index + 1}`" v-for="(chart, index) in assetItems" :key="index">
              <div class="visualize_chart-content" :class="`charts_content-${index + 1}`" @click.prevent="navigateFunction(chart.url)">
                <img :src="chart.img" :alt="chart.title" />
                <span>{{ chart.title }}</span>
              </div>
            </div>
          </div>

          <div class="visualize_btn">
              <a href="/explorer/chart" class="btn-text">Explore the chart gallery</a>
          </div>
          <div class="visualize_text">
              <p>Our chart builder leverages <strong>SPARQL</strong> and <strong>Vega-Lite</strong> for rich, interactive charts of data from the MaterialsMine knowledge graph. Visit our Charts Gallery to view examples, and contact us to get your data integrated.</p>
          </div>
      </div>
    </div>
    <div class="section_quicklinks">
      <div class="wrapper">
          <div class="grid grid_col-3 grid_gap-smaller">
              <div class="quicklinks" @click.prevent="navigateFunction('/nm/xml-uploader')">
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
import reducer from '@/mixins/reduce'

export default {
  name: 'HomeNM',
  mixins: [reducer],
  data () {
    return {
      assetItems: [
        {
          img: require('@/assets/img/chartgifs/characterization-radial.gif'),
          title: 'Tooltips',
          url: '/explorer/chart/view/1eeea9b71ebb10b7'
        },
        {
          img: require('@/assets/img/chartgifs/crossfiltering.gif'),
          title: 'Crossfiltering',
          url: '/explorer/chart/view/1dfd29527da82466'
        },
        {
          img: require('@/assets/img/chartgifs/matrix-filler-combo.gif'),
          title: 'Dynamic Selection',
          url: '/explorer/chart/view/24b40b6d992fa2f8'
        },
        {
          img: require('@/assets/img/chartgifs/meta-analysis.gif'),
          title: 'Pan & Zoom',
          url: '/explorer/chart/view/2a774b46a67ff7a6'
        },
        {
          img: require('@/assets/img/chartgifs/tensile-chart.gif'),
          title: 'Conditional Highlighting',
          url: '/explorer/chart/view/6203fc0eade146e8'
        }
      ],
      pushedAssetItem: [],
      screen: 0
    }
  },
  methods: {
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
