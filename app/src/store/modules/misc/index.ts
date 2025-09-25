import mutations from './mutations';
import actions from './actions';
import getters from './getters';

export default {
  // namespaced: true,
  state(): any {
    return {
      appHeaderInfo: {
        icon: '',
        pagetype: 'home',
        name: 'MaterialsMine',
        subtitle:
          'An open source repository for nanocomposite data (NanoMine), and mechanical metamaterials data (MetaMine)',
      },
      dialogBox: false,
      snackbar: {
        message: '',
        action: null,
        duration: false,
        callToActionText: 'Retry',
      },
      countDownDate: new Date('March 22, 2023 13:30:00').getTime(),
      uploadedFile: null,
      routeInfo: {},
    };
  },
  mutations,
  actions,
  getters,
};
