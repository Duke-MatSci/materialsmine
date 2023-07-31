import createWrapper from '../../../jest/script/wrapper';
import { enableAutoDestroy, mount } from '@vue/test-utils';
import DataSelector from '@/pages/metamine/visualizationNU/components/DataSelector.vue';
import Vuex from 'vuex'
import VueMaterial from 'vue-material'
import { shallowMount, createLocalVue } from '@vue/test-utils'
import { mockDataPoint } from './constants';

const localVue = createLocalVue()
localVue.use(Vuex)
localVue.use(VueMaterial)

const fetchedNamesSample = [
    {
        name: '1',
        color: 'red'
    },
    {
        name: '2',
        color: 'yellow'
    }
];

describe('DataSelector', () => {
    let wrapper;
    beforeEach(async () => {
        wrapper = await createWrapper(DataSelector, {}, true);
    });

    enableAutoDestroy(afterEach);

    afterEach(async () => {
        wrapper.destroy();
    });

    it('mounts properly ', () => {
        expect(wrapper.exists()).toBe(true);
    });

    it('renders layout', async () => {
        expect(
            wrapper.find('div.data-selector-wrapper > .data-row').exists()
        ).toBe(true);
        expect(wrapper.find('table').exists()).toBe(true);
    });
    it('renders data returned from mapState', () => {
      const wrapper = mount(DataSelector, {
        computed: {
          fetchedNames: () => fetchedNamesSample, 
          query1: () => 'C11',
          query2: () => 'C12', 
          activeData: () => [mockDataPoint], 
          dataLibrary: () => [], 
          page: () => 'pairwise-plot'
        }, 
        localVue
      });

      expect(wrapper.vm.fetchedNames).toEqual(fetchedNamesSample);
      expect(wrapper.vm.query1).toEqual('C11');
      expect(wrapper.vm.query2).toEqual('C12');
      expect(wrapper.findAllComponents('tr').length).toEqual(2);
    })
});
