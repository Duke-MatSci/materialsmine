import createWrapper from '../../../jest/script/wrapper'
import { articles, samples, charts, images, materials } from '../../../jest/__mocks__/searchMock'
import SearchResultsTable from '@/components/explorer/SearchResultsTable.vue'
import spinner from '@/components/spinner'

let wrapper = null

describe('SearchResultsTable.vue', () => {
  /*
  Todo: Monitor changes here - https://github.com/vuejs/vue-test-utils/issues/55#issuecomment-381782711
  */
  beforeEach(async () => {
    wrapper = await createWrapper(SearchResultsTable, { })
  })

  afterEach(() => {
    wrapper.destroy()
  })

  it('Renders Spinner component correctly', async () => {
    expect.assertions(2)
    await wrapper.vm.$store.commit('explorer/results/setIsLoading', true)
    wrapper.vm.$nextTick()
    expect(wrapper.vm.getIsloading).toBe(true)
    expect(wrapper.findComponent(spinner).exists()).toBe(true)
  })

  it('Renders Articles tab elements Correctly', async () => {
    expect.assertions(7)
    await wrapper.vm.$store.commit('explorer/results/setIsLoading', false)
    await wrapper.vm.$store.commit('explorer/setResultsTab', 'getArticles')
    await wrapper.vm.$store.commit('explorer/results/setArticles', articles)
    wrapper.vm.$nextTick()
    expect(wrapper.findComponent('.explorer_page-results').exists()).toBe(true)
    // Todo: Can only use findAll for now. findAllComponents fail at the moment
    expect(wrapper.findAll('.results_card').length).toEqual(articles.length)
    expect(wrapper.findComponent({ ref: 'articles_ref' }).exists()).toBe(true)
    expect(wrapper.findComponent({ ref: 'samples_ref' }).exists()).toBe(false)
    expect(wrapper.findComponent({ ref: 'charts_ref' }).exists()).toBe(false)
    expect(wrapper.findComponent({ ref: 'images_ref' }).exists()).toBe(false)
    expect(wrapper.findComponent({ ref: 'materials_ref' }).exists()).toBe(false)
  })

  it('Renders Sample tab elements Correctly', async () => {
    expect.assertions(6)
    await wrapper.vm.$store.commit('explorer/results/setIsLoading', false)
    await wrapper.vm.$store.commit('explorer/setResultsTab', 'getSamples')
    await wrapper.vm.$store.commit('explorer/results/setSamples', samples)
    wrapper.vm.$nextTick()
    expect(wrapper.findComponent({ ref: 'articles_ref' }).exists()).toBe(false)
    expect(wrapper.findComponent({ ref: 'samples_ref' }).exists()).toBe(true)
    expect(wrapper.findComponent({ ref: 'charts_ref' }).exists()).toBe(false)
    expect(wrapper.findComponent({ ref: 'images_ref' }).exists()).toBe(false)
    expect(wrapper.findComponent({ ref: 'materials_ref' }).exists()).toBe(false)
    expect(wrapper.findAll({ ref: 'sample_ref' }).length).toEqual(samples.length)
  })

  it('Renders Charts tab elements Correctly', async () => {
    expect.assertions(6)
    await wrapper.vm.$store.commit('explorer/results/setIsLoading', false)
    await wrapper.vm.$store.commit('explorer/setResultsTab', 'getCharts')
    await wrapper.vm.$store.commit('explorer/results/setCharts', charts)
    wrapper.vm.$nextTick()
    expect(wrapper.findComponent({ ref: 'articles_ref' }).exists()).toBe(false)
    expect(wrapper.findComponent({ ref: 'samples_ref' }).exists()).toBe(false)
    expect(wrapper.findComponent({ ref: 'charts_ref' }).exists()).toBe(true)
    expect(wrapper.findComponent({ ref: 'images_ref' }).exists()).toBe(false)
    expect(wrapper.findComponent({ ref: 'materials_ref' }).exists()).toBe(false)
    expect(wrapper.findAll('.results_card').length).toEqual(charts.length)
  })

  it('Renders Images tab elements Correctly', async () => {
    expect.assertions(6)
    await wrapper.vm.$store.commit('explorer/results/setIsLoading', false)
    await wrapper.vm.$store.commit('explorer/setResultsTab', 'getImages')
    await wrapper.vm.$store.commit('explorer/results/setImages', images)
    wrapper.vm.$nextTick()
    expect(wrapper.findComponent({ ref: 'articles_ref' }).exists()).toBe(false)
    expect(wrapper.findComponent({ ref: 'samples_ref' }).exists()).toBe(false)
    expect(wrapper.findComponent({ ref: 'charts_ref' }).exists()).toBe(false)
    expect(wrapper.findComponent({ ref: 'images_ref' }).exists()).toBe(true)
    expect(wrapper.findComponent({ ref: 'materials_ref' }).exists()).toBe(false)
    expect(wrapper.findAll('.results_card').length).toEqual(images.length)
  })

  it('Renders Materials tab elements Correctly', async () => {
    expect.assertions(6)
    await wrapper.vm.$store.commit('explorer/results/setIsLoading', false)
    await wrapper.vm.$store.commit('explorer/setResultsTab', 'getMaterials')
    await wrapper.vm.$store.commit('explorer/results/setMaterials', materials)
    wrapper.vm.$nextTick()
    expect(wrapper.findComponent({ ref: 'articles_ref' }).exists()).toBe(false)
    expect(wrapper.findComponent({ ref: 'samples_ref' }).exists()).toBe(false)
    expect(wrapper.findComponent({ ref: 'charts_ref' }).exists()).toBe(false)
    expect(wrapper.findComponent({ ref: 'images_ref' }).exists()).toBe(false)
    expect(wrapper.findComponent({ ref: 'materials_ref' }).exists()).toBe(true)
    expect(wrapper.findAll('.results_card').length).toEqual(materials.length)
  })
})
