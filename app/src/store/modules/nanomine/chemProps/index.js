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
      references: [
        {
          authors: 'Hu, Bingyin, Anqi Lin, and L. Catherine Brinson',
          title: 'ChemProps: A RESTful API enabled database for composite polymer name standardization.',
          venue: 'Journal of cheminformatics 13.1 (2021): 1-13',
          date: '2021'
        },
        {
          authors: 'Probst, Daniel, and Jean-Louis Reymond',
          title: 'Smilesdrawer: parsing and drawing SMILES-encoded molecular structures using client-side javascript.',
          venue: 'Journal of chemical information and modeling 58.1 (2018): 1-7.',
          date: '2018'
        }
      ]
    }
  },
  getters
}
