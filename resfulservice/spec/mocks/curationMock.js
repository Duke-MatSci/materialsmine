const sinon = require('sinon');
const jsonStructure = require('../../config/spreadsheet/xlxs.json');

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
    value: '1. Data Origin|[2,1]',
    type: 'String'
  },
  'Your Email': {
    value: '1. Data Origin|[3,1]',
    type: 'String'
  },
  'Sample ID': {
    value: '1. Data Origin|[4,1]',
    type: 'String'
  },
  'Control sample ID': {
    value: '1. Data Origin|[5,1]',
    type: 'String'
  },
  Origin: {
    value: '1. Data Origin|[6,1]',
    type: 'List',
    validList: 'Origin'
  },
  'Citation Type': {
    value: '1. Data Origin|[7,1]',
    type: 'List',
    validList: 'Citation_type'
  },
  'Publication Type': {
    value: '1. Data Origin|[8,1]',
    type: 'List',
    validList: 'publication_type'
  },
  DOI: {
    value: '1. Data Origin|[10,1]',
    type: 'String'
  },
  Publication: {
    value: '1. Data Origin|[15,1]',
    type: 'String'
  },
  Title: {
    value: '1. Data Origin|[16,1]',
    type: 'String'
  },
  Author: {
    type: 'multiples',
    values: [
      {
        'Author #1': {
          value: '1. Data Origin|[17,1]',
          type: 'String'
        }
      },
      {
        'Author #2': {
          value: '1. Data Origin|[18,1]',
          type: 'String'
        }
      }
    ]
  },
  'Publication Year': {
    value: '1. Data Origin|[21,1]',
    type: 'String'
  },
  Volume: {
    value: '1. Data Origin|[22,1]',
    type: 'String'
  },
  Issue: {
    value: '1. Data Origin|[23,1]',
    type: 'String'
  },
  URL: {
    value: '1. Data Origin|[24,1]',
    type: 'String'
  },
  Language: {
    value: '1. Data Origin|[25,1]',
    type: 'String'
  },
  Location: {
    value: '1. Data Origin|[26,1]',
    type: 'String'
  },
  'Date of citation': {
    value: '1. Data Origin|[27,1]',
    type: 'String'
  },
  'Laboratory Data Info': {
    'Date of Sample Made': {
      value: '1. Data Origin|[31,1]',
      type: 'String'
    },
    'Date of Data Measurement': {
      value: '1. Data Origin|[32,1]',
      type: 'String'
    },
    'Related DOI': {
      value: '1. Data Origin|[33,1]',
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
          value: '5.2 Properties-Viscoelastic|[0,1]',
          type: 'String'
        },
        Datafile: {
          value: '5.2 Properties-Viscoelastic|[0,2]',
          type: 'File'
        },
        Note: {
          value: '5.2 Properties-Viscoelastic|[0,3]',
          type: 'String'
        }
      },
      {
        Description: {
          value: '5.2 Properties-Viscoelastic|[1,1]',
          type: 'String'
        },
        Datafile: {
          value: '5.2 Properties-Viscoelastic|[1,2]',
          type: 'File'
        },
        Note: {
          value: '5.2 Properties-Viscoelastic|[1,3]',
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
          value: '5.2 Properties-Viscoelastic|[2,1]',
          type: 'String'
        },
        Datafile: {
          value: '5.2 Properties-Viscoelastic|[2,2]',
          type: 'File'
        },
        Note: {
          value: '5.2 Properties-Viscoelastic|[2,3]',
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
              value: '6. Microstructure|[4,1]',
              type: 'File',
              validTypes: ['jpg', 'png', 'gif']
            },
            Note: {
              value: '6. Microstructure|[4,2]',
              type: 'String'
            }
          },
          Description: {
            Datafile: {
              value: '6. Microstructure|[5,1]',
              type: 'String'
            },
            Note: {
              value: '6. Microstructure|[5,2]',
              type: 'String'
            }
          },
          'Microscopy type': {
            Datafile: {
              value: '6. Microstructure|[6,1]',
              type: 'List',
              validList: 'Imagefile::Microscopy_type::Datafile'
            },
            Note: {
              value: '6. Microstructure|[6,2]',
              type: 'String'
            }
          },
          'Image type': {
            Datafile: {
              value: '6. Microstructure|[7,1]',
              type: 'List',
              validList: 'Imagefile::Image_type::Datafile'
            },
            Note: {
              value: '6. Microstructure|[7,2]',
              type: 'String'
            }
          }
        }
      ]
    },
    'Image dimension': {
      Width: {
        'Fixed Value': {
          value: '6. Microstructure|[10,1]',
          type: 'String'
        },
        Unit: {
          value: '6. Microstructure|[10,2]',
          type: 'String',
          default: 'pixel'
        },
        Note: {
          value: '6. Microstructure|[10,3]',
          type: 'String'
        }
      },
      Height: {
        'Fixed Value': {
          value: '6. Microstructure|[11,1]',
          type: 'String'
        },
        Unit: {
          value: '6. Microstructure|[11,2]',
          type: 'String',
          default: 'pixel'
        },
        Note: {
          value: '6. Microstructure|[11,3]',
          type: 'String'
        }
      },
      Depth: {
        'Fixed Value': {
          value: '6. Microstructure|[12,1]',
          type: 'String'
        },
        Unit: {
          value: '6. Microstructure|[12,2]',
          type: 'String',
          default: 'bit'
        },
        Note: {
          value: '6. Microstructure|[12,3]',
          type: 'String'
        }
      },
      Preprocessing: {
        'Fixed Value': {
          value: '6. Microstructure|[13,1]',
          type: 'String'
        },
        Unit: {
          value: '6. Microstructure|[13,2]',
          type: 'String'
        },
        Note: {
          value: '6. Microstructure|[13,3]',
          type: 'String'
        }
      }
    },
    'Sample experimental info': {
      'Sample size': {
        'Fixed Value': {
          value: '6. Microstructure|[16,1]',
          type: 'String'
        },
        Unit: {
          value: '6. Microstructure|[16,2]',
          type: 'List',
          validList: 'Sample_experimental_info::Sample_size::Unit'
        },
        Note: {
          value: '6. Microstructure|[16,3]',
          type: 'String'
        }
      },
      'Sample thickness': {
        'Fixed Value': {
          value: '6. Microstructure|[17,1]',
          type: 'String'
        },
        Unit: {
          value: '6. Microstructure|[17,2]',
          type: 'List',
          validList: 'Sample_experimental_info::Sample_thickness::Unit'
        },
        Note: {
          value: '6. Microstructure|[17,3]',
          type: 'String'
        }
      }
    }
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
  ['Title', 'Backend developer', null, null],
  ['Author #1', 'gbolahan adeleke', 'copy and paste more rows if needed', null],
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
    'Bello.xlsx',
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

const mockCuratedXlsxObject = {
  'data origin': {
    'Your Name': 'Akash Prasad',
    'Your Email': 'akash@prasad.com',
    'Sample ID': 'S10',
    'Control sample ID': 'S28',
    Origin: 'experiments',
    'Citation Type': 'lab-generated',
    Author: [
      {
        'Author #1': 'Aditya Shanker Prasad'
      }
    ],
    URL: 'https://search.proquest.com/openview/eb63d4d6b84b1252971b3e3eec53b97c/1?pq-origsite=gscholar&cbl=51922&diss=y',
    Location: 'Rensselaer Polytechnic Institute'
  },
  'material types': {
    Matrix: [
      {
        'Chemical name': {
          Description: 'Polystyrene'
        },
        Abbreviation: {
          Description: 'PS'
        },
        'Polymer plastic type': {
          Description: 'thermoplastic'
        },
        'Polymer class': {
          Description: 'Polystyrene'
        },
        'Polymer type': {
          Description: 'homopolymer'
        },
        'Polymer manufacturer or source name': {
          Description: 'Sigma Aldrich'
        },
        'Polymer molecular weight': {
          Description: 'weight average (Mw)',
          Value: 50000,
          Unit: 'g/mol'
        }
      }
    ],
    Filler: [
      {
        'Filler chemical name/Filler name': {
          Description: 'Silica'
        },
        'Manufacturer or source name': {
          Description: 'Nissan'
        },
        'Trade name': {
          Description: 'MEKST'
        },
        Density: {
          Value: 2.65,
          Unit: 'g/cm^3'
        },
        'Crystal phase': {
          Description: 'amorphous'
        },
        'Particle diameter': {
          Value: 14,
          Unit: 'nm'
        }
      }
    ],
    'Filler Composition': {
      Fraction: 'mass'
    },
    'Particle Surface Treatment (PST)': [
      {
        'PST chemical name': {
          Description: 'aminopropyledimethylethoxysilane'
        },
        'PST abbreviation': {
          Description: 'APDMES'
        },
        'PST manufacturer or source name': {
          Description: 'Gelest Inc.'
        },
        'PST density': {
          Value: 0.857,
          Unit: 'g/cm^3'
        },
        'PST molecular weight': {
          Value: 161.32,
          Unit: 'g/mol'
        }
      }
    ],
    'Surface Chemical Processing': {
      Mixing: [
        {
          'Mixing - description': {
            'Description/Fixed Value': '16 ml of MEK-ST (Nissan) was taken in a flask along with 50 ml of THF and 0.5 ml of the silane coupling agent. The solution was stirred and refluxed at 70°C under an inert N2 atmosphere for 24 hours.'
          },
          'Mixing - method': {
            'Description/Fixed Value': 'stirring'
          },
          'Mixing - time': {
            'Description/Fixed Value': 24,
            Unit: 'hours'
          },
          'Mixing - temperature': {
            'Description/Fixed Value': 70,
            Unit: 'Celsius'
          },
          'Mixing - chemical used': {
            0: {
              Name: 'tetrahydrofuran',
              Value: 50,
              Unit: 'mL'
            },
            1: {
              Name: 'silane',
              Value: 0.5,
              Unit: 'mL'
            },
            2: {
              Name: 'silica',
              Value: 16,
              Unit: 'mL'
            }
          }
        }
      ],
      Cooling: [
        {
          'Cooling - description': {
            'Description/Fixed Value': 'The mixture was cooled down to room temperature'
          },
          'Cooling - temperature': {
            'Description/Fixed Value': 28,
            Unit: 'Celsius'
          },
          'Cooling - ambient condition': {
            Mode: 'atmosphere'
          }
        }
      ],
      'Drying/Evaporation': [
        {
          'Drying/Evaporation - description': {
            'Description/Fixed Value': 'THF was reduced to 20 ml in a rotor evaporator in order to reduce the amount of needed hexane.'
          }
        }
      ],
      Solvent: [
        {
          'Solvent - solvent amount': {
            Name: 'hexane',
            Value: 20,
            Unit: 'mL'
          }
        }
      ],
      Centrifugation: [
        {
          Name: 'Used'
        }
      ],
      Other: [
        {
          'Other - description': {
            Description: 'The mixture was precipitated in 200 ml of hexane. The particles were then centrifuged at 10,000 rpm for 10 min at 10 deg C.'
          }
        }
      ]
    }
  },
  'synthesis and processing': {
    'Experimental Procedure': 'Sample mixing at 50 RPM, specific energy input 500 kJ/kg',
    'Processing method': [
      {
        'Processing method #': 'MeltMixing'
      }
    ],
    Mixing: [
      {
        'Mixing - description': {
          'Description/Fixed Value': 'The nanoparticles were precipitated out in DI water and were mixed with polymer.'
        },
        'Mixing - method': {
          'Description/Fixed Value': 'dissolving'
        }
      }
    ],
    'Drying/Evaporation': [
      {
        'Drying/Evaporation - description': {
          'Description/Fixed Value': 'This solution was dried in a vacuum oven at 90°C for 12 hours to ensure the removal of any remnants'
        },
        'Drying/Evaporation - temperature': {
          'Description/Fixed Value': 90,
          Unit: 'Celsius'
        },
        'Drying/Evaporation - time': {
          'Description/Fixed Value': 12,
          Unit: 'hours'
        },
        'Drying/Evaporation - ambient condition': {
          Mode: 'vacuum'
        }
      }
    ],
    Other: [
      {
        'Other - description': {
          Description: 'The mixtures were then milled in a jet milling machine in order to reduce the starting agglomerate size.'
        }
      }
    ],
    Extrusion: [
      {
        'Extrusion - Twin screw extrusion': {
          Extruder: {
            'Description/Fixed Value': 'Thermo Haake Minilab'
          },
          'Residence time': {
            'Description/Fixed Value': 531,
            Unit: 'seconds'
          },
          'Extrusion temperature': {
            'Description/Fixed Value': 150,
            Unit: 'Celsius'
          },
          'Rotation mode': {
            'Description/Fixed Value': 'CounterRotation'
          },
          'Screw diameter': {
            'Description/Fixed Value': 12.7,
            Unit: 'mm'
          },
          'Screw channel diameter': {
            'Description/Fixed Value': 0.56,
            Unit: 'mm'
          },
          'Heating zone': [
            {
              'Rotation speed': {
                'Description/Fixed Value': 50
              }
            }
          ],
          Output: {
            'Output - Melt temperature': {
              'Description/Fixed Value': 150,
              Unit: 'Celsius'
            },
            'Output - Pressure at die': {
              'Description/Fixed Value': 8,
              Unit: 'MPa'
            },
            'Output - Torque': {
              'Description/Fixed Value': 0.9,
              Unit: 'Nm'
            },
            'Output - Residence time': {
              'Description/Fixed Value': 531,
              Unit: 'seconds'
            }
          }
        }
      }
    ]
  },
  'characterization methods': {
    Microscopy: {
      'Transmission electron microscopy': {
        'Equipment used': {
          Description: 'JEOL-2010'
        },
        'Equipment description': {
          Description: 'To observe the dispersion of the nanoparticles in the polymer matrix, the materials were embedded in an epoxy matrix and slices of *50 nm were sectioned at room temperature in an ultramicrotome using a diamond knife. The sections were collected on a copper grid and imaged in a JEOL-2010 transmission electron microscope (TEM).'
        },
        Magnification: {
          'Fixed Value': 60000
        },
        'Accelerating voltage': {
          'Fixed Value': 200,
          Unit: 'kV'
        }
      }
    },
    Spectroscopy: {
      'Dielectric and impedance spectroscopy analysis': {
        'Equipment used': {
          Description: 'Novocontrol Alpha Impedance'
        }
      }
    }
  },
  'properties electrical': {
    'AC dielectric dispersion #': {
      Dependence: {
        'Description/Condition': 'Frequency dependence'
      },
      'Test Conditions - Temperature': {
        'Description/Condition': 'room temperature',
        'Fixed Value': 25,
        Unit: 'Celsius',
        Note: 'only fill in when it\'s frequency dependence'
      },
      'Test Conditions - Frequency': {
        Note: 'only fill in when it\'s temperature dependence'
      },
      'Real permittivity': {
        Datafile: 'real_permittivity.csv'
      },
      'Loss permittivity': {
        Datafile: 'loss_permittivity.csv'
      },
      'Loss tangent': {
        Datafile: 'tan_delta.csv'
      },
      'Dielectric breakdown strength': {
        Condition: 'AC',
        'Fixed Value': 117.3842,
        Unit: 'kV/mm'
      },
      'Weibull plot': {
        Datafile: 'weibull.csv'
      },
      'Weibull parameter - scale': [
        {
          'Fixed Value': 8.602
        }
      ],
      'Weibull parameter - shape': [
        {
          'Fixed Value': 8.602
        }
      ]
    }
  },
  microstructure: {
    Imagefile: [
      {
        'Microstructure filename': {
          'Datafile name.jpg/png/tif/gif': 'ill_sloth_maitilde-2023-05-08T14:46:50.455Z-001.tif'
        },
        Description: {
          Datafile: '40000x magnification'
        },
        'Microscopy type': {
          Datafile: 'TEM'
        },
        'Image type': {
          Datafile: 'grayscale'
        }
      }
    ],
    'Image dimension': {
      Width: {
        Unit: 'pixel'
      },
      Height: {
        Unit: 'pixel'
      },
      Depth: {
        Unit: 'bit'
      }
    },
    'Sample experimental info': {
      'Sample thickness': {
        'Fixed Value': 50,
        Unit: 'nm'
      }
    }
  }
};

const updatedCuratedXlsxObject = {
  ...mockCuratedXlsxObject,
  'Your Name': 'Uthdev'
};

const createBaseObject = (obj, savedObj) => {
  const newObj = {};
  for (const prop in obj) {
    const propVal = obj[prop];
    if (Array.isArray(propVal?.values)) {
      const objArr = propVal.values.map((obj, i) => createBaseObject(obj, savedObj?.[prop]?.[i]));
      newObj[prop] = objArr;
    } else if (propVal?.value) {
      if (savedObj?.[prop]) {
        newObj[prop] = savedObj[prop];
      } else {
        newObj[prop] = null;
      }
    } else {
      const nestedObj = createBaseObject(propVal, savedObj?.[prop]);

      if (Object.keys(nestedObj).length > 0) {
        newObj[prop] = nestedObj;
      }
    }
  }
  return newObj;
};

const mockBaseObject = createBaseObject(jsonStructure, mockCuratedXlsxObject);

const fetchecdCuratedXlsxObject = {
  object: mockCuratedXlsxObject,
  user: {
    _id: '62f119fb28eedaab012d1262',
    givenName: 'Gbolahan',
    surName: 'Adeleke'
  },
  _id: '642561166202628c4aff8d59',
  createdAt: '2023-03-30T10:14:46.072Z',
  updatedAt: '2023-03-30T10:14:46.072Z',
  __v: 0,
  populate: sinon.stub().resolvesThis()
};

const wrontXlsxFile = [
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
  }
];

const user = {
  _id: 'ai094oja09aw40-o',
  displayName: 'test'
};

module.exports = {
  user,
  correctXlsxFile,
  wrontXlsxFile,
  mockCurationList,
  mockCuratedXlsxObject,
  fetchecdCuratedXlsxObject,
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
  mockJsonStructure4,
  mockUploadedFiles
};
