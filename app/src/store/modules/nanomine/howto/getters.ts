import { GetterTree } from 'vuex';
import { HowtoState } from './index';

const getters: GetterTree<HowtoState, any> = {
  videos(state: HowtoState) {
    return state.videos;
  },
};

export default getters;
