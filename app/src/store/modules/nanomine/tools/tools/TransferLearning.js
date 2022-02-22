import getters from './getters'
export default {
  namespaced: true,
  state () {
    return {
      toolName: 'TransferLearning',
      toolLink: 'https://ideal.mech.northwestern.edu/research/software/download/',
      externalToolLink: true,
      linkText: 'Request Download',
      toolTitle: 'Transfer Learning',
      toolText: 'Transfer learning captures spatial correlations for microstructure reconstruction by leveraging the superior capabilities ' +
      'of deep convolution networks. It incorporates an encoder-decoder process process and feature-match optimization algorithm using ' +
      'the pre-trained VGG19 model. It can handle complex microstructures, and has the potential of expediting the discovery of new ' +
      'materials. Please refer to the article by Li et. al. (see references) for more details. The code package may be requested for ' +
      'research purposes by clicking on the link below. You will asked to fill in a form and we will email you following the form completion.',
      display: true,
      references: [
        {
          authors: 'Li, X., Zhang, Y., Zhao, H., Burkhart, C., Brinson, L.C., Chen, W.',
          title: 'A Transfer Learning Approach for Microstructure Reconstruction and Structure-property Predictions',
          venue: 'Scientific Report',
          date: '2018'
        }
      ]
    }
  },
  getters
}
