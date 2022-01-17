export default {
  name: 'News',
  created () {
    this.$store.commit('setAppHeaderInfo', { icon: 'text_snippet', name: 'Research + News' })
  }
}
