import { GetterTree } from 'vuex';
import { ReferenceContainerState } from './index';

const getters: GetterTree<ReferenceContainerState, any> = {
  getReferenceById: (state: ReferenceContainerState) => (id: string) => {
    return state.references[id];
  },
};

export default getters;
