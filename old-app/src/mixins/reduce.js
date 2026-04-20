export default {
  data () {
    return {
      hideAssetNavLeft: false,
      hideAssetNavRight: false
    }
  },
  methods: {
    reduceDescription (args, size = 50) {
      const arr = args.split(' ')
      arr.splice(size)
      const arrSplice = arr.reduce((a, b) => `${a} ${b}`, '')
      const res = arrSplice.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      return `${res}...`
    },

    reduceAsset (args) {
      let movedAsset; const vm = this
      if (window.matchMedia('(max-width: 40.5em)').matches) {
        vm.screen = 1
      } else if (window.matchMedia('(max-width: 56.25em)').matches) {
        vm.screen = 2
      } else {
        vm.screen = 3
      }
      if (args === 'prev') {
        if (!this.pushedAssetItem.length) {
          this.hideAssetNavLeft = true
          return false
        } else {
          this.hideAssetNavLeft = false
          movedAsset = this.pushedAssetItem[this.pushedAssetItem.length - 1]
          this.assetItems.unshift(movedAsset)
          this.pushedAssetItem.pop()
        }
      } else {
        if (!this.assetItems.length) {
          this.hideAssetNavRight = true
          return false
        } else if (this.assetItems.length <= this.screen) {
          this.hideAssetNavRight = true
          return false
        } else {
          this.hideAssetNavRight = false
          movedAsset = this.assetItems[0]
          this.pushedAssetItem.push(movedAsset)
          this.assetItems.shift()
        }
      }
    }
  }
}
