export default {
  name: 'CSVPlotter',
  created () {
    this.$store.commit('setAppHeaderInfo', { icon: 'workspaces', name: 'Curation Plot' })
  }
}
