import { ref } from 'vue'

export default function () {
  const files = ref([])

  function addFiles (newFiles) {
    const newUploadableFiles = [...newFiles]
      .map((file) => new UploadableFile(file))
      .filter((file) => !fileExists(file.id))
    files.value = files.value.concat(newUploadableFiles)
  }

  function fileExists (otherId) {
    return files.value.some(({ id }) => id === otherId)
  }

  function removeFile (file) {
    const index = files.value.indexOf(file)
    if (index > -1) files.value.splice(index, 1)
  }

  function clearAllFiles () {
    files.value = []
  }

  function modifyStatus (index, status) {
    files.value[index].status = status
  }

  return { files, addFiles, removeFile, clearAllFiles, modifyStatus }
}

class UploadableFile {
  constructor (file) {
    this.file = file
    if (/\s/g.test(file.name)) {
      this.file = new File([file], file.name.replace(/ /g, '_'), {
        type: file.type,
        lastModified: file.lastModified
      })
    } else {
      this.file = file
    }
    this.id = `${this.file.name}-${file.size}-${file.lastModified}-${file.type}`
    this.status = 'incomplete'
  }
}
