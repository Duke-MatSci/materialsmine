export default {
  toolsCardContent (state, getters, rootState, rootGetters) {
    const contentList = {}
    if (state.toolSets) {
      for (const toolSet of state.toolSets) {
        contentList[toolSet] = rootGetters[`${toolSet}/cardContent`]
      }
    }
    if (state.tools) {
      for (const tool of state.tools) {
        contentList[tool] = rootGetters[`${tool}/cardContent`]
      }
    }
    return contentList
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
        referenceList.push(...rootGetters[`${tool}/references`])
      }
    }
    if (state.toolSets) {
      for (const toolSet of state.toolSets) {
        referenceList.push(...rootGetters[`${toolSet}/references`])
      }
    }
    return referenceList
  },
  pageContent (state, getters) {
    return {
      title: state.toolSetTitle,
      text: state.pageDescription,
      cards: getters.toolsCardContent,
      references: getters.references
    }
  }
}
