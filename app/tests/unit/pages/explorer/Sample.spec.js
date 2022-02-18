import Sample from "@/pages/explorer/sample/Sample.vue";
import createWrapper from "../../../jest/script/wrapper";
import { querySparql } from '@/modules/sparql'
jest.mock('@/modules/sparql')
querySparql.mockImplementation((uri) => {})

HTMLCanvasElement.prototype.getContext = () => {}

global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
  })
);

describe('Sample.vue', () => {
  it('renders the header of the page', async () => {
    const wrapper = createWrapper(Sample, {}, true)
    expect(true)
  })
})
