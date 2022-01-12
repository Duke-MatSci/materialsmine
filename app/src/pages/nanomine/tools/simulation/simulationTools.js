export default {
  name: 'SimulationTools',
  created () {
    this.$store.commit('setAppHeaderInfo', { icon: 'workspaces', name: 'Tools' })
  }
}
