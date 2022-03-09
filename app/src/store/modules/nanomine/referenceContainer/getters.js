export default {
  getReferenceById: (state) => (id) => {
    return state.references[id]
  }
}
