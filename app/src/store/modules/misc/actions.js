export default {
  async uploadFile ({ commit }, { file = null, isTemp = true }) {
    if (!file) return
    let fileName = null
    let fileLink = null
    const formData = new FormData()
    formData.append('uploadfile', file[0])
    try {
      const res = await fetch(`/api/files/upload?isTemp=${isTemp}`, {
        method: 'POST',
        body: formData
      })
      const resData = await res.json()
      const { filename, swaggerFilename } = resData?.files[0]
      fileLink = filename
      fileName = swaggerFilename
      commit('setUploadedFile', fileName)
    } catch (err) {
      throw new Error(err?.message ?? 'File upload Error')
    }
    return { fileName, fileLink }
  }
}
