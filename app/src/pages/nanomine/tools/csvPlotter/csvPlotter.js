import {} from 'vuex'
// import { max } from 'd3'
import LineChart from './LineChart'
// import { Auth } from '@/modules/Auth.js'
export default {
  name: 'CurationPlot',
  data () {
    // let margin = {
    //   top: 10,
    //   right: 30,
    //   bottom: 30,
    //   left: 60
    // };
    // let width = 460 - margin.left - margin.right;
    // let height = 400 - margin.top - margin.bottom;
    return {
      title: 'Curation Plot',
      dialog: false,
      boxColor: '#e3e3e3',
      csv: null,
      csvName: '',
      csvText: '',
      data: [],
      dataset: {},
      xlabel: '',
      ylabel: ''
      // // set the dimensions and margins of the graph
      // margin: margin,
      // width: width,
      // height: height
    }
  },
  components: {
    'nm-linechart': LineChart
  },
  methods: {
    reset () {
      const vm = this
      vm.boxColor = '#e3e3e3'
      vm.csv = null
      vm.csvName = ''
      vm.csvText = ''
      vm.data = []
      vm.dataset = null
      vm.xlabel = ''
      vm.ylabel = ''
    },
    onChange () {
      const vm = this
      vm.csv = vm.$refs.myUpload.files[0]
      console.log(vm.csv)
      vm.csvName = vm.csv.name
      console.log(vm.csvName)
      const fr = new FileReader()
      // fr.readAsDataURL(vm.csv);
      fr.readAsText(vm.csv)
      fr.addEventListener('load', () => {
        vm.csvText = fr.result
        vm.csv2xy(vm.csvText)
      })
    },
    remove () {
      this.reset()
    },
    dragover (event) {
      event.preventDefault()
      this.boxColor = '#c4c4c4'
      // Add some visual fluff to show the user can drop its files
      // if (!event.currentTarget.classList.contains('bg-green-300')) {
      //   event.currentTarget.classList.remove('bg-gray-100');
      //   event.currentTarget.classList.add('bg-green-300');
      // }
    },
    dragleave (event) {
      this.boxColor = '#e3e3e3'
      // Clean up
      // event.currentTarget.classList.add('bg-gray-100');
      // event.currentTarget.classList.remove('bg-green-300');
    },
    drop (event) {
      event.preventDefault()
      this.boxColor = '#97fc83'
      this.$refs.myUpload.files = event.dataTransfer.files
      this.onChange() // Trigger the onChange event manually
      // Clean up
      // event.currentTarget.classList.add('bg-gray-100');
      // event.currentTarget.classList.remove('bg-green-300');
    },
    csv2xy (csvText) {
      const vm = this
      // var result = {}
      var rows = csvText.split(/\r\n|\r|\n/)
      const length = rows.length - 1
      var data = []
      var xlabel = ''
      var ylabel = '';
      [xlabel, ylabel] = rows[0].split(',')
      for (var i = 1; i < length; ++i) {
        var rowV = rows[i].split(',')
        data.push({
          x: +rowV[0],
          y: +rowV[1]
        })
      }
      vm.xlabel = xlabel
      vm.ylabel = ylabel
      vm.data = data
    }
  },
  // computed: {
  //   /**
  //    * dataset: Will organize data according to the filter rules
  //    */
  //   dataset() {
  //     // Default
  //     return this.transformData(data);
  //   }
  // // },
  // // created() {
  // //   this.maxValue = max(data, d => d.high).toFixed(2);
  // },
  watch: {
    data (newData) {
      console.log('xlabel: ' + this.xlabel)
      console.log('ylabel: ' + this.ylabel)
      console.log(newData[0].x)
      console.log(newData[0].y)
      console.log(newData)
      // console.log("data: " + this.data);
      console.log('watch run')
      this.dataset = {
        data: newData,
        xlabel: this.xlabel,
        ylabel: this.ylabel
      }
    }
  },
  created () {
    this.$store.commit('setAppHeaderInfo', { icon: 'workspaces', name: 'Curation Plot' })
  }
}
