import getters from './getters'

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
      toolSetName: 'SimulationTools',
      toolSetLink: 'simtools',
      toolSetTitle: 'Material Property Simulation',
      pageDescription: 'We provide online version of physics-based simulation tools that take advantage of our most recent ' +
      'development in viscoelasticity and dielectric relaxation theories for interphase analysis in nanocomposites, ' +
      'statistical structure-property correlation models, as well as materials optimization methods.',
      displayToolSet: true,
      tools: [
        'Polymerizer'
      ]
    }
  },
  getters
}
