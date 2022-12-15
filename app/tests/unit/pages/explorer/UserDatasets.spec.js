import createWrapper from '../../../jest/script/wrapper'
import { enableAutoDestroy } from '@vue/test-utils'
import UserDatasets from '@/pages/explorer/curate/edit/UserDatasets.vue'

const apollo = {
  getUserDataset: {
    totalItems: 2,
    pageSize: 10,
    pageNumber: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
    datasets: [
      {
        datasetGroupId: '5e96fa91c9db0157d0737e39',
        status: 'APPROVED',
        title: null,
        filesetInfo: [
          {
            filesetName: 'L325_S1_Test_2015',
            files: [
              {
                id: 'test_file1.png',
                filename: 'test_file1.png',
                contentType: 'image/png'
              },
              {
                id: 'test_file2.csv',
                filename: 'test_file2.csv',
                contentType: 'text/csv'
              }
            ]
          },
          {
            filesetName: 'L325_S2_Test_2015',
            files: [
              {
                id: 'test_file1.png',
                filename: 'test_file1.png',
                contentType: 'image/png'
              }
            ]
          }
        ]
      },
      {
        datasetGroupId: '5e96fae7c9db0157d0737e3a',
        title: null,
        filesetInfo: [{
          filesetName: 'L325_S3_Test_2015',
          files: [
            {
              id: '5b59f276e74a1d4cdbaed0a7',
              filename: '1.png',
              contentType: 'image/png'
            }
          ]
        }]
      }
    ]
  },
  verifyUser: {
    isAuth: true,
    user: {
      username: 'Test User'
    }
  }
}

describe('UserDatasets.vue', () => {
  let wrapper
  beforeEach(async () => {
    wrapper = await createWrapper(UserDatasets, {
      mocks: {
        $apollo: {
          loading: false
        }
      }
    }, true)
    await wrapper.setData({ getUserDataset: apollo.getUserDataset, verifyUser: apollo.verifyUser })
  })

  enableAutoDestroy(afterEach)

  it('displays the name of current user', () => {
    expect.assertions(1)
    expect(wrapper.text()).toContain('Test User')
  })

  it('renders labeled cards for all of the datasets', () => {
    expect.assertions(3)
    const filesetCards = wrapper.findAll('.md-card')
    expect(filesetCards.length).toBe(2)
    expect(filesetCards.at(0).text()).toContain(apollo.getUserDataset.datasets[0].datasetGroupId)
    expect(filesetCards.at(1).text()).toContain(apollo.getUserDataset.datasets[1].datasetGroupId)
  })

  it('displays labeled icons for filesets in a dataset', () => {
    expect.assertions(2)
    const datasetCard = wrapper.findAll('.md-card').at(0)
    const datasetIcons = datasetCard.find('.md-card-content').findAll('.md-icon')
    expect(datasetIcons.length).toBe(2)
    expect(datasetCard.text()).toContain('L325_S')
  })
})
