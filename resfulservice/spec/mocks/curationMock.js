const sinon = require('sinon');
const jsonStructure = require('../../config/xlsx.json');
const { BaseObjectSubstitutionMap } = require('../../config/constant');

const mockCurationList = [
  {
    field: 'Citation_type',
    values: ['publications', 'lab-generated']
  },
  {
    field: 'Origin',
    values: [
      'experiments',
      'informatics (data science)',
      'simulations',
      'theory'
    ]
  },
  {
    field: 'publication_type',
    values: ['research article', 'conference proceedings', 'communication', 'review', 'letter', 'technical comment']
  }
];

const mockJsonStructure = {
  'Your Name': {
    cellValue: '1. Data Origin|[2,1]',
    type: 'String'
  },
  'Your Email': {
    cellValue: '1. Data Origin|[3,1]',
    type: 'String'
  },
  'Sample ID': {
    cellValue: '1. Data Origin|[4,1]',
    type: 'String'
  },
  'Control sample ID': {
    cellValue: '1. Data Origin|[5,1]',
    type: 'String'
  },
  Origin: {
    cellValue: '1. Data Origin|[6,1]',
    type: 'List',
    validList: 'Origin'
  },
  'Citation Type': {
    cellValue: '1. Data Origin|[7,1]',
    type: 'List',
    validList: 'Citation_type'
  },
  'Publication Type': {
    cellValue: '1. Data Origin|[8,1]',
    type: 'List',
    validList: 'publication_type'
  },
  DOI: {
    cellValue: '1. Data Origin|[10,1]',
    type: 'String'
  },
  Publication: {
    cellValue: '1. Data Origin|[15,1]',
    type: 'String'
  },
  Title: {
    cellValue: '1. Data Origin|[16,1]',
    type: 'String'
  },
  Author: {
    type: 'replace_nested',
    values: [
      {
        Author: {
          cellValue: '1. Data Origin|[17,1]',
          type: 'String',
          required: false
        }
      },
      {
        Author: {
          cellValue: '1. Data Origin|[18,1]',
          type: 'String',
          required: false
        }
      }
    ]
  },
  Keyword: {
    type: 'replace_nested',
    values: [
      {
        Keyword: {
          cellValue: '1. Data Origin|[19,1]',
          type: 'String',
          required: false
        }
      },
      {
        Keyword: {
          cellValue: '1. Data Origin|[20,1]',
          type: 'String',
          required: false
        }
      }
    ]
  },
  'Publication Year': {
    cellValue: '1. Data Origin|[21,1]',
    type: 'String'
  },
  Volume: {
    cellValue: '1. Data Origin|[22,1]',
    type: 'String'
  },
  Issue: {
    cellValue: '1. Data Origin|[23,1]',
    type: 'String'
  },
  URL: {
    cellValue: '1. Data Origin|[24,1]',
    type: 'String'
  },
  Language: {
    cellValue: '1. Data Origin|[25,1]',
    type: 'String'
  },
  Location: {
    cellValue: '1. Data Origin|[26,1]',
    type: 'String'
  },
  'Date of citation': {
    cellValue: '1. Data Origin|[27,1]',
    type: 'String'
  },
  'Laboratory Data Info': {
    'Date of Sample Made': {
      cellValue: '1. Data Origin|[31,1]',
      type: 'String'
    },
    'Date of Data Measurement': {
      cellValue: '1. Data Origin|[32,1]',
      type: 'String'
    },
    'Related DOI': {
      cellValue: '1. Data Origin|[33,1]',
      type: 'String'
    }
  }
};

const mockJsonStructure2 = {
  'DMA Datafile': {
    type: 'multiples',
    values: [
      {
        Description: {
          cellValue: '5.2 Properties-Viscoelastic|[0,1]',
          type: 'String'
        },
        Datafile: {
          cellValue: '5.2 Properties-Viscoelastic|[0,2]',
          type: 'File'
        },
        Note: {
          cellValue: '5.2 Properties-Viscoelastic|[0,3]',
          type: 'String'
        }
      },
      {
        Description: {
          cellValue: '5.2 Properties-Viscoelastic|[1,1]',
          type: 'String'
        },
        Datafile: {
          cellValue: '5.2 Properties-Viscoelastic|[1,2]',
          type: 'File'
        },
        Note: {
          cellValue: '5.2 Properties-Viscoelastic|[1,3]',
          type: 'String'
        }
      }
    ]
  },
  'Master Curve': {
    type: 'multiples',
    values: [
      {
        Description: {
          cellValue: '5.2 Properties-Viscoelastic|[2,1]',
          type: 'String'
        },
        Datafile: {
          cellValue: '5.2 Properties-Viscoelastic|[2,2]',
          type: 'File'
        },
        Note: {
          cellValue: '5.2 Properties-Viscoelastic|[2,3]',
          type: 'String'
        }
      }
    ]
  }
};

const mockJsonStructure4 = {
  Microstructure: {
    Imagefile: {
      type: 'multiples',
      values: [
        {
          'Microstructure filename': {
            'Datafile name.jpg/png/tif/gif': {
              cellValue: '6. Microstructure|[4,1]',
              type: 'File',
              validTypes: ['jpg', 'png', 'gif']
            },
            Note: {
              cellValue: '6. Microstructure|[4,2]',
              type: 'String'
            }
          },
          Description: {
            Datafile: {
              cellValue: '6. Microstructure|[5,1]',
              type: 'String'
            },
            Note: {
              cellValue: '6. Microstructure|[5,2]',
              type: 'String'
            }
          },
          'Microscopy type': {
            Datafile: {
              cellValue: '6. Microstructure|[6,1]',
              type: 'List',
              validList: 'Imagefile::Microscopy_type::Datafile'
            },
            Note: {
              cellValue: '6. Microstructure|[6,2]',
              type: 'String'
            }
          },
          'Image type': {
            Datafile: {
              cellValue: '6. Microstructure|[7,1]',
              type: 'List',
              validList: 'Imagefile::Image_type::Datafile'
            },
            Note: {
              cellValue: '6. Microstructure|[7,2]',
              type: 'String'
            }
          }
        }
      ]
    },
    'Image dimension': {
      Width: {
        'Fixed Value': {
          cellValue: '6. Microstructure|[10,1]',
          type: 'String'
        },
        Unit: {
          cellValue: '6. Microstructure|[10,2]',
          type: 'String',
          default: 'pixel'
        },
        Note: {
          cellValue: '6. Microstructure|[10,3]',
          type: 'String'
        }
      },
      Height: {
        'Fixed Value': {
          cellValue: '6. Microstructure|[11,1]',
          type: 'String'
        },
        Unit: {
          cellValue: '6. Microstructure|[11,2]',
          type: 'String',
          default: 'pixel'
        },
        Note: {
          cellValue: '6. Microstructure|[11,3]',
          type: 'String'
        }
      },
      Depth: {
        'Fixed Value': {
          cellValue: '6. Microstructure|[12,1]',
          type: 'String'
        },
        Unit: {
          cellValue: '6. Microstructure|[12,2]',
          type: 'String',
          default: 'bit'
        },
        Note: {
          cellValue: '6. Microstructure|[12,3]',
          type: 'String'
        }
      },
      Preprocessing: {
        'Fixed Value': {
          cellValue: '6. Microstructure|[13,1]',
          type: 'String'
        },
        Unit: {
          cellValue: '6. Microstructure|[13,2]',
          type: 'String'
        },
        Note: {
          cellValue: '6. Microstructure|[13,3]',
          type: 'String'
        }
      }
    },
    'Sample experimental info': {
      'Sample size': {
        'Fixed Value': {
          cellValue: '6. Microstructure|[16,1]',
          type: 'String'
        },
        Unit: {
          cellValue: '6. Microstructure|[16,2]',
          type: 'List',
          validList: 'Sample_experimental_info::Sample_size::Unit'
        },
        Note: {
          cellValue: '6. Microstructure|[16,3]',
          type: 'String'
        }
      },
      'Sample thickness': {
        'Fixed Value': {
          cellValue: '6. Microstructure|[17,1]',
          type: 'String'
        },
        Unit: {
          cellValue: '6. Microstructure|[17,2]',
          type: 'List',
          validList: 'Sample_experimental_info::Sample_thickness::Unit'
        },
        Note: {
          cellValue: '6. Microstructure|[17,3]',
          type: 'String'
        }
      }
    }
  }
};

const mockJsonStructure5 = {
  ProcessingMethod: {
    type: 'varied_multiples',
    cellValue: '3. Synthesis and Processing|[4,1]',
    required: false,
    validList: 'Synthesis_and_Processing::Processing_method',
    values: [
      {
        ChooseParameter: {
          type: 'multiples',
          values: [
            {
              Mixing: {
                Description: {
                  description: {
                    cellValue: '3. Synthesis and Processing|[7,1]',
                    type: 'String',
                    required: false
                  },
                  note: {
                    cellValue: '3. Synthesis and Processing|[7,3]',
                    type: 'String',
                    required: false
                  }
                },
                MixingMixer: {
                  fixedvalue: {
                    cellValue: '3. Synthesis and Processing|[8,1]',
                    type: 'String',
                    required: false
                  },
                  note: {
                    cellValue: '3. Synthesis and Processing|[8,3]',
                    type: 'String',
                    required: false
                  }
                },
                MixingMethod: {
                  fixedvalue: {
                    cellValue: '3. Synthesis and Processing|[9,1]',
                    type: 'List',
                    required: false,
                    validList: 'Synthesis_and_Processing::Mixing::Mixing-method::Description/Fixed Value'
                  },
                  note: {
                    cellValue: '3. Synthesis and Processing|[9,3]',
                    type: 'String',
                    required: false
                  }
                },
                RPM: {
                  fixedvalue: {
                    cellValue: '3. Synthesis and Processing|[10,1]',
                    type: 'String',
                    required: false
                  },
                  unit: {
                    cellValue: '3. Synthesis and Processing|[10,2]',
                    type: 'String',
                    required: false
                  },
                  note: {
                    cellValue: '3. Synthesis and Processing|[10,3]',
                    type: 'String',
                    required: false
                  }
                },
                Time: {
                  fixedvalue: {
                    cellValue: '3. Synthesis and Processing|[11,1]',
                    type: 'String',
                    required: false
                  },
                  unit: {
                    cellValue: '3. Synthesis and Processing|[11,2]',
                    type: 'List',
                    required: false,
                    validList: 'Synthesis_and_Processing::Mixing::Mixing-time::Unit'
                  },
                  note: {
                    cellValue: '3. Synthesis and Processing|[11,3]',
                    type: 'String',
                    required: false
                  }
                },
                Temperature: {
                  fixedvalue: {
                    cellValue: '3. Synthesis and Processing|[12,1]',
                    type: 'String',
                    required: false
                  },
                  unit: {
                    cellValue: '3. Synthesis and Processing|[12,2]',
                    type: 'List',
                    required: false,
                    validList: 'Synthesis_and_Processing::Mixing::Mixing-temperature::Unit'
                  },
                  note: {
                    cellValue: '3. Synthesis and Processing|[12,3]',
                    type: 'String',
                    required: false
                  }
                },
                ChemicalUsed: [
                  {
                    name: {
                      cellValue: '3. Synthesis and Processing|[14,1]',
                      type: 'String',
                      required: false
                    },
                    value: {
                      cellValue: '3. Synthesis and Processing|[14,2]',
                      type: 'String',
                      required: false
                    },
                    unit: {
                      cellValue: '3. Synthesis and Processing|[14,3]',
                      type: 'String',
                      required: false
                    }
                  }
                ]
              }
            }
          ]
        }
      }
    ]
  }
};

const mockCurationListMap = {
  citation_type: ['publications', 'lab-generated'],
  Origin: [
    'experiments',
    'informatics (data science)',
    'simulations',
    'theory'
  ],
  publication_type: [
    'research article',
    'conference proceedings',
    'communication',
    'review',
    'letter',
    'technical comment'
  ]
};

const mockSheetData = [
  ['Sample Info', null, 'Note', null],
  [
    'Instructions: Each excel file is for a single sample. For multiple similar samples, duplicate the file and change only the necessary data. One file = one sample.',
    null,
    null,
    null
  ],
  ['Your Name', 'Akash', 'Data contributor\'s name', null],
  ['Your Email', 'akash@prasad.com', null, null],
  [
    'Sample ID',
    null,
    'name your sample in the format of SAMPLE NO',
    'Example: S1'
  ],
  ['Control sample ID', null, null, null],
  ['Origin', 'theorys', null, null],
  ['Citation Type', 'lab-generated', null, null],
  ['Publication Type', 'research article', null, null],
  [null, null, null, null],
  ['DOI', null, null, null],
  [null, null, null, null],
  [
    'If you have a DOI, then STOP HERE on this tab! Rest will be autofilled from DOI.',
    null,
    null,
    null
  ],
  [
    'Without DOI yet? Please fill out the following info.',
    null,
    null,
    null
  ],
  [null, null, null, null],
  ['Publication', null, null, null],
  ['Title', 'Backend developer', null, null],
  ['Author #1', null, 'copy and paste more rows if needed', null],
  ['Author #2', null, null, null],
  ['Keyword #1', null, null, null],
  ['Keyword #2', null, null, null],
  ['Publication Year', null, null, null],
  ['Volume', null, null, null],
  ['Issue', null, null, null],
  ['URL', null, null, null],
  ['Language', null, null, null],
  [
    'Location',
    null,
    'please put first author\'s major affiliation here',
    null
  ],
  ['Date of citation', null, 'mm/dd/yyyy', null],
  [null, null, null, null],
  [
    'If lab generated, please fill in the lab data info below:',
    null,
    null,
    null
  ],
  ['Laboratory Data Info', null, null, null],
  [
    'Date of Sample Made',
    '2023-03-23T00:00:00.000Z',
    'mm/dd/yyyy',
    null
  ],
  [
    'Date of Data Measurement',
    '2023-03-23T00:00:00.000Z',
    'mm/dd/yyyy',
    null
  ],
  [
    'Related DOI',
    'test DOI',
    'for unreported lab data of a published work',
    null
  ]
];

const mockSheetData2 = [
  ['Sample Info', null, 'Note', null],
  [
    'Instructions: Each excel file is for a single sample. For multiple similar samples, duplicate the file and change only the necessary data. One file = one sample.',
    null,
    null,
    null
  ],
  ['Your Name', 'Akash', 'Data contributor\'s name', null],
  ['Your Email', 'akash@prasad.com', null, null],
  [
    'Sample ID',
    null,
    'name your sample in the format of SAMPLE NO',
    'Example: S1'
  ],
  ['Control sample ID', null, null, null],
  ['Origin', null, null, null],
  ['Citation Type', 'lab-generated', null, null],
  ['Publication Type', 'research article', null, null],
  [null, null, null, null],
  ['DOI', null, null, null],
  [null, null, null, null],
  [
    'If you have a DOI, then STOP HERE on this tab! Rest will be autofilled from DOI.',
    null,
    null,
    null
  ],
  [
    'Without DOI yet? Please fill out the following info.',
    null,
    null,
    null
  ],
  [null, null, null, null],
  ['Publication', null, null, null],
  ['Title', 'Curation Paper', null, null],
  ['Author #1', 'Akash Prasad', 'copy and paste more rows if needed', null],
  ['Author #2', null, null, null],
  ['Keyword #1', null, null, null],
  ['Keyword #2', null, null, null],
  ['Publication Year', null, null, null],
  ['Volume', null, null, null],
  ['Issue', null, null, null],
  ['URL', null, null, null],
  ['Language', null, null, null],
  [
    'Location',
    null,
    'please put first author\'s major affiliation here',
    null
  ],
  ['Date of citation', null, 'mm/dd/yyyy', null],
  [null, null, null, null],
  [
    'If lab generated, please fill in the lab data info below:',
    null,
    null,
    null
  ],
  ['Laboratory Data Info', null, null, null],
  [
    'Date of Sample Made',
    '2023-03-23T00:00:00.000Z',
    'mm/dd/yyyy',
    null
  ],
  [
    'Date of Data Measurement',
    '2023-03-23T00:00:00.000Z',
    'mm/dd/yyyy',
    null
  ],
  [
    'Related DOI',
    'test DOI',
    'for unreported lab data of a published work',
    null
  ]
];

const mockSheetData3 = [
  [
    'DMA Datafile #',
    null,
    'Matester_template.xlsx',
    '.xlsx, .csv, .tsv',
    null,
    null,
    null,
    null
  ],
  [
    'DMA Datafile #',
    null,
    'weibull.csv',
    '.xlsx, .csv, .tsv',
    null,
    null,
    null,
    null
  ],
  [
    'Master Curve #',
    null,
    'master-template.xlsx',
    '.xlsx, .csv, .tsv',
    null,
    null,
    null,
    null
  ]
];

const mockSheetData4 = [
  ['Microstructure', null, null, null],
  [
    'Instructions: Include as many high quality microstructure images as desired. \n' +
        '1. Put the filename in the corresponding box (line 5); \n' +
        '2. include other details of images as available. \n' +
        '3. For each added image, copy and paste all sections in the box as shown for Imagefile #.\n' +
        '4. Enter filename and details for each image.',
    null,
    null,
    null
  ],
  [null, null, null, null],
  ['Imagefile #', 'Datafile name.jpg/png/tif/gif', 'Note', null],
  ['Microstructure filename', '001.tif', null, null],
  ['Description', '40000x magnification', null, null],
  ['Microscopy type', 'TEM', null, null],
  ['Image type', 'grayscale', null, null],
  [null, null, null, null],
  ['Image dimension', 'Fixed Value', 'Unit', 'Note'],
  ['Width', null, null, null],
  ['Height', null, 'pixel', null],
  ['Depth', null, 'bit', null],
  ['Preprocessing', null, null, null],
  [null, null, null, null],
  ['Sample experimental info', 'Fixed Value', 'Unit', 'Note'],
  ['Sample size', null, null, null],
  ['Sample thickness', 50, 'nm', null]
];

const mockSheetData5 = [
  [
    'Synthesis and Processing',
    null,
    null,
    null,
    null,
    'TOOLBOX',
    null,
    null,
    null
  ],
  [
    'Instruction:\n' +
        '1. Fill in the experimental procedure to describe your processing in detail;\n' +
        '2. Choose the overall processing method from the dropdown menu;\n' +
        '3. Copy and paste each key processing step from the toolbox, in order, and fill out relevant details.                                                                                                                                           4. Fill in the Description/Fixed Value column with non-numerical descriptions or numerical results (Fixed Value).',
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null
  ],
  [
    'Experimental Procedure',
    'Sample mixing at 50 RPM, specific energy input 500 kJ/kg',
    null,
    null,
    null,
    'Pick a processing method for the step first',
    null,
    null,
    null
  ],
  [
    null,
    null,
    null,
    null,
    null,
    'Processing method',
    null,
    null,
    null
  ],
  [
    'Processing method #',
    'MeltMixing',
    null,
    null,
    null,
    'Then pick a segment to describe the step',
    null,
    null,
    null
  ],
  [
    null,
    null,
    null,
    null,
    null,
    'Additive #',
    'Description/Fixed Value',
    'Unit',
    'Note'
  ],
  [
    'Mixing #',
    'Description/Fixed Value',
    'Unit',
    'Note',
    null,
    'Additive - description',
    null,
    null,
    null
  ],
  [
    'Mixing - description',
    'The nanoparticles were precipitated out in DI water and were mixed with polymer.',
    null,
    null,
    null,
    'Additive - additive',
    null,
    null,
    null
  ],
  [
    'Mixing - mixer',
    null,
    null,
    null,
    null,
    'Additive - amount',
    null,
    null,
    null
  ],
  [
    'Mixing - method',
    'dissolving',
    null,
    null,
    null,
    null,
    null,
    null,
    null
  ],
  [
    'Mixing - RPM',
    null,
    null,
    null,
    null,
    'Cooling #',
    'Description/Fixed Value',
    'Unit',
    'Note'
  ],
  [
    'Mixing - time',
    null,
    null,
    null,
    null,
    'Cooling - description',
    null,
    null,
    null
  ],
  [
    'Mixing - temperature',
    null,
    null,
    null,
    null,
    'Cooling - temperature',
    null,
    null,
    null
  ],
  [
    null,
    'Name',
    'Value',
    'Unit',
    null,
    'Cooling - time',
    null,
    null,
    null
  ],
  [
    'Mixing - chemical used #',
    'tetrahydrofuran',
    50,
    'mL',
    null,
    'Cooling - pressure',
    null,
    null,
    null
  ],
  [
    null, null,
    null, null,
    null, null,
    'Mode', null,
    null
  ]
];

const mockCSVData = [
  {
    'Breakdown Field (kV/mm)': '65.22058824',
    'Probability of Failure': '2.464788732'
  },
  {
    'Breakdown Field (kV/mm)': '81.08108108',
    'Probability of Failure': '5.985915493'
  },
  {
    'Breakdown Field (kV/mm)': '91.7027027',
    'Probability of Failure': '9.507042254'
  },
  {
    'Breakdown Field (kV/mm)': '92.86567164',
    'Probability of Failure': '13.02816901'
  },
  {
    'Breakdown Field (kV/mm)': '94.37037037',
    'Probability of Failure': '16.54929577'
  },
  {
    'Breakdown Field (kV/mm)': '96.33870968',
    'Probability of Failure': '20.07042254'
  },
  {
    'Breakdown Field (kV/mm)': '98.78378378',
    'Probability of Failure': '23.5915493'
  },
  {
    'Breakdown Field (kV/mm)': '100.28',
    'Probability of Failure': '27.11267606'
  },
  {
    'Breakdown Field (kV/mm)': '101.9285714',
    'Probability of Failure': '30.63380282'
  },
  {
    'Breakdown Field (kV/mm)': '102.060241',
    'Probability of Failure': '34.15492958'
  },
  {
    'Breakdown Field (kV/mm)': '104.8309859',
    'Probability of Failure': '37.67605634'
  },
  {
    'Breakdown Field (kV/mm)': '105.28',
    'Probability of Failure': '41.1971831'
  },
  {
    'Breakdown Field (kV/mm)': '105.6338028',
    'Probability of Failure': '44.71830986'
  },
  {
    'Breakdown Field (kV/mm)': '105.8987342',
    'Probability of Failure': '48.23943662'
  },
  {
    'Breakdown Field (kV/mm)': '105.9746835',
    'Probability of Failure': '51.76056338'
  },
  {
    'Breakdown Field (kV/mm)': '107.4366197',
    'Probability of Failure': '55.28169014'
  },
  {
    'Breakdown Field (kV/mm)': '110.2153846',
    'Probability of Failure': '58.8028169'
  },
  {
    'Breakdown Field (kV/mm)': '110.8571429',
    'Probability of Failure': '62.32394366'
  },
  {
    'Breakdown Field (kV/mm)': '115.64',
    'Probability of Failure': '65.84507042'
  },
  {
    'Breakdown Field (kV/mm)': '118.4868421',
    'Probability of Failure': '69.36619718'
  },
  {
    'Breakdown Field (kV/mm)': '121.4915254',
    'Probability of Failure': '72.88732394'
  },
  {
    'Breakdown Field (kV/mm)': '122.3943662',
    'Probability of Failure': '76.4084507'
  },
  {
    'Breakdown Field (kV/mm)': '124.9850746',
    'Probability of Failure': '79.92957746'
  },
  {
    'Breakdown Field (kV/mm)': '127.1454545',
    'Probability of Failure': '83.45070423'
  },
  {
    'Breakdown Field (kV/mm)': '127.9850746',
    'Probability of Failure': '86.97183099'
  },
  {
    'Breakdown Field (kV/mm)': '133.4067797',
    'Probability of Failure': '90.49295775'
  },
  {
    'Breakdown Field (kV/mm)': '133.8166667',
    'Probability of Failure': '94.01408451'
  },
  {
    'Breakdown Field (kV/mm)': '163.4791667',
    'Probability of Failure': '97.53521127'
  }
];

const mockCuratedXlsxObject = {
  ID: 'S10',
  Control_ID: 'S28',
  DATA_SOURCE: {
    Citation: {
      CommonFields: {
        YourName: 'John Doe',
        YourEmail: 'john@doe.com',
        Origin: 'experiments',
        CitationType: 'lab-generated',
        Author: [
          {
            'Author #1': 'Aditya Shanker Prasad'
          }
        ],
        URL: 'https://search.proquest.com/openview/eb63d4d6b84b1252971b3e3eec53b97c/1?pq-origsite=gscholar&cbl=51922&diss=y',
        Location: 'Rensselaer Polytechnic Institute'
      }
    }
  },
  MATERIALS: {
    Matrix: {
      MatrixComponent: {
        ChemicalName: 'Polystyrene',
        Abbreviation: 'PS',
        PlasticType: 'thermoplastic',
        PolymerClass: 'Polystyrene',
        PolymerType: 'homopolymer',
        ManufacturerName: 'Sigma Aldrich',
        MolecularWeight: {
          description: 'weight average (Mw)',
          value: 50000,
          unit: 'g/mol'
        }
      }
    },
    Filler: {
      FillerComponent: [
        {
          ChemicalName: 'Silica',
          ManufacturerOrSourceName: 'Nissan',
          TradeName: 'MEKST',
          Density: {
            value: 2.65,
            unit: 'g/cm^3'
          },
          CrystalPhase: 'amorphous',
          ParticleDiameter: {
            value: 14,
            unit: 'nm'
          }
        }
      ],
      FillerComposition: {
        Fraction: {
          mass: {
            value: 0.02
          },
          volume: {
            value: 0.02
          }
        }
      }
    },
    ParticleSurfaceTreatment: [
      {
        ChemicalName: 'aminopropyledimethylethoxysilane',
        Abbreviation: 'APDMES',
        ManufacturerOrSourceName: 'Gelest Inc.',
        Density: {
          value: 0.857,
          unit: 'g/cm^3'
        },
        MolecularWeight: {
          value: 161.32,
          unit: 'g/mol'
        }
      }
    ],
    SurfaceChemicalProcessing: {
      ChooseParameter: [
        {
          Mixing: {
            Description: '16 ml of MEK-ST (Nissan) was taken in a flask along with 50 ml of THF and 0.5 ml of the silane coupling agent. The solution was stirred and refluxed at 70°C under an inert N2 atmosphere for 24 hours.',
            MixingMethod: {
              value: 'stirring'
            },
            Time: {
              value: 24,
              unit: 'hours'
            },
            Temperature: {
              value: 70,
              unit: 'Celsius'
            },
            ChemicalUsed: [
              {
                name: 'tetrahydrofuran',
                value: 50,
                unit: 'mL'
              },
              {
                name: 'silane',
                value: 0.5,
                unit: 'mL'
              },
              {
                name: 'silica',
                value: 16,
                unit: 'mL'
              }
            ]
          }
        },
        {
          Cooling: {
            Description: 'The mixture was cooled down to room temperature',
            Temperature: {
              value: 28,
              unit: 'Celsius'
            },
            AmbientCondition: 'atmosphere'
          }
        },
        {
          'Drying-Evaporation': {
            Description: 'THF was reduced to 20 ml in a rotor evaporator in order to reduce the amount of needed hexane.'
          }
        },
        {
          Solvent: {
            SolventName: 'hexane',
            SolventAmount: {
              value: 20,
              unit: 'mL'
            }
          }
        },
        {
          Centrifugation: 'Used'
        },
        {
          Other: 'The mixture was precipitated in 200 ml of hexane. The particles were then centrifuged at 10,000 rpm for 10 min at 10 deg C.'
        }
      ]
    }
  },
  PROCESSING: {
    ExperimentalProcedure: 'Sample mixing at 50 RPM, specific energy input 500 kJ/kg'
  },
  CHARACTERIZATION: {
    Microscopy: {
      Transmission_Electron_Microscopy: {
        EquipmentUsed: 'JEOL-2010',
        Description: 'To observe the dispersion of the nanoparticles in the polymer matrix, the materials were embedded in an epoxy matrix and slices of *50 nm were sectioned at room temperature in an ultramicrotome using a diamond knife. The sections were collected on a copper grid and imaged in a JEOL-2010 transmission electron microscope (TEM).',
        Magnification: {
          value: 60000
        },
        AcceleratingVoltage: {
          value: 200,
          unit: 'kV'
        }
      }
    },
    Spectroscopy: {
      Dielectric_and_Impedance_Spectroscopy_Analysis: {
        EquipmentUsed: 'Novocontrol Alpha Impedance'
      }
    }
  },
  PROPERTIES: {
    Electrical: {
      AC_DielectricDispersion: {
        DielectricDispersionDependence: {
          'Description-Condition': 'Frequency dependence'
        },
        'TestConditions-Temperature': {
          'Description-Condition': 'room temperature',
          value: {
            value: 25,
            unit: 'Celsius'
          }
        },
        DielectricBreakdownStrength: {
          Condition: 'AC',
          Profile: {
            value: 117.3842,
            unit: 'kV/mm'
          },
          WeibullParameter: [
            {
              description: 'scale parameter',
              value: {
                value: 117.3842,
                unit: 'kV/mm'
              }
            },
            {
              description: 'shape parameter',
              value: {
                value: 8.602
              }
            }
          ]
        }
      }
    }
  },
  MICROSTRUCTURE: {
    Imagefile: [
      {
        Description: '40000x magnification',
        MicroscopyType: 'TEM',
        Type: 'grayscale',
        Dimension: {
          Width: {
            unit: 'pixel'
          },
          Height: {
            unit: 'pixel'
          },
          Depth: {
            unit: 'bit'
          }
        }
      }
    ],
    Experimental_Sample_Info: {
      SampleThickness: {
        value: 50,
        unit: 'nm'
      }
    }
  }
};

const updatedCuratedXlsxObject = {
  ...mockCuratedXlsxObject,
  'Your Name': 'Uthdev'
};

const createBaseObject = (BaseObject, storedObject) => {
  const curatedBaseObject = {};
  for (const property in BaseObject) {
    const propertyValue = BaseObject[property];
    if (Array.isArray(propertyValue?.values)) {
      const objectArray = propertyValue.values.map((BaseObject, i) => createBaseObject(BaseObject, storedObject?.[property]?.[i]));
      curatedBaseObject[BaseObjectSubstitutionMap[property] ?? property] = objectArray;
    } else if (Array.isArray(propertyValue)) {
      const objectArray = propertyValue.map((BaseObject, i) => createBaseObject(BaseObject, storedObject?.[property]?.[i]));
      curatedBaseObject[BaseObjectSubstitutionMap[property] ?? property] = objectArray;
    } else if (propertyValue?.cellValue) {
      if (storedObject?.[property]) {
        curatedBaseObject[BaseObjectSubstitutionMap[property] ?? property] = storedObject[property];
      } else {
        curatedBaseObject[BaseObjectSubstitutionMap[property] ?? property] = null;
      }
    } else {
      const nestedObj = createBaseObject(propertyValue, storedObject?.[property]);

      if (Object.keys(nestedObj).length > 0) {
        curatedBaseObject[BaseObjectSubstitutionMap[property] ?? property] = nestedObj;
      }
    }
  }
  return curatedBaseObject;
};

const mockBaseObject = createBaseObject(jsonStructure, mockCuratedXlsxObject);

const fetchedCuratedXlsxObject = {
  object: mockCuratedXlsxObject,
  user: {
    _id: '62f119fb28eedaab012d1262',
    givenName: 'Akash',
    surName: 'Prasad'
  },
  _id: '642561166202628c4aff8d59',
  createdAt: '2023-03-30T10:14:46.072Z',
  updatedAt: '2023-03-30T10:14:46.072Z',
  __v: 0,
  populate: sinon.stub().resolvesThis()
};

const wrongXlsxFile = [
  {
    fieldname: 'uploadfile',
    originalname: 'Matester template.xlsx',
    encoding: '7bit',
    mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    destination: 'mm_files',
    filename: 'coloured_monkey_celestia-2023-03-30T09:59:24.432Z-Matester template.xlsx',
    path: 'mm_files/coloured_monkey_celestia-2023-03-30T09:59:24.432Z-Matester template.xlsx',
    size: 101176
  }
];

const correctXlsxFile = [
  {
    fieldname: 'uploadfile',
    originalname: 'master_template.xlsx',
    encoding: '7bit',
    mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    destination: 'mm_files',
    filename: 'coloured_monkey_celestia-2023-03-30T09:51:10.334Z-master_template.xlsx',
    path: 'mm_files/coloured_monkey_celestia-2023-03-30T09:51:10.334Z-master_template.xlsx',
    size: 101191
  }
];

const mockBulkCurationZipFile = [
  {
    fieldname: 'uploadfile',
    originalname: 'curations.zip',
    encoding: '7bit',
    mimetype: 'application/zip',
    destination: 'mm_files',
    filename: 'entitled_bobolink_emmaline-2023-06-15T12:02:53.834Z-curations.zip',
    path: 'mm_files/entitled_bobolink_emmaline-2023-06-15T12:02:53.834Z-curations.zip',
    size: 121836
  }
];

const mockUploadedFiles = [
  {
    fieldname: 'uploadfile',
    originalname: 'master-template.xlsx',
    encoding: '7bit',
    mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    destination: 'mm_files',
    filename: 'educational_hornet_maisie-2023-04-18T16:01:27.609Z-master-template.xlsx',
    path: 'mm_files/educational_hornet_maisie-2023-04-18T16:01:27.609Z-master-template.xlsx',
    size: 104928
  },
  {
    fieldname: 'uploadfile',
    originalname: 'Bello.xlsx',
    encoding: '7bit',
    mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    destination: 'mm_files',
    filename: 'educational_hornet_maisie-2023-04-18T16:01:27.616Z-Bello.xlsx',
    path: 'mm_files/educational_hornet_maisie-2023-04-18T16:01:27.616Z-Bello.xlsx',
    size: 101196
  },
  {
    fieldname: 'uploadfile',
    originalname: 'Matester_template.xlsx',
    encoding: '7bit',
    mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    destination: 'mm_files',
    filename: 'educational_hornet_maisie-2023-04-18T16:01:27.625Z-Matester_template.xlsx',
    path: 'mm_files/educational_hornet_maisie-2023-04-18T16:01:27.625Z-Matester_template.xlsx',
    size: 101196
  },
  {
    fieldname: 'uploadfile',
    originalname: '001.tif',
    encoding: '7bit',
    mimetype: 'image/tiff',
    destination: 'mm_files',
    filename: 'exciting_spoonbill_ermentrude-2023-05-05T11:25:53.451Z-001.tif',
    path: 'mm_files/exciting_spoonbill_ermentrude-2023-05-05T11:25:53.451Z-001.tif',
    size: 101196
  },
  {
    fieldname: 'uploadfile',
    originalname: 'tan_delta.csv',
    encoding: '7bit',
    mimetype: 'text/csv',
    destination: 'mm_files',
    filename: 'balanced_cattle_olympia-2023-05-25T10:38:12.640Z-tan_delta.csv',
    path: 'mm_files/balanced_cattle_olympia-2023-05-25T10:38:12.640Z-tan_delta.csv',
    size: 1750
  },
  {
    fieldname: 'uploadfile',
    originalname: 'weibull.csv',
    encoding: '7bit',
    mimetype: 'text/csv',
    destination: 'mm_files',
    filename: 'balanced_cattle_olympia-2023-05-25T10:38:12.633Z-weibull.csv',
    path: 'mm_files/balanced_cattle_olympia-2023-05-25T10:38:12.633Z-weibull.csv',
    size: 727
  }
];

const mockDatasetId = {
  _id: '583e3d6ae74a1d205f4e3fd3',
  user: '583e3d6ae44a1d205f4e3fd3',
  status: 'APPROVED',
  samples: ['583e3d6ae74a3d205f4e3fd3', '583e3d6ae74a1d205f4e3fd3']
};

const mockCurateObject = {
  xml: '<?xml version="1.0" encoding="utf-8"?>\n  <PolymerNanocomposite>\n  <ID>S10</ID>\n  <Control_ID>S28</Control_ID>\n  <DATA_SOURCE>\n    <Citation>\n      <CommonFields>\n        <YourName>John Doe</YourName>\n        <YourEmail>john@doe.com</YourEmail>\n        <Origin>experiments</Origin>\n        <CitationType>lab-generated</CitationType>\n        <Author>Aditya Shanker Prasad</Author>\n        <Author>John Doe</Author>\n        <URL>https://search.proquest.com/openview/eb63d4d6b84b1252971b3e3eec53b97c/1?pq-origsite=gscholar&cbl=51922&diss=y</URL>\n        <Location>Rensselaer Polytechnic Institute</Location>\n      </CommonFields>\n    </Citation>\n  </DATA_SOURCE>\n   </PolymerNanocomposite>\n',
  user: {
    _id: '643931cc6f44b02f01380f7a',
    displayName: 'Test'
  },
  groupId: '583e3d6ae74a1d205f4e3fd3',
  isApproved: 'false,',
  status: 'Editing'
};

const mockXmlData = {
  _id: '64394c8032bc6325505af6f9',
  title: 'L183_53_Portschke_2003.xml',
  xml_str: '<xml> <CD> <TITLE>Empire Burlesque</TITLE><ARTIST>Bob Dylan</ARTIST> <COUNTRY>USA</COUNTRY> <COMPANY>Columbia</COMPANY> <PRICE>10.90</PRICE> <YEAR>1985</YEAR> </CD> </xml>'
};

const user = {
  _id: 'ai094oja09aw40-o',
  displayName: 'test'
};

const mockUnzippedFolder = {
  files: ['mm_files/bulk-curation-1686834726293/master_template.xlsx'],
  folders: ['mm_files/bulk-curation-1686834726293/Ls-94k-askd']
};

const mockCurationError = {
  errors: {
    'real_permittivity.csv': 'file not uploaded',
    'loss_permittivity.csv': 'file not uploaded',
    'tan_delta.csv': 'file not uploaded',
    'weibull.csv': 'file not uploaded',
    '001.tif': 'file not uploaded'
  }
};

const mockBulkCuration1 = {
  bulkCurations: {},
  bulkErrors: {
    root: mockCurationError.errors,
    'Ls-94k-askd': {
      '001.tif': 'file not uploaded'
    }
  }
};

const mockBulkCuration2 = {
  bulkCurations: {
    root: mockCurateObject,
    'Ls-94k-askd': mockCurateObject
  },
  bulkErrors: {
    'Ls-95k-askd': {
      '001.tif': 'file not uploaded'
    }
  }
};

const mockRes = {
  status: function (code) {
    return this;
  },
  json: function (object) {
    return object;
  }
};

module.exports = {
  user,
  correctXlsxFile,
  mockBulkCurationZipFile,
  wrongXlsxFile,
  mockCurationList,
  mockCurateObject,
  mockCuratedXlsxObject,
  fetchedCuratedXlsxObject,
  mockSheetData,
  updatedCuratedXlsxObject,
  mockBaseObject,
  jsonStructure,
  mockCurationListMap,
  mockJsonStructure,
  mockSheetData2,
  mockJsonStructure2,
  mockSheetData3,
  mockSheetData4,
  mockSheetData5,
  mockJsonStructure4,
  mockJsonStructure5,
  mockUploadedFiles,
  mockDatasetId,
  mockXmlData,
  mockCSVData,
  mockUnzippedFolder,
  mockCurationError,
  mockBulkCuration1,
  mockBulkCuration2,
  mockRes
};
