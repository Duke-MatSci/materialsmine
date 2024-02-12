import getters from './getters.js'

export default {
  state () {
    return {
      appHeaderInfo: {
        icon: '',
        type: 'home',
        name: 'MaterialsMine',
        subtitle:
          'An open source repository for nanocomposite data (NanoMine), and mechanical metamaterials data (MetaMine)'
      },
      videos: {
        'nanomine/visualization_tutorial': {
          url: 'https://materialsmine.org/nmf/nanomine-vis.mp4',
          title: 'Visualization Tutorial',
          text: 'This video tutorial show basic usage of the search and visualization tool. (no audio)'
        },
        'nanomine/mcr/intelligent_characterization_tutorial': {
          url: 'https://materialsmine.org/nmf/Intelligent_Characterization_Tutorial_by_Umar.mp4',
          title: 'Intelligent Characterization Tutorial',
          text: 'This narrated video tutorial shows how to use the Intelligent Characterization tool and view results.'
        },
        'nanomine/mcr/basic_module_tool_tutorial': {
          url: 'https://materialsmine.org/nmf/NanoMine_Demo_by_Akshay.mp4',
          title: 'Basic Module Characterization/Reconstruction Tool Usage',
          text: 'This video tutorial shows overall Module Characterization and Reconstruction tool usage. (no audio)'
        }
      }
    }
  },
  getters
}
