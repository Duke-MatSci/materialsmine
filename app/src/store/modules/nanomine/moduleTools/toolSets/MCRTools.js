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
      toolListTitle: 'Microstructure Characterization and Reconstruction',
      toolListDescription: 'An essential component of computational material design involves microstructure analysis. Our user friendly ' +
      'webtools allow users to characterize microstructure images and reconstruct statistically equivalent microstructures. Users can choose ' +
      'among multiple input formats as well as characterization and reconstruction methods. Available characterization and reconstruction ' +
      'methods include: Correlation Functions (Two-point, Lineal Path, Cluster, and Surface), Spectral Density Function (SDF), and Descriptors.',
      pageDescription: 'Microstructure Characterization and Reconstruction (MCR) is an essential component of computational material ' +
      'design as it helps in understanding structure - property relationships. This page allows you to characterize and reconstruct images ' +
      'of polymer nanocomposites. All webtools accept inputs in multiple formats and allow download of results. Please click on the ' +
      'appropriate button.',
      toolListImageFile: 'nanomine/recon_tool.png',
      toolListLink: '/nm/mcr_homepage',
      displayToolList: true,
      tools: [
        'IntelligentCharacterize'
      ],
      toolSets: [
        'BinarizationTools',
        'CharacterizationTools',
        'ReconstructionTools'
      ]
    }
  },
  getters
}
