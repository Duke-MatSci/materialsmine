import { CREATE_DATASET_ID_MUTATION } from '@/modules/gql/dataset-gql'
import router from '@/router'
import apollo from '@/modules/gql/apolloClient'

export default {
  async createDatsetIdVuex ({ commit }) {
    await apollo.mutate({
      mutation: CREATE_DATASET_ID_MUTATION
    }).then((result) => {
      const datasetId = result.data.createDatasetId.datasetGroupId
      commit('setDatasetId', datasetId)
      router.push({ name: 'CurateSpreadsheet', params: {datasetId}})
    }).catch((error) => {
      if (error.message.includes('unused datasetId')) {
        const datasetId = error.message.split('-')[1]?.split(' ')[1]
        commit('setDatasetId', datasetId)
        router.push({ name: 'CurateSpreadsheet', params: {datasetId}})
      }
      else console.error('error:', error)
    })
  }
}
