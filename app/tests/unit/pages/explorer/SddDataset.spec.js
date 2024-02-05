import createWrapper from '../../../jest/script/wrapper'
import Dataset from '@/pages/explorer/dataset/Dataset.vue'
import store from '@/store/index.js'
import { parseFileName } from '@/modules/whyis-dataset'

const dispatch = jest.spyOn(store, 'dispatch').mockImplementation(() => {})

const datasetId = '41438e6d-4132-4e5f-bb3b-b8a679d6d16d'

const testDataset = {
  '@id': 'http://localhost/explorer/dataset/41438e6d-4132-4e5f-bb3b-b8a679d6d16d',
  'http://purl.org/dc/terms/creator': [{ '@id': 'https://materialsmine.org/api/user/123' }],
  'http://purl.org/dc/terms/description': [{ '@value': 'A dataset of generated materials' }],
  'http://purl.org/dc/terms/title': [{ '@value': 'Test Dataset' }],
  'http://w3.org/ns/dcat#contactpoint': [{ '@id': 'http://orcid.org/0000-0001-0002-0003' }],
  'http://w3.org/ns/dcat#distribution': [
    { '@id': 'http://materialsmine.org/api/files/fake_file.csv?isStore=true' },
    { '@id': 'http://materialsmine.org/api/files/another_file.txt?isStore=true' }
  ],
  'http://xmlns.com/foaf/0.1/Organization': [{ '@id': 'https://ror.org/05dxps055' }],
  'http://purl.org/dc/terms/isReferencedBy': [{ '@value': 'http://dx.doi.org/10.1016/j.eml.2022.101895' }],
  'http://purl.org/dc/terms/issued': [{ '@type': 'https://www.w3.org/2001/XMLSchema#date', '@value': '2023-06-19' }],
  'http://xmlns.com/foaf/0.1/depiction': [
    { '@id': 'http://localhost/explorer/dataset/41438e6d-4132-4e5f-bb3b-b8a679d6d16d/depiction' }
  ]
}

const testThumbnail = [{ '@value': 'fakeImage.png' }]
const testOrg = [[{
  id: 'https://ror.org/05dxps055',
  name: 'California Institute of Technology'
}]]

describe('Dataset.vue', () => {
  let wrapper
  beforeAll(async () => {
    wrapper = await createWrapper(Dataset, {
      props: {
        id: datasetId
      }
    }, true)
    await wrapper.vm.$store.commit('explorer/setCurrentDataset', testDataset)
    await wrapper.vm.$store.commit('explorer/setCurrentDatasetThumbnail', testThumbnail)
  })

  it('loads page container div', () => {
    expect(wrapper.find('.image-detail-page').exists()).toBe(true)
  })

  it('loads dataset with id from prop', () => {
    expect(dispatch).toHaveBeenCalledWith(
      'explorer/fetchSingleDataset',
      `${window.location.origin}/explorer/dataset/${datasetId}`
    )
  })

  it('loads and call navs', async () => {
    const navBack = jest.spyOn(wrapper.vm, 'navBack').mockImplementation(() => {})
    const handleShare = jest.spyOn(wrapper.vm, 'handleShare').mockImplementation(() => {})
    expect.assertions(3)
    expect(wrapper.find('.utility-roverflow').exists()).toBe(true)
    await wrapper.find('#navbackBtn').trigger('click')
    expect(navBack).toHaveBeenCalled()
    await wrapper.find('#shareChartBtn').trigger('click')
    expect(handleShare).toHaveBeenCalled()
  })

  it('renders dataset title and description', () => {
    const currentImageDiv = wrapper.find('.md-card')
    expect(currentImageDiv.find('.md-title').text()).toContain('Test Dataset')
    expect(currentImageDiv.find('.md-card-header-text').text())
      .toContain('A dataset of generated materials')
  })

  it('routes to article when "view article" is clicked', async () => {
    const viewArticle = wrapper.find('.u--b-rad')
    expect(viewArticle.text()).toContain('10.1016/j.eml.2022.101895')
    await viewArticle.trigger('click')
    expect(wrapper.vm.$route.path).toBe('/explorer/article/10.1016/j.eml.2022.101895')
  })

  it('renders three tabs sections', async () => {
    expect(wrapper.findAll('.u--margin-rightmd').length).toEqual(3)
  })

  it('shows metadata', () => {
    expect(wrapper.find('#metadata').text()).toContain('2023-06-19')
  })

  it('calls ror and renders orgs', async () => {
    await wrapper.setData({ organizations: testOrg })
    expect(dispatch).toHaveBeenCalledWith(
      'explorer/curation/searchRor', { id: '05dxps055' }
    )
    expect(wrapper.find('#metadata').text())
      .toContain('California Institute of Technology')
  })

  it('provides distribution cards with download links', async () => {
    expect.assertions(8)
    const distTab = wrapper.find('#distributions')
    expect(distTab.exists()).toBe(true)
    const dists = distTab.findAll('.md-card')
    expect(dists.length).toBe(2)
    for (let i = 0; i < dists.length; i++) {
      expect(dists.at(i).text()).toContain(
        parseFileName(testDataset['http://w3.org/ns/dcat#distribution'][i]['@id']))
      expect(dists.at(i).find('a').exists()).toBe(true)
      expect(dists.at(i).find('a').attributes('href'))
        .toBe(testDataset['http://w3.org/ns/dcat#distribution'][i]['@id'])
    }
  })

  it('renders thumbnail', async () => {
    expect(dispatch).toHaveBeenCalledWith(
      'explorer/fetchDatasetThumbnail',
      `${window.location.origin}/explorer/dataset/${datasetId}/depiction`
    )
    const image = wrapper.find('img')
    expect(image.exists()).toBeTruthy()
    expect(image.attributes().alt).toBe('Test Dataset image')
    expect(image.attributes().src).toBe('fakeImage.png')
  })

  it('renders error page on empty result', async () => {
    await wrapper.vm.$store.commit('explorer/setCurrentDataset', null)
    expect(wrapper.find('.visualize_header-h1').text()).toBe('Cannot Load Dataset')
  })
})
