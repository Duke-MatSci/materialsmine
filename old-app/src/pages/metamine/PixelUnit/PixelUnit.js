import PixelUnit from '@/modules/PixelUnit'

export default {
  name: 'PixelUnit',
  data: () => ({
    errorMsg: '',
    msg: 'C4v 10 x 10 Geometry Explorer',
    canvas: null,
    ctx: null,
    borderColor: 'black',
    setColor: 'red',
    resetColor: '#c0c0c0',
    bgColor: 'rgb(192,192,192)',
    lw: 4,
    pixels: null,
    // pixelString: '',
    size: 10, // default to 10x10 matrix
    pixelStrElem: null,
    matlabStr: '',
    effYmStr: '',
    effPrStr: '',
    psvStr: '',
    shStr: '',
    bgPairs: [
      { sh: 0, psv: 1 },
      { sh: 2, psv: 3 },
      { sh: 4, psv: 5 },
      { sh: 6, psv: 7 }
    ],
    rowsPerPageItems: [4, 8, 12],
    pagination: {
      rowsPerPage: 4
    },
    geometry: '',
    geometryItems: [
      {
        name: 'Geometry',
        value: ''
      },
      {
        name: "Effective Young's Modulus (Pa)",
        value: ''
      },
      {
        name: "Effective Poisson's ratio",
        value: ''
      }
    ],
    bgItems: [
      {
        name: 'SH'
      },
      {
        name: 'PSV'
      }
    ]
  }),

  mounted: function () {
    const vm = this
    this.canvas = this.$refs['unit-cell']
    this.ctx = this.canvas.getContext('2d')
    this.lw = 4 // line width

    this.canvas.addEventListener('click', ev => {
      const pixel = vm.pixelUnit.pt2pixel(ev.layerX, ev.layerY)
      vm.pixelUnit.handleClick(pixel)
      vm.updateFields()
    })
    fetch('https://materialsmine.org/nmstatic/metamine/lin-bilal-liu-10x10-c4v-15bit-static-dynamic.txt') // nmstatic/metamine/lin-bilal-liu-10x10-c4v-15bit-static-dynamic.txt
      .then(data => data.text())
      .then(text => {
        vm.pixelUnit = new PixelUnit(
          text,
          vm.canvas,
          vm.ctx,
          vm.size,
          vm.lw,
          vm.borderColor,
          vm.setColor,
          vm.resetColor,
          null,
          null
        )
        vm.pixelUnit.drawGrid()
        vm.updateFields()
      })
      .catch(err => {
        this.errorMsg = err.message
      })
  },
  methods: {
    onGeometryEntered () {
      this.pixelUnit.setMatlabString(this.geometry)
    },
    updateFields () {
      this.showMatlabString()
      this.showPSVString()
      this.showSHString()
      this.updateBgPairs()
      this.showYoungsModulusString()
      this.showPoissonsRatioString()
    },
    getBgValue (s) {
      let v = Number.parseFloat(s).toFixed(8)
      if (v === Number.NaN || v === 'NaN' || v === Number.Infinity) {
        v = 'N/A'
      }
      return v
    },
    handleReset () {
      this.size = 10
      this.pixelUnit.clearCanvas()
      this.pixelUnit.drawGrid()
      this.pixelUnit.resetPixels()
      this.updateFields()
    },
    updateBgPairs () {
      const vm = this
      const psv = this.pixelUnit.getPsv()
      const sh = this.pixelUnit.getSh()
      this.bgPairs = []
      psv.forEach(function (v, idx) {
        const p = { id: idx, sh: sh[idx], psv: v }
        vm.bgPairs.push(p)
      })
    },
    showMatlabString () {
      this.matlabStr = this.pixelUnit.getMatlabString()
      this.geometryItems[0].value = this.matlabStr
    },
    showPSVString () {
      this.psvStr = this.pixelUnit.getPsvString()
    },
    showSHString () {
      this.shStr = this.pixelUnit.getShString()
    },
    showYoungsModulusString () {
      this.effYmStr = this.pixelUnit.getYmString()
      this.geometryItems[1].value = this.effYmStr
    },
    showPoissonsRatioString () {
      this.effPrStr = this.pixelUnit.getPrString()
      this.geometryItems[2].value = this.effPrStr
    }
  },
  created () {
    this.$store.commit('setAppHeaderInfo', {
      icon: 'scatter_plot',
      name: 'Geometry Explorer'
    })
  }
}
