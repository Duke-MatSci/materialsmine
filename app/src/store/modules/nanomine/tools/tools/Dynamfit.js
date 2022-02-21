import getters from './getters.js'

export default {
  namespaced: true,
  state () {
    return {
      appHeaderInfo: {
        icon: '',
        type: 'home',
        name: 'MaterialsMine',
        subtitle: 'An open source repository for nanocomposite data (NanoMine), and mechanical metamaterials data (MetaMine)'
      },
      toolName: 'Dynamfit',
      toolLink: 'Dynamfit',
      toolTitle: 'Dynamfit',
      toolImageFile: 'nanomine/dynamfit.png',
      toolText: 'Dynamfit is a sign control algorithm for Prony Series fitting. This program fits a viscoelastic mastercurve from DMA ' +
      'experiments with a Prony Series. The Prony Series coefficients can be used as baseline properties for the matrix in a FEA simulation ' +
      'of nanocomposites.',
      displayTool: true,
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
