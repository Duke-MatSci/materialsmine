import createWrapper from '../../../jest/script/wrapper'
import { enableAutoDestroy } from '@vue/test-utils'
import Dataset from '@/pages/explorer/curate/edit/Dataset.vue'

const apollo = {
  getFilesets: {
    filesets: [
      {
        filesetName: 'L325_S1_Test_2015',
        files: [
          {
            id: 'test_file1.xlsx',
            filename: 'test_file1.xlsx',
            contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
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
            id: 'test_file1.xlsx',
            filename: 'test_file1.xlsx',
            contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          },
          {
            id: 'test_file2.csv',
            filename: 'test_file2.csv',
            contentType: 'text/csv'
          }
        ]
      }
    ],
    totalItems: 2,
    pageSize: 20,
    pageNumber: 1,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false
  },
  verifyUser: {
    isAuth: true
  }
}

describe('Dataset.vue', () => {
  const defaultProps = {
    id: '123456789'
  }

  let wrapper
  beforeEach(async () => {
    wrapper = await createWrapper(Dataset, {
      props: defaultProps,
      mocks: {
        $apollo: {
          loading: false
        }
      }
    }, true)
    await wrapper.setData({ getFilesets: apollo.getFilesets, verifyUser: apollo.verifyUser })
  })

  enableAutoDestroy(afterEach)

  it('displays the current dataset ID', () => {
    expect.assertions(1)
    expect(wrapper.text()).toContain(defaultProps.id)
  })

  it('renders labeled cards for all of the filesets', () => {
    expect.assertions(3)
    const filesetCards = wrapper.findAll('.md-card')
    expect(filesetCards.length).toBe(2)
    expect(filesetCards.at(0).text()).toContain(apollo.getFilesets.filesets[0].filesetName)
    expect(filesetCards.at(1).text()).toContain(apollo.getFilesets.filesets[1].filesetName)
  })

  it('displays labeled icons for files in fileset', () => {
    expect.assertions(2)
    const filesetCard = wrapper.findAll('.md-card').at(0)
    const fileIcons = filesetCard.findAll('.md-icon')
    expect(fileIcons.length).toBe(2)
    expect(filesetCard.text()).toContain('test_file1.xlsx')
  })
})
