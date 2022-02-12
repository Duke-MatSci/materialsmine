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
          imageFile: 'nanomine/Image_Binarization.png',
          link: '/nm/binarization_homepage',
          title: 'Image Binarization',
          text: 'Binarization is the process of converting a micrograph to a black & white image' +
          '(assuming there are only 2 phases) by removing noise and thus simplifying its analysis.' +
          'All Characterization and Reconstruction algorithms work with binarized images only.',
          display: true
        },
        {
          imageFile: 'nanomine/Microstructure_Characterization.png',
          link: '/nm/characterization_homepage',
          title: 'Microstructure Characterization',
          text: 'Microstructure Characterization refes to a statistical quantification of morphology.' +
          'It essentially converts multi-dimensional microstructure recorded in images' +
          'into a set of functions (aka features/descriptors/predictors) that encode significant morphological details.' +
          'The functions obtained as a result are useful in developing insights on structure - property relationships' +
          'and serve as the basis for reconstruction algorithms.' +
          'Upload a binarized microstructure image / set of images and obtain characterization data of your choice.',
          display: true
        },
        {
          imageFile: 'nanomine/Microstructure_Reconstruction.png',
          link: '/nm/reconstruction_homepage',
          title: 'Microstructure Reconstruction',
          text: '>Reconstruction involves constructing a statistically equivalent microstructure image' +
          'given some statistical characterization. In most cases,' +
          'reconstruction is cast as an optimization problem; with the goal of matching characteristics of' +
          'reconstructed image to that of input image.' +
          'In this section, you can upload a binary microstructure image / set of images and obtain 2D/3D' +
          'reconstructions using method of your choice.',
          display: true
        },{
          imageFile: 'nanomine/Intelligent_Characterization.png',
          link: '/nm/IntelligentCharacterize',
          title: 'Intelligent Characterization',
          text: 'The intelligent characterization tool selects the most suitable characterization' +
          'method between the “physical descriptors” and the “spectral density function (SDF)”' +
          'approaches based on analyzing the user uploaded image(s). Results generated can be easily passed to the NanoMine Database.',
          display: true
        }
      ],
      references: [
        {
          authors: 'Bostanabad, R., Zhang, Y., Li, X., Kearney, T., Brinson, L. C., Apley, D., Wing K., and Chen, W.',
          title: 'Computational Microstructure Characterization and Reconstruction: Review of the State-of-the-art Techniques',
          venue: 'Progress in Materials Science 95',
          date: 'June 2018'
        },
        {
          authors: 'Li, X., Zhang, Y., Zhao, H., Burkhart, C., Brinson, L.C., Chen, W.',
          title: 'A Transfer Learning Approach for Microstructure Reconstruction and Structure-property Predictions',
          venue: 'Scientific Report',
          date: '2018'
        },
        {
          authors: 'Ghumman, U.F., Iyer, A., Dulal, R., Munshi, J., Wang, A., Chien, T., Balasubramanian, G., and Chen, W.',
          title: 'A Spectral Density Function Approach for Active Layer Design of Organic Photovoltaic Cells',
          venue: 'Journal of Mechanical Design, Special Issue on Design of Engineered Materials and Structures',
          date: 'July 2018'
        },
        {
          authors: 'Khurshid, K., Siddiqi, I., Faure, C. and Vincent, N.',
          title: 'Comparison of Niblack inspired binarization methods for ancient documents',
          venue: 'DRR, 7247, pp.1-10',
          date: '2009'
        },
        {
          authors: 'Rintoul, M.D. and Torquato, S.',
          title: 'Reconstruction of the structure of dispersions',
          venue: 'Journal of Colloid and Interface Science, 186(2), pp.467-476',
          date: '1997'
        },
        {
          authors: 'Yeong,C. and Torquato,S.',
          title: 'Reconstructing random media',
          venue: 'Physical Review E, vol. 57, no. 1, p.495',
          date: '1998'
        },
        {
          authors: 'Liu, Y., Greene, M.S., Chen, W., Dikin, D., Liu, W.K.',
          title: 'Computational Microstructure Characterization and Reconstruction for Stochastic Multiscale Design',
          venue: 'Computer Aided Design, 45 (1), 65-76',
          date: '2013'
        },
        {
          authors: 'Yu, S., Zhang, Y., Wang, C., Lee, W.K., Dong, B., Odom, T.W., Sun, C. and Chen, W.',
          title: 'Characterization and design of functional quasi-random nanostructured materials using spectral density function',
          venue: 'Journal of Mechanical Design, 139(7), p.071401',
          date: '2017'
        },
        {
          authors: 'Xu, H., Li, Y., Brinson, C. and Chen, W.',
          title: 'A descriptor-based design methodology for developing heterogeneous microstructural materials system',
          venue: 'Journal of Mechanical Design, 136(5), p.051007',
          date: '2014'
        },
        {
          authors: 'Xu, H., Dikin, D.A., Burkhart, C. and Chen, W.',
          title: 'Descriptor-based methodology for statistical characterization and 3D reconstruction of microstructural materials',
          venue: 'Computational Materials Science, 85, pp.206-216',
          date: '2014'
        }
      ]
    }
  },
  getters
}
