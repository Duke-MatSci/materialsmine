export default {
  name: 'HowTo',
  data: () => ({
    videos: []
  }),
  // components: {
  //   vPlayBack
  // },
  methods: {
    showBox () {
      console.log(this.filter)
    },
    hideVideos (idx) {
      const vm = this
      let noTouch = null
      if (idx >= 0) {
        noTouch = idx
      }
      vm.videos.forEach(function (v, i) {
        if (i !== noTouch) {
        // vm.videos[i].hide = true
          const o = vm.videos[i]
          o.hide = true
          vm.$set(vm.videos, i, o)
        }
      })
    },
    displayVideo (idx, link) {
      if (link) {
        console.log('Opening ' + link)
        return window.open(link, '_blank')
      }
      const vm = this
      vm.hideVideos(idx)
      const isHidden = vm.videos[idx].hide
      const o = vm.videos[idx]
      o.hide = !isHidden
      vm.$set(vm.videos, idx, o)
      console.log('Hidden(' + idx + ') = ' + vm.videos[idx].hide)
    }
  },
  mounted () {
    const vm = this
    const vids = vm.$store.getters.videos
    Object.keys(vids).forEach((v, idx) => {
      const key = v
      const o = vids[key]
      o.hide = true
      o.nm = key
      vm.videos.push(o)
    })
    vm.hideVideos()
  },
  created () {
    this.$store.commit('setAppHeaderInfo', { icon: 'smart_display', name: 'How To' })
  }
}
