
import createWrapper from '../../../jest/script/wrapper'
import { enableAutoDestroy } from '@vue/test-utils'
import ParameterizedQueryPage from '@/pages/explorer/parameterized-query/parameterized-query-page.vue'

import { querySparql } from '@/modules/sparql'
jest.mock('@/modules/sparql')
querySparql.mockImplementation((uri) => {})

describe('parameterized-query-page.vue', () => {
  let wrapper
  beforeEach(() => {
    wrapper = createWrapper(ParameterizedQueryPage, {}, true)
  })

  enableAutoDestroy(afterEach)

  it('renders', () => {
    expect(wrapper.find('.sparql-template-page').exists()).toBe(true)
  })
})
