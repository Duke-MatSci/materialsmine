import createWrapper from '../../../jest/script/wrapper';
import { enableAutoDestroy } from '@vue/test-utils';
import Youngs from '@/pages/metamine/visualizationNU/components/youngs.vue';

describe('Metamine Youngs component', () => {
    let wrapper;
    beforeEach(() => {
        wrapper = createWrapper(Youngs, {}, true);
    });
    enableAutoDestroy(afterEach);

    it('mount component correctly', () => {
        const plot = wrapper.findComponent('.js-plotly-plot');
        expect(plot.exists()).toBe(true);
    });
});
