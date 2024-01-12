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
  },
  async deleteFile (
    { commit, rootGetters },
    { name = null, link = null, isTemp = true }
  ) {
    if (!link && !name) return

    const url = !link ? `/api/files/${name}?isFileStore=${isTemp}` : link
    const token = rootGetters['auth/token']

    let deleted = false
    let error = null

    try {
      const req = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        method: 'DELETE'
      })
      if (req.status !== 200) {
        let res
        if (req.status === 400) res = await req.json()
        throw new Error(res?.message ?? 'Something went wrong')
      }
      commit('setUploadedFile', '')
      deleted = true
    } catch (err) {
      error = err?.message ?? 'Something went wrong'
    }

    return { deleted, error }
  }
}
