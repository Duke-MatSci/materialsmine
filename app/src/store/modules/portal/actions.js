import debounce from '@/modules/debounce'
import { publishXSD } from '@/modules/vega-chart'

const deploymentTypes = {
  general: {
    deployUrl: '/api/admin/deployment/general',
    statusUrl: '/api/admin/deployment/status/general'
  },
  ontology: {
    deployUrl: '/api/admin/deployment/ontology',
    statusUrl: '/api/admin/deployment/status/ontology'
  }
}

// Helper function to handle errors
function handleError ({ commit, getters }) {
  if (getters.isError === false) {
    commit('setError', true)
  }
  commit('setDialogBox', true, { root: true })
}

export default {
  async fetchVersions (context) {
    const token = context.rootGetters['auth/token']
    const response = await fetch('/api/admin/deployment/tags', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token
      }
    })
    if (!response || response.statusText !== 'OK' || response.status !== 200) {
      const error = new Error()
      context.commit(
        'setSnackbar',
        {
          message: 'Failed to get tags!',
          action: () => context.dispatch('fetchVersions')
        },
        { root: true }
      )
      throw error
    }
    const responseData = await response.json()
    context.commit('setDockerVersions', responseData)
  },

  async deploy ({ commit, rootGetters, getters, dispatch }, type) {
    commit('setDialogBox', false, { root: true })
    commit('setLoadingMessage', {
      message: 'Please wait...'
    })
    commit('setLoading', true)
    const versionData = {
      version: getters.currentVersion
    }
    const token = rootGetters['auth/token']

    try {
      const response = await fetch(deploymentTypes[type].deployUrl, {
        method: 'POST',
        body: JSON.stringify(versionData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token
        }
      })

      if (!response || !response.ok || response.status !== 200) {
        const error = new Error(response?.message || 'Something went wrong!')
        throw error
      }

      const responseData = await response.json()
      if (responseData.status === 'ACCEPTED') {
        commit('setLoadingMessage', {
          message: responseData.message
        })
        debounce(() => dispatch('deploymentStatus', type), 50000)()
      }
    } catch (error) {
      commit('setLoading', false)
      handleError({ commit, getters }) // this sets error to true in the store and opens up the dialogue box, allowing the user to see the message
    }
  },

  async deploymentStatus ({ commit, dispatch, rootGetters, getters }, type) {
    const token = rootGetters['auth/token']
    try {
      const response = await fetch(deploymentTypes[type].statusUrl, {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + token
        }
      })
      if (
        !response ||
        response.statusText !== 'OK' ||
        response.status !== 200
      ) {
        const error = new Error(response?.message || 'Something went wrong!')
        throw error
      }
      const responseData = await response.json()
      const { status } = responseData

      if (status === 'STILL PROCESSING' || status === 'STARTING') {
        debounce(() => dispatch('deploymentStatus', type), 50000)()
      } else {
        commit('setLoading', false)
        commit('setDialogBox', true, { root: true })

        if (status === 'DONE') {
          commit('setSuccess', true)
        } else if (status === 'FAILED') {
          commit('setError', true)
        }
      }
    } catch (error) {
      commit('setLoading', false)
      handleError({ commit, getters }) // this sets error to true in the store and opens up the dialogue box, allowing the user to see the message
    }
  },

  async fetchJsonSchema ({ commit, rootGetters }) {
    const token = rootGetters['auth/token']
    try {
      const response = await fetch('/api/curate/schema?getXSD=true', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      if (!response || response.status !== 201) {
        return commit(
          'setSnackbar',
          {
            message: response?.message || 'Something went wrong',
            duration: 7000
          },
          { root: true }
        )
      }
      const responseData = await response.json()
      commit('setXsd', responseData.xsd)
    } catch (error) {
      return commit(
        'setSnackbar',
        {
          message: error?.message || 'Server error',
          duration: 7000
        },
        { root: true }
      )
    }
  },

  async downloadJsonSchema ({ commit, dispatch, rootGetters }) {
    const token = rootGetters['auth/token']
    commit(
      'setSnackbar',
      {
        message: 'Preparing File For Download',
        duration: 7000
      },
      { root: true }
    )
    try {
      const response = await fetch('/api/curate?isFile=true', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + token
        },
        responseType: 'blob'
      })
      if (!response.ok) {
        return commit(
          'setSnackbar',
          {
            message: 'something went wrong',
            duration: 7000
          },
          { root: true }
        )
      }
      const data = await response.blob()
      const fileUrl = window.URL.createObjectURL(data)
      const fileLink = document.createElement('a')
      fileLink.href = fileUrl
      fileLink.setAttribute('download', 'XSD-Schema')
      document.body.appendChild(fileLink)
      fileLink.click()
      document.body.removeChild(fileLink)
    } catch (error) {
      return commit(
        'setSnackbar',
        {
          message: 'Something went wrong',
          action: () => dispatch('portal/downloadJsonSchema')
        },
        { root: true }
      )
    }
  },

  async publishSchema ({ commit, dispatch, rootGetters }) {
    const isAdmin = rootGetters['auth/isAdmin']
    const token = rootGetters['auth/token']
    if (!isAdmin) {
      return commit(
        'setSnackbar',
        {
          message: 'This action is only available to administrator',
          duration: 7000
        },
        { root: true }
      )
    }
    commit(
      'setSnackbar',
      {
        message: 'Preparing to publish your schema',
        duration: 7000
      },
      { root: true }
    )
    try {
      await dispatch('fetchJsonSchema')
      const xsd = rootGetters['portal/xsd']
      const nanopub = await publishXSD(xsd, token)
      if (nanopub) {
        return commit(
          'setSnackbar',
          {
            message: 'Your schema has been published successfully',
            duration: 7000
          },
          { root: true }
        )
      }
    } catch (error) {
      return commit(
        'setSnackbar',
        {
          message: 'There is an error during publishing',
          action: () => dispatch('publishSchema')
        },
        { root: true }
      )
    }
  }
}
