import debounce from '@/modules/debounce';

const deploymentTypes = {
  general: {
    deployUrl: '/api/admin/deployment/general',
    statusUrl: '/api/admin/deployment/status/general'
  },
  ontology: {
    deployUrl: '/api/admin/deployment/ontology',
    statusUrl: '/api/admin/deployment/status/ontology'
  }
};

// Helper function to handle errors
function handleError({ commit, getters }) {
  if (getters.isError === false) {
    commit('setError', true);
  }
  commit('setDialogBox', true, { root: true });
}

export default {
  async fetchVersions(context) {
    const token = context.rootGetters['auth/token'];
    try {
      const response = await fetch('/api/admin/deployment/tags', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token
        }
      });
      if (
        !response ||
        response.statusText !== 'OK' ||
        response.status !== 200
      ) {
        const error = new Error();
        context.commit(
          'setSnackbar',
          {
            message: 'Failed to get tags!',
            action: () => context.dispatch('fetchVersions')
          },
          { root: true }
        );
        throw error;
      }
      const responseData = await response.json();
      context.commit('setDockerVersions', responseData);
    } catch (error) {
      return;
    }
  },

  async deploy({ commit, rootGetters, getters, dispatch }, type) {
    commit('setDialogBox', false, { root: true });
    commit('setLoadingMessage', {
      message: 'Please wait...'
    });
    commit('setLoading', true);
    const versionData = {
      version: getters.currentVersion
    };
    const token = rootGetters['auth/token'];

    try {
      const response = await fetch(deploymentTypes[type].deployUrl, {
        method: 'POST',
        body: JSON.stringify(versionData),
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token
        }
      });

      if (!response || !response.ok || response.status !== 200) {
        const error = new Error(response?.message || 'Something went wrong!');
        throw error;
      }

      const responseData = await response.json();
      if (responseData.status === 'ACCEPTED') {
        commit('setLoadingMessage', {
          message: responseData.message
        });
        debounce(() => dispatch(`deploymentStatus`, type), 50000)();
      }
    } catch (error) {
      commit('setLoading', false);
      handleError({ commit, getters }); // this sets error to true in the store and opens up the dialogue box, allowing the user to see the message
    }
  },

  async deploymentStatus({ commit, dispatch, rootGetters, getters }, type) {
    const token = rootGetters['auth/token'];
    try {
      const response = await fetch(deploymentTypes[type].statusUrl, {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + token
        }
      });
      if (
        !response ||
        response.statusText !== 'OK' ||
        response.status !== 200
      ) {
        const error = new Error(response?.message || 'Something went wrong!');
        throw error;
      }
      const responseData = await response.json();
      const { status } = responseData;

      if (status === 'STILL PROCESSING' || status === 'STARTING') {
        debounce(() => dispatch('deploymentStatus', type), 50000)();
      } else {
        commit('setLoading', false);
        commit('setDialogBox', true, { root: true });

        if (status === 'DONE') {
          commit('setSuccess', true);
        } else if (status === 'FAILED') {
          commit('setError', true);
        }
      }
    } catch (error) {
      commit('setLoading', false);
      handleError({ commit, getters }); // this sets error to true in the store and opens up the dialogue box, allowing the user to see the message
    }
  }
};
