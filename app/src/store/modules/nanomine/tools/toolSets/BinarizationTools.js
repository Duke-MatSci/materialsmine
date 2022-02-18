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
      toolSetTitle: 'Image Binarization',
      toolSetname: 'BinarizationTools',
      toolSetDescription: 'Binarization is the process of converting a micrograph to a black & white image' +
        '(assuming there are only 2 phases) by removing noise and thus simplifying its analysis.' +
        'All Characterization and Reconstruction algorithms work with binarized images only.',
      toolSetImageFile: 'nanomine/Image_Binarization.png',
      toolSetLink: '/nm/binarization_homepage',
      displayToolSet: true,
      pageDescription: 'Choose the Binarization method from the options below.',
      tools: [
        'OtsuBinarization',
        'NiblackBinarization'
      ]
    }
  },
  getters
}
