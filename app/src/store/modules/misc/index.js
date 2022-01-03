import mutations from './mutations.js'
import actions from './actions.js'
import getters from './getters.js'

export default {
  state () {
    return {
      appHeaderInfo: {
        icon: '',
        type: 'home',
        name: 'MaterialsMine',
        subtitle: 'An open source repository for nanocomposite data (NanoMine), and mechanical metamaterials data (MetaMine)'
      }
    }
  },
  mutations,
  actions,
  getters
}
