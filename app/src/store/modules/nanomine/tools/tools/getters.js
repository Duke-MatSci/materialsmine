export default {
  references (state) {
    return state.references
  },
  jobInfo (state) {
    return {
      jobTitle: state.jobTitle,
      pageTitle: state.pageTitle,
      description: state.description,
      aspectRatio: state.aspectRatio,
      getImageDimensions: state.getImageDimensions,
      submit: state.submit,
      uploadOptions: state.uploadOptions,
      acceptableFileTypes: state.acceptableFileTypes,
      useWebsocket: state.useWebsocket,
      references: state.references,
      selects: state.selects
    }
  },
  cardContent (state) {
    return {
      name: state.toolName,
      link: state.toolLink,
      linkText: state.linkText,
      externalLink: state.externalLink,
      imageFile: state.toolImageFile,
      title: state.toolTitle,
      text: state.toolText,
      display: state.displayTool,
      references: state.references
    }
  }
}
