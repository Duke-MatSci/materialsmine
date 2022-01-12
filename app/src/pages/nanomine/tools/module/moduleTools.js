export default {
  name: 'ModuleTools',
  created () {
    this.$store.commit('setAppHeaderInfo', { icon: 'workspaces', name: 'Tools' })
  }
}
