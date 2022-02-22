import getters from './getters'
export default {
  namespaced: true,
  state () {
    return {
      toolName: 'Polymerizer',
      toolTitle: 'Polymerizer',
      toolLink: 'http://reccr.chem.rpi.edu/polymerizer/index.html',
      externalLink: true,
      toolText: 'Polymerizer is an online application for prediction of surface energy for nanocomposites featuring ' +
      'user-defined polymer structure input and structure-property MQSPR. This web app is in collaboration with ' +
      'and maintained by Rensselaer Polytechnic Institute.',
      toolImageFile: 'nanomine/prop_simu.png',
      displayTool: true
    }
  },
  getters
}
