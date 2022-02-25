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
      link: state.externalLink ? state.toolSetLink : `/nm/tools/${state.toolSetLink}`,
      imageFile: state.toolSetImageFile,
      title: state.toolSetTitle,
      text: state.toolSetDescription,
      display: state.displayToolSet,
      references: getters.references
    }
  },
  toolReferenceSet (state, getters, rootState, rootGetters) {
    const referenceSet = new Set()
    if (state.tools) {
      for (const tool of state.tools) {
        const newRefs = rootGetters[`${tool}/references`]
        if (newRefs) {
          newRefs.forEach(ref => referenceSet.add(ref))
        }
      }
    }
    if (state.toolSets) {
      for (const toolSet of state.toolSets) {
        const newRefs = rootGetters[`${toolSet}/toolReferenceSet`]
        if (newRefs) {
          newRefs.forEach(ref => referenceSet.add(ref))
        }
      }
    }
    return referenceSet
  },
  references (state, getters) {
    return Array.from(getters.toolReferenceSet)
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
