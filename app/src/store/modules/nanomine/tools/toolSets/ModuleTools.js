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
      toolSetTitle: 'Statistical Learning and Analysis Module Tools',
      pageDescription: 'Statistical learning and analysis modules include web and downloadable packages that can be used to pre-process ' +
      'and analyze structure and material property data. Each of the modules will specify the required input format and output data, and provide ' +
      'a brief introduction behind the mechanism of the algorithm.',
      tools: [
        'Dynamfit'
      ],
      toolSets: [
        'MCRTools'
      ]
    }
  },
  getters
}
