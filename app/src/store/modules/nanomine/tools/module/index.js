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
      tools: [
        {
          imageFile: 'nanomine/recon_tool.png',
          link: '/mm/mcr_homepage',
          title: 'Microstructure Characterization and Reconstruction',
          text: 'An essential component of computational material design involves microstructure analysis. Our user ' +
          'friendly webtools allow users to characterize microstructure images and reconstruct statistically ' +
          'equivalent microstructures. Users can choose among ' +
          'multiple input formats as well as characterization and reconstruction methods. Available characterizationd ' +
          'and reconstruction methods include: Correlation Functions (Two-point, Lineal Path, Cluster, and Surface), ' +
          'Spectral Density Function (SDF), and Descriptors.',
          display: true
        },
        {
          imageFile: 'nanomine/dynamfit.png',
          link: '/mm/Dynamfit',
          title: 'Dynamfit',
          text: 'Dynamfit is a sign control algorithm for Prony Series fitting. This program fits a viscoelastic ' +
          'mastercurve from DMA experiments with a Prony Series. The Prony Series coefficients can be used as ' +
          'baseline properties for the matrix in a FEA simulation of nanocomposites.',
          display: true
        },
        {
          imageFile: 'nanomine/webtool_tuneshifting.png',
          link: '/AUTOFIT',
          title: 'Automatic Fitting of Interphase Relaxation Model in Nanocomposites',
          text: 'This algorithm derives interphase relaxation properties in nanocomposites using an inverse method that ' +
          'starts from composite properties and microstructure. It integrates finite element analysis and ' +
          'metamodeling optimization that predicts the interphase properties that results in minimal error between ' +
          'simulated properties from FEA and experimental composite properties.',
          display: false
        }
      ]
    }
  },
  getters
}
