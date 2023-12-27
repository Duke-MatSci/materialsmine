import { organizeByName } from '../../../../src/modules/metamine/utils/organizeByName'

const datasetSample = [
  {
    name: 'test',
    color: 'red',
    C11: parseFloat('12'),
    C12: parseFloat('10.33')
  },
  {
    name: 'sample',
    color: 'yellow',
    C11: parseFloat('12'),
    C12: parseFloat('10.33')
  },
  {
    name: 'test',
    color: 'orange',
    C11: parseFloat('12'),
    C12: parseFloat('10.33')
  },
  {
    name: 'sample',
    color: 'green',
    C11: parseFloat('12'),
    C12: parseFloat('10.33')
  },
  {
    name: 'test',
    color: 'blue',
    C11: parseFloat('12'),
    C12: parseFloat('10.33')
  }
]
const organizedDataset = [
  {
    name: 'test',
    color: 'red',
    data: [datasetSample[0], datasetSample[2], datasetSample[4]]
  },
  {
    name: 'sample',
    color: 'yellow',
    data: [datasetSample[1], datasetSample[3]]
  }
]

describe('articleMetadata.js', () => {
  it('organizeByName organizes data by name  and returns an array of object ', () => {
    const result = organizeByName(datasetSample)
    expect(result).toEqual(organizedDataset)
  })
})
