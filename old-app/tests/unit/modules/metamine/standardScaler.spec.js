import { StandardScaler } from '../../../../src/modules/metamine/utils/standardScaler'

const sampleArr = [0, 0, 0, 0, 0, 0]
const sampleData = [[1, 2, 3, 4, 5, 6], [2, 3, 4, 5, 6, 1], [3, 4, 5, 6, 1, 2], [4, 5, 6, 1, 2, 3], [5, 6, 1, 2, 3, 4], [6, 1, 2, 3, 4, 5]]
const mean = [3.5, 3.5, 3.5, 3.5, 3.5, 3.5]
const std = [
  1.707825127659933,
  1.707825127659933,
  1.707825127659933,
  1.707825127659933,
  1.707825127659933,
  1.707825127659933
]

const scaledResult1 = [
  new Array(sampleArr.length).fill(0),
  new Array(sampleArr.length).fill(0),
  new Array(sampleArr.length).fill(0),
  new Array(sampleArr.length).fill(0),
  new Array(sampleArr.length).fill(0),
  new Array(sampleArr.length).fill(0)
]

const scaledResult2 = [
  [-1.4638501094227998, -0.8783100656536799, -0.29277002188455997, 0.29277002188455997, 0.8783100656536799, 1.4638501094227998],
  [-0.8783100656536799, -0.29277002188455997, 0.29277002188455997, 0.8783100656536799, 1.4638501094227998, -1.4638501094227998],
  [-0.29277002188455997, 0.29277002188455997, 0.8783100656536799, 1.4638501094227998, -1.4638501094227998, -0.8783100656536799],
  [0.29277002188455997, 0.8783100656536799, 1.4638501094227998, -1.4638501094227998, -0.8783100656536799, -0.29277002188455997],
  [0.8783100656536799, 1.4638501094227998, -1.4638501094227998, -0.8783100656536799, -0.29277002188455997, 0.29277002188455997],
  [1.4638501094227998, -1.4638501094227998, -0.8783100656536799, -0.29277002188455997, 0.29277002188455997, 0.8783100656536799]
]

describe('processData function', () => {
  let standardScaler
  beforeEach(async () => {
    standardScaler = new StandardScaler()
  })

  it('has the right properties', () => {
    expect(JSON.stringify(standardScaler.means)).toEqual(JSON.stringify(sampleArr))
    expect(JSON.stringify(standardScaler.stds)).toEqual(JSON.stringify(sampleArr))
  })

  it('fit data calculated the mean and standard deviation of each row', async () => {
    await standardScaler.fit(sampleData)
    for (let i = 0; i < standardScaler.means.length; i++) {
      expect(standardScaler.means[i]).toEqual(mean[i])
      expect(standardScaler.stds[i]).toEqual(std[i])
    }
  })

  it('transform method returns a scaled data based on means and stds', async () => {
    // when means and standard deviations of the rows are 0
    expect(JSON.stringify(standardScaler.means)).toEqual(JSON.stringify(sampleArr))
    expect(JSON.stringify(standardScaler.stds)).toEqual(JSON.stringify(sampleArr))

    let result = await standardScaler.transform(sampleData)
    expect(JSON.stringify(result)).toEqual(JSON.stringify(scaledResult1))

    // when means and standard deviations of the rows are calculated
    standardScaler.means = mean
    standardScaler.stds = std
    result = await standardScaler.transform(sampleData)
    expect(JSON.stringify(standardScaler.means)).not.toEqual(JSON.stringify(sampleArr))
    expect(JSON.stringify(standardScaler.stds)).not.toEqual(JSON.stringify(sampleArr))
    expect(JSON.stringify(result)).toEqual(JSON.stringify(scaledResult2))
  })

  it('fitTransform calls fit data and transform data methods respectively', async () => {
    const fitSpy = jest.spyOn(standardScaler, 'fit')
    const transformSpy = jest.spyOn(standardScaler, 'fit')
    await standardScaler.fitTransform(sampleData)

    // called with the right arguements
    expect(fitSpy).toHaveBeenCalledWith(sampleData)
    expect(transformSpy).toHaveBeenCalledWith(sampleData)
  })
})
