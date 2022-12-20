import mutations from './mutations.js'
import actions from './actions.js'
import getters from './getters.js'

export default {
  // namespaced: true,
  state () {
    return {
      appHeaderInfo: {
        icon: '',
        pagetype: 'home',
        name: 'MaterialsMine',
        subtitle: 'An open source repository for nanocomposite data (NanoMine), and mechanical metamaterials data (MetaMine)'
      },
      dialogBox: false,
      // used for snackbar 1 (props)
      snackbar: false,
      // used for snackbar 2 (watcher)
      snackMsg: ''
    }
  },
  mutations,
  actions,
  getters
}
