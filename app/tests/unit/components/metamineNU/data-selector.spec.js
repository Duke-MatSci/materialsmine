import createWrapper from '../../../jest/script/wrapper';
import { enableAutoDestroy } from '@vue/test-utils';
import DataSelector from '@/components/metamine/visualizationNU/DataSelector.vue';
import { mockDataPoint } from './constants';

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
    await jest.resetAllMocks();
    wrapper.destroy();
  });

  it('mounts properly ', () => {
    expect(wrapper.exists()).toBe(true);
  });

  it('renders layout', async () => {
    expect(wrapper.find('div.data-selector-wrapper > .data-row').exists()).toBe(
      true
    );
    expect(wrapper.find('table').exists()).toBe(true);
  });

  it('renders empty state if fetchedNames is empty', async () => {
    await wrapper.vm.$store.commit('metamineNU/setFetchedNames', []);
    expect(wrapper.find('table').exists()).toBe(true);
    expect(wrapper.find('table').text()).toBe('No data available');
  });

  it('renders data returned from mapState', async () => {
    await wrapper.vm.$store.commit(
      'metamineNU/setFetchedNames',
      fetchedNamesSample
    );
    await wrapper.vm.$store.commit('metamineNU/setActiveData', [mockDataPoint]);
    await wrapper.vm.$store.commit('metamineNU/setDataLibrary', []);
    await wrapper.vm.$store.commit('metamineNU/setPage', 'pairwise-plot');
    expect(wrapper.vm.fetchedNames).toEqual(fetchedNamesSample);
    expect(wrapper.findAllComponents('tr').length).toEqual(2);
  });

  it('onSelect Method mutates the expected data', async () => {
    await wrapper.vm.$store.commit(
      'metamineNU/setFetchedNames',
      fetchedNamesSample
    );
    await wrapper.vm.$store.commit('metamineNU/setQuery1', 'C11');
    await wrapper.vm.$store.commit('metamineNU/setQuery2', 'C12');
    await wrapper.vm.$store.commit('metamineNU/setActiveData', []);
    await wrapper.vm.$store.commit('metamineNU/setDataLibrary', []);
    await wrapper.vm.$store.commit('metamineNU/setPage', 'pairwise-plot');
    const storeSpy = jest.spyOn(wrapper.vm.$store, 'commit');
    await wrapper.vm.onSelect([fetchedNamesSample[0]]);
    expect(storeSpy).toHaveBeenCalledTimes(4);
  });

  it('renders file upload', () => {
    expect(wrapper.findAll('label').at(1).attributes('for')).toBe(
      'Viscoelastic_Data'
    );
    expect(wrapper.find('div.form__file-input ').exists()).toBe(true);
    expect(wrapper.find('div.md-theme-default ').exists()).toBe(true);
    expect(wrapper.find('div.md-file > input').exists()).toBe(true);
    expect(wrapper.find('label.btn').exists()).toBe(true);
    expect(wrapper.find('span.md-caption').exists()).toBe(false);
  });

  it('only accepts tsv or csv file', () => {
    const container = wrapper.find(
      'label > .form__file-input > .md-theme-default'
    );

    const input = container.find('div.md-file > input');
    const btn = container.find('label');
    expect(container.exists()).toBe(true);
    expect(btn.attributes('class')).toBe(
      'md-button btn btn--primary u_color_white u--shadow-none'
    );
    expect(btn.attributes('for')).toBe('Viscoelastic_Data');
    expect(btn.find('p').text()).toBe('Upload file');
    expect(input.attributes('accept')).toBe('.csv, .tsv, .txt');
    expect(input.attributes('type')).toBe('file');
  });
});
