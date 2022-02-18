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
      toolSetImageFile: 'nanomine/Microstructure_Reconstruction.png',
      toolSetName: 'ReconstructionTools',
      toolSetLink: '/nm/reconstruction_homepage',
      toolSetTitle: 'Microstructure Reconstruction',
      toolSetDescription: 'Reconstruction involves constructing a statistically equivalent microstructure image' +
        'given some statistical characterization. In most cases,' +
        'reconstruction is cast as an optimization problem; with the goal of matching characteristics of' +
        'reconstructed image to that of input image.' +
        'In this section, you can upload a binary microstructure image / set of images and obtain 2D/3D' +
        'reconstructions using method of your choice.',
      displayToolSet: true,
      pageDescription: 'Choose the reconstruction method from the options below. Note that uploaded images will be binarized using Otsu method.',
      tools: [
        'CorrelationReconstruct',
        'DescriptorReconstruct',
        'SDFReconstruct',
        'TransferLearning'
      ]
    }
  },
  getters
}
