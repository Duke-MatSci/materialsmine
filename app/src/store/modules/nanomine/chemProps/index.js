import getters from './getters.js'

export default {
  state () {
    return {
      appHeaderInfo: {
        icon: '',
        type: 'home',
        name: 'MaterialsMine',
        subtitle: 'An open source repository for nanocomposite data (NanoMine), and mechanical metamaterials data (MetaMine)'
      },
      references: [
        '10.1186/s13321-021-00502-6',
        '10.1021/acs.jcim.7b00425'
      ]
    }
  },
  getters
}
