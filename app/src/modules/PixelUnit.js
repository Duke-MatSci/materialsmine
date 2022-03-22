export default class PixelUnit {
  // Note: this code only handles two materials (foreground and background) and it assumes that
  //    any pixel not set to the foreground material is the background material i.e. there are no
  //    blank spots
  // This module was converted from Claire's https://github.com/anqiclaire/metaviz
  //   (her code was pushed to MaterialsMine 2019/08/20 via commit c611025193b80f02e8444763edfa8a4cfdfc4b3a)
  // Adapted for non-symeetric 2019/10/24 - HB-MPDW
  constructor (data, canvas, ctx,
    sz, lineWidth,
    borderColor, pixelFgColor, pixelBgColor,
    onPixelSet, onPixelReset, symmetry) { // symmetry can be C4v or ns (no symmetry) for now
    const vm = this

    // const SYMMETRY_C4V = 'C4v'
    const SYMMETRY_NON_SYMMETRIC = 'ns'

    vm.canvas = canvas
    vm.ctx = ctx
    vm.p = 0 // relative position
    vm.data = vm.parseData(data)
    vm.size = sz
    vm.symmetry = symmetry
    vm.isSymmetric = !(symmetry === SYMMETRY_NON_SYMMETRIC)
    vm.onPixelSet = onPixelSet
    vm.onPixelReset = onPixelReset
    vm.borderColor = borderColor
    vm.pixelFgColor = pixelFgColor
    vm.pixelBgColor = pixelBgColor
    vm.lw = lineWidth
    if (vm.sz > 10 && vm.lw > 2) {
      vm.lw = 2
    }

    vm.pixels = vm.resetPixels(vm.size)
  }

  getWidth () {
    return this.canvas.width
  }

  getHeight () {
    return this.canvas.height
  }

  getPixels () {
    return this.pixels
  }

  pt2pixel (pointerX, pointerY) {
    const vm = this
    const vxw = Math.floor(vm.getWidth() / vm.size)
    const vxh = Math.floor(vm.getHeight() / vm.size)
    const x = Math.floor(pointerX / vxw)
    const y = Math.floor(pointerY / vxh)
    return { x: x, y: y }
  }

  pixelRect (pos) {
    const vm = this
    const x = pos.x
    const y = pos.y
    const x1 = Math.floor(x * vm.getWidth() / vm.size) + vm.lw / 2
    const y1 = Math.floor(y * vm.getHeight() / vm.size) + vm.lw / 2
    const sx = Math.floor(vm.getWidth() / vm.size) - vm.lw
    const sy = Math.floor(vm.getHeight() / vm.size) - vm.lw
    return { x: x1, y: y1, sx: sx, sy: sy }
  }

  getSymmetric (pos, sz) {
    const pos1 = {}
    const pos2 = {}
    const pos3 = {}
    const pos4 = {}
    const pos5 = {}
    const pos6 = {}
    const pos7 = {}
    pos1.x = (sz - 1) - pos.x
    pos1.y = pos.y

    pos2.x = pos.x
    pos2.y = (sz - 1) - pos.y

    pos3.x = (sz - 1) - pos.x
    pos3.y = (sz - 1) - pos.y

    pos4.x = (sz - 1) - pos.y
    pos4.y = pos.x

    pos5.x = pos.y
    pos5.y = (sz - 1) - pos.x

    pos6.x = (sz - 1) - pos.y
    pos6.y = (sz - 1) - pos.x

    pos7.x = pos.y
    pos7.y = pos.x
    return [pos, pos1, pos2, pos3, pos4, pos5, pos6, pos7]
  }

  resetSymmetric (pos, sz) {
    const vm = this
    const a = vm.getSymmetric(pos, sz)
    a.forEach(function (v) {
      vm.resetPixel(v)
    })
  }

  setSymmetric (pos, sz) {
    const vm = this
    const a = vm.getSymmetric(pos, sz)
    a.forEach(function (v) {
      vm.setPixel(v)
    })
  }

  resetPixels () {
    const vm = this
    const rv = []
    for (let x = 0; x < vm.size; ++x) {
      const yvals = []
      rv[x] = yvals
      for (let y = 0; y < vm.size; ++y) {
        rv[x][y] = 0
      }
    }
    vm.pixels = rv
    return rv
  }

  getPixelString () { // Row major, left to right, top to bottom
    let vs = ''
    const vm = this
    const size = vm.size
    for (let x = 0; x < size; ++x) {
      for (let y = 0; y < size; ++y) {
        vs += ('' + vm.pixels[x][y])
      }
    }
    return vs
  }

  setMatlabString (mls) {
    const vm = this
    // mls is 15 or N bit matlab string
    let err = false
    if (vm.isSymmetric) {
      if (mls.length !== 15) { // not differentiating symmetry types, just sym vs non-sym
        err = true
      }
    } else {
      if (mls.length !== (vm.size * vm.size)) { // not differentiating symmetry types, just sym vs non-sym
        err = true
      }
    }
    for (let i = 0; i < mls.length; ++i) {
      if (mls[i] !== '0' && mls[i] !== '1') {
        err = true
      }
    }
    if (err) {
      return
    }
    // this only works for 10x10 C4v geometry!
    const bitMap = [
      [9, 0],
      [9, 1],
      [8, 1],
      [9, 2],
      [8, 2],
      [7, 2],
      [9, 3],
      [8, 3],
      [7, 3],
      [6, 3],
      [9, 4],
      [8, 4],
      [7, 4],
      [6, 4],
      [5, 4]
    ]
    vm.clearCanvas()
    vm.resetPixels()
    vm.drawGrid()
    for (let i = mls.length - 1; i >= 0; --i) {
      if (mls[i] === '1') {
        const idx = mls.length - (i + 1)
        if (vm.isSymmetric) {
          const pos = { x: bitMap[idx][0], y: bitMap[idx][1] }
          vm.setSymmetric(pos, vm.size)
        } else {
          const y = (vm.size - 1) - Math.floor(idx / vm.size)
          const x = Math.floor(idx % vm.size)
          vm.setPixel({ x: x, y: y })
        }
      }
    }
  }

  getMatlabString () {
    const vm = this
    let ml = ''
    if (vm.isSymmetric) {
      for (let index = 1; index <= vm.sumFromOne(vm.size / 2); index++) {
        const coord = vm.indexToCoord(index)
        ml += ('' + vm.pixels[coord.x][coord.y])
      }
    } else {
      for (let y = 0; y < vm.size; ++y) {
        for (let x = 0; x < vm.size; ++x) {
          ml += ('' + vm.pixels[x][y])
        }
      }
    }
    return ml
  }

  sumFromOne (num) {
    let sum = 0
    for (let x = 0; x <= num; x++) {
      sum += x
    }
    return sum
  }

  indexToCoord (index) {
    const vm = this
    let sumOfInc = 0
    const unitNum = vm.size / 2
    const realIndex = vm.sumFromOne(unitNum) - index
    let row = unitNum - 1
    let col = unitNum - 1
    for (let y = 1; y <= unitNum; y++) {
      sumOfInc += y
      if (sumOfInc > realIndex) {
        col = y - 1
        row = realIndex - (sumOfInc - y)
        return { x: row, y: col }
      }
    }
  }

  handleClick (pixel) { // only works for symmetric designs
    const vm = this
    if (vm.pixels[pixel.x][pixel.y]) {
      vm.resetSymmetric(pixel, vm.size)
    } else {
      vm.setSymmetric(pixel, vm.size)
    }
  }

  clearCanvas () {
    const vm = this
    vm.ctx.fillStyle = vm.pixelBgColor
    vm.ctx.fillRect(0, 0, vm.getWidth(), vm.getHeight())
    vm.ctx.beginPath()
  }

  drawGrid () {
    const vm = this
    for (let x = 0; x <= vm.getWidth(); x += vm.getWidth() / vm.size) {
      vm.ctx.moveTo(0.5 + x + vm.p, vm.p)
      vm.ctx.lineTo(0.5 + x + vm.p, vm.getHeight() + vm.p)
    }
    for (let x = 0; x <= vm.getHeight(); x += vm.getHeight() / vm.size) {
      vm.ctx.moveTo(vm.p, 0.5 + x + vm.p)
      vm.ctx.lineTo(vm.getWidth() + vm.p, 0.5 + x + vm.p)
    }
    vm.ctx.lineWidth = vm.lw
    vm.ctx.strokeStyle = vm.borderColor
    vm.ctx.stroke()
  }

  parseData (data) { // only used for size=10
    let dataObj = null
    if (data) {
      const textByLine = data.split('\n')
      dataObj = { PSV: {}, SH: {}, YoungsModulus: {}, PoissonsRatio: {} }
      for (let r = 0; r < textByLine.length; r++) {
        if (textByLine[r].trim().length > 0) {
          const line = textByLine[r].split('/')
          dataObj.PSV[line[0]] = line[1].slice(1, -1).replace(/ {2}/g, ',').split(',')
          dataObj.SH[line[0]] = line[2].slice(1, -1).replace(/ {2}/g, ',').split(',')
          dataObj.YoungsModulus[line[0]] = line[3]
          dataObj.PoissonsRatio[line[0]] = line[4]
        }
      }
    }
    return dataObj
  }

  resetPixel (pos) {
    const vm = this
    const vr = vm.pixelRect(pos)
    const x = pos.x
    const y = pos.y
    vm.pixels[x][y] = 0
    vm.ctx.fillStyle = vm.pixelBgColor
    vm.ctx.fillRect(vr.x, vr.y, vr.sx, vr.sy)
  }

  setPixel (pos) {
    const vm = this
    const vr = vm.pixelRect(pos)
    const x = pos.x
    const y = pos.y
    vm.pixels[x][y] = 1
    vm.ctx.fillStyle = vm.pixelFgColor
    vm.ctx.fillRect(vr.x, vr.y, vr.sx, vr.sy)
  }

  getPsvString () { // PSV - only used for size=10 symmetric
    const vm = this
    const mls = vm.getMatlabString()
    const psv = (vm.data ? vm.data.PSV[mls] : null)
    let rv = 'N/A'
    if (psv) {
      rv = psv.join(', ')
    }
    return rv
  }

  getPsv () { // only used for size=10 symmetric
    const vm = this
    const mls = vm.getMatlabString()
    const psv = (vm.data ? vm.data.PSV[mls] : null)
    let rv = []
    if (psv) {
      rv = psv
    } else {
      for (let i = 0; i < 16; ++i) { rv.push('N/A') }
    }
    return rv
  }

  getShString () { // SH only used for size=10 symmetric
    const vm = this
    const mls = vm.getMatlabString()
    const sh = (vm.data ? vm.data.SH[mls] : null)
    let rv = 'N/A'
    if (sh) {
      rv = sh.join(', ')
    }
    return rv
  }

  getSh () { // only used for size=10 symmetric
    const vm = this
    const mls = vm.getMatlabString()
    const sh = (vm.data ? vm.data.SH[mls] : null)
    let rv = []
    if (sh) {
      rv = sh
    } else {
      for (let i = 0; i < 16; ++i) { rv.push('N/A') }
    }
    return rv
  }

  getPrString () { // Poissons Ratio only used for size=10 symmetric
    const vm = this
    const mls = vm.getMatlabString()
    const psv = (vm.data ? vm.data.PoissonsRatio[mls] : null)
    let rv = 'N/A'
    if (psv) {
      rv = psv
    }
    return rv
  }

  getYmString () { // Youngs Modulus only used for size=10 symmetric
    const vm = this
    const mls = vm.getMatlabString()
    const psv = (vm.data ? vm.data.YoungsModulus[mls] : null)
    let rv = 'N/A'
    if (psv) {
      rv = psv
    }
    return rv
  }
}
