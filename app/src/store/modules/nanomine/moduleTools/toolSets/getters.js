export default {
  toolCardContent (state, getters, rootState, rootGetters) {
    const contentList = {}
    if (state.toolSets) {
      for (const toolSet of state.toolSets) {
        contentList[toolSet] = rootGetters[`nanomine/moduleTools/${toolSet}`].cardContent
      }
    }
    if (state.tools) {
      for (const tool of state.tools) {
        contentList[tool] = rootGetters[`nanomine/moduleTools/${tool}`].cardContent
      }
    }
  },
  cardContent (state, getters) {
    return {
      name: state.toolSetName,
      link: state.toolSetLink,
      imageFile: state.toolSetImageFile,
      title: state.toolSetTitle,
      text: state.toolSetDescription,
      display: state.displayToolSet,
      references: getters.references
    }
  },
  references (state, getters, rootState, rootGetters) {
    const referenceList = []
    if (state.tools) {
      for (const tool of state.tools) {
        referenceList.push(...rootGetters[`nanomine/moduleTools/${tool}`].references)
      }
    }
    if (state.toolSets) {
      for (const toolSet of state.toolSets) {
        referenceList.push(...rootGetters[`nanomine/moduleTools/${toolSet}`].references)
      }
    }
    return referenceList
  }
}
