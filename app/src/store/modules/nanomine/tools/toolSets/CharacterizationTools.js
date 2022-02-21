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
      toolSetTitle: 'Microstructure Characterization',
      toolSetName: 'CharacterizationTools',
      toolSetDescription: 'Microstructure Characterization refes to a statistical quantification of morphology.' +
        'It essentially converts multi-dimensional microstructure recorded in images' +
        'into a set of functions (aka features/descriptors/predictors) that encode significant morphological details.' +
        'The functions obtained as a result are useful in developing insights on structure - property relationships' +
        'and serve as the basis for reconstruction algorithms.' +
        'Upload a binarized microstructure image / set of images and obtain characterization data of your choice.',
      toolSetImageFile: 'nanomine/Microstructure_Characterization.png',
      toolSetLink: 'characterization_homepage',
      displayToolSet: true,
      pageDescription: 'Choose the characterization method from the options below. Note that uploaded images will be binarized using Otsu method',
      tools: [
        'CorrelationCharacterize',
        'DescriptorCharacterize',
        'SDFCharacterize'
      ]
    }
  },
  getters
}
