import sigFigs from './sigFigs';

interface RawData {
  dataset_name: string;
  dataset_color: string;
  C11: string;
  C12: string;
  C22: string;
  C16: string;
  C26: string;
  C66: string;
  condition: string;
  symmetry: string;
  CM0: string;
  CM1: string;
  CM0_E: string;
  CM0_nu: string;
  CM1_E: string;
  CM1_nu: string;
  geometry_full: string;
  youngs?: string;
  poisson?: string;
}

interface ProcessedData {
  index: number;
  name: string;
  color: string;
  C11: number;
  C12: number;
  C22: number;
  C16: number;
  C26: number;
  C66: number;
  condition: string;
  symmetry: string;
  CM0: string;
  CM1: string;
  CM0_E: string;
  CM0_nu: string;
  CM1_E: string;
  CM1_nu: string;
  geometry: string;
  youngs: number[] | undefined;
  poisson: number[] | undefined;
  "Minimal directional Young's modulus [N/m]": number;
  "Maximal directional Young's modulus [N/m]": number;
  "Minimal Poisson's ratio [-]": number;
  "Maximal Poisson's ratio [-]": number;
}

const regex = /[-+]?[0-9]*\.?[0-9]+([eE]?[-+]?[0-9]+)/g;

/**
 * Processes raw data into a structured format with calculated properties
 * @param d - Raw data object
 * @param i - Index of the data item
 * @returns Processed data object
 */
export const processData = (d: RawData, i: number): ProcessedData => {
  const youngs = d.youngs?.match(regex)?.map(parseFloat);
  const poisson = d.poisson?.match(regex)?.map(parseFloat);

  const processed: ProcessedData = {
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
    "Maximal Poisson's ratio [-]": Math.max(...(poisson ?? [])),
  };
  return processed;
};

export type { RawData, ProcessedData };
