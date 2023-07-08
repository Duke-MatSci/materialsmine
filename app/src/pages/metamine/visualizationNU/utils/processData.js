import sigFigs from './sigFigs'
const regex = /[-+]?[0-9]*\.?[0-9]+([eE]?[-+]?[0-9]+)/g

export const processData = (d, i) => {
  const youngs = d.youngs?.match(regex).map(parseFloat)
  const poisson = d.poisson?.match(regex).map(parseFloat)
  const processed = {
    index: i,
    name: d.dataset_name,
    color: d.dataset_color,
    C11: sigFigs(parseFloat(d.C11), 4),
    C12: sigFigs(parseFloat(d.C12), 4),
    C22: sigFigs(parseFloat(d.C22), 4),
    C16: sigFigs(parseFloat(d.C16), 4),
    C26: sigFigs(parseFloat(d.C26), 4),
    C66: sigFigs(parseFloat(d.C66), 4),
    condition: d.condition,
    symmetry: d.symmetry,
    CM0: d.CM0,
    CM1: d.CM1,
    CM0_E: d.CM0_E,
    CM0_nu: d.CM0_nu,
    CM1_E: d.CM1_E,
    CM1_nu: d.CM1_nu,
    geometry: d.geometry_full,
    youngs: youngs,
    poisson: poisson,
    "Minimal directional Young's modulus [N/m]": Math.min(...(youngs ?? [])),
    "Maximal directional Young's modulus [N/m]": Math.max(...(youngs ?? [])),
    "Minimal Poisson's ratio [-]": Math.min(...(poisson ?? [])),
    "Maximal Poisson's ratio [-]": Math.max(...(poisson ?? []))
  }
  return processed
}
