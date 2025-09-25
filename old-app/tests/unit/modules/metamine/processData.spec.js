import { processData } from '../../../../src/modules/metamine/utils/processData'

const index = 0
const dataset = {
  youngs: '2e10,0.55,13',
  poisson: '-2e10,0.55,13',
  dataset_name: process.env?.MM_USER ?? 'Frontend',
  dataset_color: 'Blue',
  C11: '10.33',
  C12: '10.33',
  C22: '10.33',
  C16: '10.33',
  C26: '10.33',
  C66: '10.33',
  condition: 'stable',
  symmetry: 'curve',
  CM0: 'random strings',
  CM1: 'random strings',
  CM0_E: 'random strings',
  CM0_nu: 'random strings',
  CM1_E: 'random strings',
  CM1_nu: 'random strings',
  geometry_full: 'random strings'
}
const youngs = [20000000000, 0.55, 13]
const poisson = [-20000000000, 0.55, 13]

const result = {
  index: index,
  name: dataset.dataset_name,
  color: dataset.dataset_color,
  C11: parseFloat(dataset.C11),
  C12: parseFloat(dataset.C12),
  C22: parseFloat(dataset.C22),
  C16: parseFloat(dataset.C16),
  C26: parseFloat(dataset.C26),
  C66: parseFloat(dataset.C66),
  condition: dataset.condition,
  symmetry: dataset.symmetry,
  CM0: dataset.CM0,
  CM1: dataset.CM1,
  CM0_E: dataset.CM0_E,
  CM0_nu: dataset.CM0_nu,
  CM1_E: dataset.CM1_E,
  CM1_nu: dataset.CM1_nu,
  geometry: dataset.geometry_full,
  youngs: youngs,
  poisson: poisson,
  "Minimal directional Young's modulus [N/m]": Math.min(...(youngs || [])),
  "Maximal directional Young's modulus [N/m]": Math.max(...(youngs || [])),
  "Minimal Poisson's ratio [-]": Math.min(...(poisson || [])),
  "Maximal Poisson's ratio [-]": Math.max(...(poisson || []))
}

describe('processData function', () => {
  it('returns a processed dataset', () => {
    expect(processData(dataset, index)).toEqual(result)
  })
})
