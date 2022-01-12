export default {
  name: 'HowTo',
  created () {
    this.$store.commit('setAppHeaderInfo', { icon: 'smart_display', name: 'How To' })
  }
}
