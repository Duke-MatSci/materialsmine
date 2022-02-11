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
          imageFile: 'nanomine/prop_simu.png',
          link: 'http://reccr.chem.rpi.edu/polymerizer/index.html',
          title: 'Polymerizer',
          text: 'Polymerizer is an online application for prediction of surface energy for nanocomposites featuring\
          user-defined polymer structure input and structure-property MQSPR. This web app is in collaboration with\
          and maintained by Rensselaer Polytechnic Institute.',
          display: true
        },
        {
          imageFile: 'nanomine/FEA_dielectrics.png',
          link: '',
          title: 'Prediction of Dielectric Constant in Nanodielectrics',
          text: 'This web app simulates the dielectric spectroscopy in nanocomposites with explicit implementation of\
          microstructure dispersion as well as interphase relaxation model. This project is in collaboration with\
          Rensselaer Polytechnic Institute.',
          display: false
        },
        {
          imageFile: 'nanomine/MCFEA.jpg',
          link: '',
          title: 'Prediction of DielectrIntegration of Monte Carlo and Finite Element Analysis in Nanodielectricsic Constant in Nanodielectrics',
          text: 'This web app simulates the charge transport in dielectric polymers and their nanocomposites by compling\
          finite element analysis and Monte Carlo. This project is in collaboration with Rensselaer Polytechnic\
          Institute.',
          display: false
        }
      ]
    }
  },
  getters
}
