export default {
  name: 'XmlUploader',
  created () {
    this.$store.commit('setAppHeaderInfo', {icon: 'cloud_upload', name: 'Data Uploader'})
  }
}
