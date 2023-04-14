export default {
  data () {
    return {
      offset: 0,
      rowNumber: 1
    }
  },
  computed: {
    factor () {
      return Math.ceil(this.titems / this.lengths)
    },
    lengths () {
      if (window.matchMedia('(max-width: 27.5em)').matches) {
        if (this.titems <= 4) {
          return this.titems
        }
        return this.minLength
      } else {
        if (this.titems <= 7) {
          return this.titems
        }
        return this.maxLength
      }
    }
  },
  methods: {
    itemExists (item) {
      return item > 0 && item <= this.titems
    },
    verifyRow () {
      if (this.citem === 1) return
      const limit = this.factor - 1
      const rowNumber = Math.ceil(this.citem / this.lengths)
      if (this.citem < this.titems && rowNumber <= limit) {
        this.offset = (rowNumber - 1) * this.lengths
        this.rowNumber = rowNumber
      } else {
        this.goToLastRow()
      }
    },
    goToBeginning () {
      this.rowNumber = 1
      this.offset = 0
      this.goToItem(1)
    },
    goToLastRow () {
      this.offset = this.titems - this.lengths
      this.rowNumber = this.factor
    },
    goToEnd () {
      this.goToLastRow()
      this.goToItem(this.titems)
    },
    goToItem (item) {
      if ((item !== this.citem) && this.itemExists(item)) {
        this.$emit(this.emitMessage, item)
        this.itemInput = item
      }
    },
    nextRow () {
      if (this.rowNumber === this.factor) return
      const limit = this.factor - 1
      if (this.rowNumber < limit) {
        this.offset += this.lengths
        this.rowNumber += 1
      } else {
        this.goToLastRow()
      }
    },
    prevRow () {
      if (this.rowNumber === 1) return
      if (this.rowNumber === this.factor) {
        var elem = this.factor
        this.offset = (elem - 2) * this.lengths
        this.rowNumber -= 1
      } else {
        this.offset -= this.lengths
        this.rowNumber -= 1
      }
    }
  }
}
