import createWrapper from '../../../jest/script/wrapper'
import { enableAutoDestroy } from '@vue/test-utils'
import TableComponent from '@/components/explorer/TableComponent.vue'

describe('TableComponent.vue', () => {
  enableAutoDestroy(afterEach)

  describe('TableComponent without data', () => {
    let wrapper
    beforeEach(() => {
      jest.resetAllMocks()

      wrapper = createWrapper(TableComponent, {}, false)
    })

    it('displays empty state if no data prop given', () => {
      expect(wrapper.find('section.u_width--max').exists()).toBe(true)
      expect(wrapper.find('md-table-stub').exists()).toBe(true)
      expect(wrapper.find('md-table-empty-state-stub').exists()).toBe(true)
      expect(
        wrapper.find('md-table-empty-state-stub').attributes('mddescription')
      ).toBe(wrapper.vm.emptyState)
      expect(wrapper.find('pagination-stub').exists()).toBe(false)
    })
  })

  describe('TableComponent with data less than default page size', () => {
    let wrapper
    beforeEach(() => {
      jest.resetAllMocks()

      wrapper = createWrapper(
        TableComponent,
        {
          props: {
            tableData: data,
            sortBy: 'Frequency'
          },
          stubs: {
            Pagination: {
              template: '<pagination-stub><slot/></pagination-stub>'
            }
          }
        },
        true
      )
    })

    it('does not display empty state if tabledata exists', () => {
      expect(wrapper.find('section.u_width--max').exists()).toBe(true)
      expect(wrapper.find('.md-table').exists()).toBe(true)
      expect(wrapper.find('.md-table-empty-state').exists()).toBe(false)
    })

    it('does not display pagination if data less than pageSize', () => {
      expect(wrapper.vm.tableData.length < wrapper.vm.pageSize).toBe(true)
      expect(wrapper.vm.totalPages).toBe(1)
      expect(wrapper.find('pagination-stub').exists()).toBe(false)
    })

    it('displays rows based on data given without paginating', () => {
      expect.assertions(10)
      const tableRow = wrapper.findAll('.md-table-row')
      expect(tableRow.length).toBe(wrapper.vm.tableData.length)
      for (let i = 0; i < tableRow.length; i++) {
        const cell = tableRow.at(i).findAll('.md-table-cell')
        for (let j = 0; j < cell.length; j++) {
          expect(cell.at(j).text()).toMatch(
            `${Object.values(wrapper.vm.tableData[i])[j]}`
          )
        }
      }
    })
  })

  describe('TableComponent with data greater than default page size', () => {
    let wrapper
    beforeEach(() => {
      jest.resetAllMocks()

      wrapper = createWrapper(
        TableComponent,
        {
          props: {
            tableData: data,
            sortBy: 'Frequency',
            pageSize: 2
          },
          stubs: {
            Pagination: {
              template: '<pagination-stub><slot/></pagination-stub>'
            }
          }
        },
        true
      )
    })

    it('display pagination if data less than pageSize', () => {
      expect(wrapper.vm.tableData.length > wrapper.vm.pageSize).toBe(true)
      expect(wrapper.vm.totalPages).toBe(2)
      expect(wrapper.find('pagination-stub').exists()).toBe(true)
    })

    it('displays rows based on data given without paginating', () => {
      expect.assertions(7)
      const tableRow = wrapper.findAll('.md-table-row')
      expect(tableRow.length).toBe(2)
      for (let i = 0; i < tableRow.length; i++) {
        const cell = tableRow.at(i).findAll('.md-table-cell')
        for (let j = 0; j < cell.length; j++) {
          expect(cell.at(j).text()).toMatch(
            `${Object.values(wrapper.vm.paginatedData[i])[j]}`
          )
        }
      }
    })
  })
})

const data = [
  {
    'E Loss': 315.0,
    'E Storage': 3600.0,
    Frequency: 800000000000.0
  },
  {
    'E Loss': 316.0,
    'E Storage': 3600.0,
    Frequency: 635460000000.0
  },
  {
    'E Loss': 321.0,
    'E Storage': 3600.0,
    Frequency: 504770000000.0
  }
]
