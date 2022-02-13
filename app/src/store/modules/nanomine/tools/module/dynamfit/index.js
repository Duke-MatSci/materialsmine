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
        {
          authors: 'Bradshaw et al.',
          title: 'A Sign Control Method for Fitting and Interconverting Material Functions for Linearly Viscoelastic Solids',
          venue: 'Mechanics of Time-Dependent Materials. 1997 1(1)',
          date: '1997'
        }
      ]
    }
  },
  getters
}
