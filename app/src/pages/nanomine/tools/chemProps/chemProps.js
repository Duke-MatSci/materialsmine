export default {
  name: 'ChemProps',
  created () {
    this.$store.commit('setAppHeaderInfo', { icon: 'workspaces', name: 'ChemProps' })
  }
}
