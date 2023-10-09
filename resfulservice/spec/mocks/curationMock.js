const sinon = require('sinon');
const jsonStructure = require('../../config/xlsx.json');

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
    values: [
      'research article',
      'conference proceedings',
      'communication',
      'review',
      'letter',
      'technical comment'
    ]
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

const mockJsonObject = {
  curatedjsonObject: {
    ID: {
      cellValue: null,
      type: 'String',
      required: false
    },
    Control_ID: {
      cellValue: '12',
      type: 'String',
      required: false
    },
    'DATA ORIGIN': {
      Citation: {
        CommonFields: {
          YourName: {
            cellValue: 'Heybee',
            type: 'String',
            required: false
          },
          YourEmail: {
            cellValue: null,
            type: 'String',
            required: false
          },
          Origin: {
            cellValue: null,
            type: 'List',
            required: false,
            validList: 'origin'
          },
          CitationType: {
            cellValue: null,
            type: 'List',
            required: false,
            validList: 'citation_type'
          },
          PublicationType: {
            cellValue: null,
            type: 'List',
            required: false,
            validList: 'publication_type'
          },
          DOI: {
            cellValue: null,
            type: 'String',
            required: false
          },
          Publication: {
            cellValue: null,
            type: 'String',
            required: false
          },
          Title: {
            cellValue: 'Test title',
            type: 'String',
            required: false
          },
          Author: ['Uzumaki Naruto', 'Uchiha Sasuke', 'Haruno Sakura'],
          Keyword: ['Anime', 'Shounin', 'Naruto'],
          PublicationYear: {
            cellValue: '1992',
            type: 'String',
            required: false
          },
          Volume: {
            cellValue: null,
            type: 'String',
            required: false
          },
          Issue: {
            cellValue: null,
            type: 'String',
            required: false
          },
          URL: {
            cellValue: null,
            type: 'String',
            required: false
          },
          Language: {
            cellValue: null,
            type: 'String',
            required: false
          },
          Location: {
            cellValue: null,
            type: 'String',
            required: false
          },
          DateOfCitation: {
            cellValue: null,
            type: 'String',
            required: false
          },
          LaboratoryDataInfo: {
            DateOfSampleMade: {
              cellValue: null,
              type: 'String',
              required: false
            },
            DateOfDataMeasurement: {
              cellValue: null,
              type: 'String',
              required: false
            },
            RelatedDOI: {
              cellValue: null,
              type: 'String',
              required: false
            }
          }
        }
      }
    },
    PROPERTIES: {
      Electrical: {
        ElectricConductivity: {
          description: {
            cellValue: null,
            type: 'String',
            required: false
          },
          value: {
            cellValue: null,
            type: 'String',
            required: false
          },
          unit: {
            cellValue: null,
            type: 'String',
            required: false
          },
          data: {
            cellValue: null,
            type: 'File',
            required: false
          }
        },
        CurrentDensity: {
          description: {
            cellValue: null,
            type: 'String',
            required: false
          },
          value: {
            cellValue: null,
            type: 'String',
            required: false
          },
          unit: {
            cellValue: null,
            type: 'String',
            required: false
          },
          data: {
            cellValue: null,
            type: 'File',
            required: false
          }
        },
        EnergyDensity: {
          description: {
            cellValue: null,
            type: 'String',
            required: false
          },
          value: {
            cellValue: null,
            type: 'String',
            required: false
          },
          unit: {
            cellValue: null,
            type: 'String',
            required: false
          },
          data: {
            cellValue: null,
            type: 'File',
            required: false
          }
        },
        SurfaceResistivity: {
          description: {
            cellValue: null,
            type: 'String',
            required: false
          },
          value: {
            cellValue: null,
            type: 'String',
            required: false
          },
          unit: {
            cellValue: null,
            type: 'String',
            required: false
          },
          data: {
            cellValue: null,
            type: 'File',
            required: false
          }
        },
        VolumeResistivity: {
          description: {
            cellValue: null,
            type: 'String',
            required: false
          },
          value: {
            cellValue: null,
            type: 'String',
            required: false
          },
          unit: {
            cellValue: null,
            type: 'String',
            required: false
          },
          datafile: {
            cellValue: null,
            type: 'File',
            required: false
          }
        },
        ArcResistance: {
          description: {
            cellValue: null,
            type: 'String',
            required: false
          },
          value: {
            cellValue: null,
            type: 'String',
            required: false
          },
          unit: {
            cellValue: null,
            type: 'String',
            required: false
          },
          datafile: {
            cellValue: null,
            type: 'File',
            required: false
          }
        },
        Impedance: {
          description: {
            cellValue: null,
            type: 'String',
            required: false
          },
          value: {
            cellValue: null,
            type: 'String',
            required: false
          },
          unit: {
            cellValue: null,
            type: 'String',
            required: false
          },
          datafile: {
            cellValue: null,
            type: 'File',
            required: false
          }
        },
        ElectricPercolationThreshold: {
          description: {
            cellValue: null,
            type: 'String',
            required: false
          },
          value: {
            cellValue: null,
            type: 'String',
            required: false
          },
          unit: {
            cellValue: null,
            type: 'String',
            required: false
          },
          data: {
            cellValue: null,
            type: 'File',
            required: false
          }
        },
        DC_DielectricConstant: {
          description: {
            cellValue: null,
            type: 'String',
            required: false
          },
          value: {
            cellValue: null,
            type: 'String',
            required: false
          },
          unit: {
            cellValue: null,
            type: 'String',
            required: false
          },
          data: {
            cellValue: null,
            type: 'File',
            required: false
          }
        },
        AC_DielectricDispersion: {
          Description: {
            cellValue: null,
            type: 'String',
            required: false
          },
          DielectricDispersionDependence: {
            FrequencyDependence: {
              condition: {
                temperature: {
                  description: {
                    cellValue: null,
                    type: 'String',
                    required: false
                  },
                  value: {
                    cellValue: null,
                    type: 'String',
                    required: false
                  },
                  unit: {
                    cellValue: null,
                    type: 'List',
                    required: false,
                    validList:
                      'AC_dielectric_dispersion_#::Test_Conditions_-_Temperature::Unit'
                  },
                  data: {
                    cellValue: null,
                    type: 'File',
                    required: false
                  }
                }
              }
            },
            TemperatureDependence: {
              condition: {
                frequency: {
                  description: {
                    cellValue: null,
                    type: 'String',
                    required: false
                  },
                  value: {
                    cellValue: null,
                    type: 'String',
                    required: false
                  },
                  unit: {
                    cellValue: null,
                    type: 'String',
                    required: false
                  },
                  data: {
                    cellValue: null,
                    type: 'File',
                    required: false
                  }
                }
              }
            }
          },
          Dielectric_Real_Permittivity: {
            description: {
              cellValue: 'Real permittivity',
              type: 'String',
              required: false
            },
            value: {
              cellValue: null,
              type: 'String',
              required: false
            },
            unit: {
              cellValue: null,
              type: 'String',
              required: false
            },
            data: {
              cellValue:
                '/api/files/socialist_scallop_germaine-2023-09-27T15:18:58.422Z-real_permittivity.csv?isStore=true',
              type: 'File',
              required: false
            }
          },
          Dielectric_Loss_Permittivity: {
            description: {
              cellValue: null,
              type: 'String',
              required: false
            },
            value: {
              cellValue: null,
              type: 'String',
              required: false
            },
            unit: {
              cellValue: null,
              type: 'String',
              required: false
            },
            data: {
              cellValue:
                '/api/files/socialist_scallop_germaine-2023-09-27T15:18:58.399Z-loss_permittivity.csv?isStore=true',
              type: 'File',
              required: false
            }
          },
          Dielectric_Loss_Tangent: {
            description: {
              cellValue: null,
              type: 'String',
              required: false
            },
            value: {
              cellValue: null,
              type: 'String',
              required: false
            },
            unit: {
              cellValue: null,
              type: 'String',
              required: false
            },
            data: {
              cellValue: null,
              type: 'File',
              required: false
            }
          }
        },
        DielectricBreakdownStrength: {
          Condition: {
            cellValue: null,
            type: 'List',
            required: false,
            validList:
              'AC_dielectric_dispersion_#::Dielectric_breakdown_strength::Condition'
          },
          Profile: {
            value: {
              cellValue: null,
              type: 'String',
              required: false
            },
            unit: {
              cellValue: null,
              type: 'String',
              required: false
            },
            data: {
              cellValue: null,
              type: 'File',
              required: false
            }
          },
          WeibullPlot: {
            description: {
              cellValue: null,
              type: 'String',
              required: false
            },
            data: {
              cellValue:
                '/api/files/socialist_scallop_germaine-2023-09-27T15:18:58.399Z-loss_permittivity.csv?isStore=true',
              type: 'File',
              required: false
            }
          },
          WeibullParameter: {
            type: 'multiples',
            values: [
              {
                description: {
                  cellValue: 'Weibull parameter description 1',
                  type: 'String',
                  required: false,
                  default: 'scale parameter'
                },
                value: {
                  value: {
                    cellValue: 'Weibull parameter value 1',
                    type: 'String',
                    required: false
                  },
                  unit: {
                    cellValue: 'Weibull parameter unit 1',
                    type: 'String',
                    required: false
                  }
                }
              },
              {
                description: {
                  cellValue: 'Weibull parameter description 2',
                  type: 'String',
                  required: false,
                  default: 'shape parameter'
                },
                value: {
                  value: {
                    cellValue: 'Weibull parameter value 2',
                    type: 'String',
                    required: false
                  },
                  unit: {
                    cellValue: 'Weibull parameter unit 2',
                    type: 'String',
                    required: false
                  }
                }
              }
            ]
          }
        }
      }
    }
  }
};

const mockJsonObjectErrored = {
  curatedjsonObject: {
    ID: {
      cellValue: '1. Data Origin|[4,1]',
      type: 'String',
      required: false
    },
    Control_ID: {
      cellValue: '12',
      type: 'String',
      required: false
    },
    'DATA ORIGIN': {
      Citation: {
        CommonFields: {
          YourName: {
            cellValue: 'Heybee',
            type: 'String',
            required: false
          },
          YourEmail: {
            cellValue: null,
            type: 'String',
            required: true
          },
          Origin: {
            cellValue: null,
            type: 'List',
            required: true,
            validList: 'origin'
          },
          CitationType: {
            cellValue: null,
            type: 'List',
            required: false,
            validList: 'citation_type'
          },
          PublicationType: {
            cellValue: null,
            type: 'List',
            required: false,
            validList: 'publication_type'
          },
          DOI: {
            cellValue: null,
            type: 'String',
            required: false
          },
          Publication: {
            cellValue: null,
            type: 'String',
            required: false
          },
          Title: {
            cellValue: 'Test title',
            type: 'String',
            required: false
          },
          Author: ['sasuke uchiha', 'Haruno sakura', 'uzumaki naruto'],
          Keyword: [],
          PublicationYear: {
            cellValue: 1992,
            type: 'String',
            required: false
          },
          LaboratoryDataInfo: {
            DateOfSampleMade: {
              cellValue: null,
              type: 'String',
              required: false
            },
            DateOfDataMeasurement: {
              cellValue: null,
              type: 'String',
              required: false
            },
            RelatedDOI: {
              cellValue: null,
              type: 'String',
              required: true
            }
          }
        }
      }
    },
    'MATERIAL TYPES': {
      Matrix: {
        MatrixComponent: {
          ChemicalName: {
            cellValue: null,
            type: 'String',
            required: true
          },
          PubChemRef: {
            cellValue: null,
            type: 'String',
            required: true
          },
          Abbreviation: {
            cellValue: null,
            type: 'String',
            required: false
          },
          ConstitutionalUnit: {
            cellValue: null,
            type: 'String',
            required: false
          },
          PlasticType: {
            cellValue: null,
            type: 'List',
            required: false,
            validList: 'Matrix::Polymer_plastic_type::Description'
          },
          PolymerClass: {
            cellValue: null,
            type: 'List',
            required: false,
            validList: 'Matrix::Polymer_class::Description'
          },
          PolymerType: {
            cellValue: null,
            type: 'List',
            required: false,
            validList: 'Matrix::Polymer_type::Description'
          },
          ManufacturerOrSourceName: {
            cellValue: null,
            type: 'String',
            required: false
          },
          TradeName: {
            cellValue: null,
            type: 'String',
            required: false
          },
          MolecularWeight: {
            description: {
              cellValue: null,
              type: 'List',
              required: false,
              validList: 'Matrix::Polymer_molecular_weight::Description'
            },
            value: {
              cellValue: null,
              type: 'String',
              required: false
            },
            unit: {
              cellValue: null,
              type: 'String',
              required: false
            }
          },
          Polydispersity: {
            cellValue: null,
            type: 'String',
            required: false
          },
          Tacticity: {
            cellValue: null,
            type: 'List',
            required: false,
            validList: 'Matrix::Tacticity::Description'
          },
          Density: {
            value: {
              cellValue: null,
              type: 'String',
              required: false
            },
            unit: {
              cellValue: null,
              type: 'List',
              required: false,
              validList: 'Matrix::Density::Unit'
            }
          },
          Viscosity: {
            value: {
              cellValue: null,
              type: 'String',
              required: false
            },
            unit: {
              cellValue: null,
              type: 'String',
              required: false
            }
          },
          Hardener: {
            cellValue: null,
            type: 'String',
            required: false
          },
          Additive: {
            description: {
              cellValue: null,
              type: 'String',
              required: false
            },
            value: {
              cellValue: null,
              type: 'String',
              required: false
            },
            unit: {
              cellValue: null,
              type: 'String',
              required: false
            }
          },
          MatrixComponentComposition: {
            Constituent: {
              cellValue: null,
              type: 'String',
              required: false
            },
            Fraction: {
              mass: {
                cellValue: null,
                type: 'String',
                required: false
              },
              volume: {
                cellValue: null,
                type: 'String',
                required: false
              }
            }
          }
        }
      },
      Filler: {
        FillerComponent: {
          type: 'multiples',
          values: [
            {
              Description: {
                cellValue: null,
                type: 'String',
                required: true
              },
              ChemicalName: {
                cellValue: null,
                type: 'String',
                required: false
              },
              PubChemRef: {
                cellValue: null,
                type: 'String',
                required: false
              },
              Abbreviation: {
                cellValue: null,
                type: 'String',
                required: false
              },
              ManufacturerOrSourceName: {
                cellValue: null,
                type: 'String',
                required: false
              },
              TradeName: {
                cellValue: null,
                type: 'String',
                required: false
              },
              Density: {
                description: {
                  cellValue: null,
                  type: 'String',
                  required: false
                },
                value: {
                  cellValue: null,
                  type: 'String',
                  required: false
                },
                unit: {
                  cellValue: null,
                  type: 'List',
                  required: false,
                  validList: 'Filler::Density::Unit'
                }
              },
              CrystalPhase: {
                cellValue: null,
                type: 'String',
                required: false
              },
              SphericalParticleDiameter: {
                description: {
                  cellValue: null,
                  type: 'String',
                  required: false
                },
                value: {
                  cellValue: null,
                  type: 'String',
                  required: false
                },
                unit: {
                  cellValue: null,
                  type: 'List',
                  required: false,
                  validList: 'Filler::Particle_diameter::Unit'
                },
                StandardDeviation: {
                  cellValue: null,
                  type: 'String',
                  required: false
                }
              },
              SurfaceArea: {
                specific: {
                  description: {
                    cellValue: null,
                    type: 'String',
                    required: false
                  },
                  value: {
                    cellValue: null,
                    type: 'String',
                    required: false
                  },
                  unit: {
                    cellValue: null,
                    type: 'String',
                    required: false
                  }
                },
                total: {
                  description: {
                    cellValue: null,
                    type: 'String',
                    required: false
                  },
                  value: {
                    cellValue: null,
                    type: 'String',
                    required: false
                  },
                  unit: {
                    cellValue: null,
                    type: 'String',
                    required: false
                  }
                }
              },
              ParticleAspectRatio: {
                description: {
                  cellValue: null,
                  type: 'String',
                  required: false
                },
                value: {
                  cellValue: null,
                  type: 'String',
                  required: false
                }
              },
              NonSphericalShape: {
                Width: {
                  description: {
                    cellValue: null,
                    type: 'String',
                    required: false
                  },
                  value: {
                    cellValue: null,
                    type: 'String',
                    required: false
                  },
                  unit: {
                    cellValue: null,
                    type: 'List',
                    required: false,
                    validList: 'Filler::Non_spherical_shape-width::Unit'
                  }
                },
                Length: {
                  description: {
                    cellValue: null,
                    type: 'String',
                    required: false
                  },
                  value: {
                    cellValue: null,
                    type: 'String',
                    required: false
                  },
                  unit: {
                    cellValue: null,
                    type: 'List',
                    required: false,
                    validList: 'Filler::Non_spherical_shape-length::Unit'
                  }
                },
                Depth: {
                  description: {
                    cellValue: null,
                    type: 'String',
                    required: false
                  },
                  value: {
                    cellValue: null,
                    type: 'String',
                    required: false
                  },
                  unit: {
                    cellValue: null,
                    type: 'List',
                    required: false,
                    validList: 'Filler::Non_spherical_shape-depth::Unit'
                  }
                }
              },
              FillerComponentComposition: {
                mass: {
                  cellValue: null,
                  type: 'String',
                  required: false
                },
                volume: {
                  cellValue: null,
                  type: 'String',
                  required: false
                }
              },
              FillerComponentInComposite: {
                mass: {
                  cellValue: null,
                  type: 'List',
                  required: false,
                  validList: 'Filler_Composition::Fraction'
                },
                volume: {
                  cellValue: null,
                  type: 'List',
                  required: false,
                  validList: 'Filler_Composition::Fraction'
                }
              },
              ParticleSurfaceTreatment: {
                type: 'multiples',
                values: [
                  {
                    ChemicalName: {
                      cellValue: null,
                      type: 'String',
                      required: false
                    },
                    Abbreviation: {
                      cellValue: null,
                      type: 'String',
                      required: false
                    },
                    ConstitutionalUnit: {
                      cellValue: null,
                      type: 'String',
                      required: false
                    },
                    ManufacturerOrSourceName: {
                      cellValue: null,
                      type: 'String',
                      required: false
                    },
                    TradeName: {
                      cellValue: null,
                      type: 'String',
                      required: false
                    },
                    Density: {
                      description: {
                        cellValue: null,
                        type: 'String',
                        required: false
                      },
                      value: {
                        cellValue: null,
                        type: 'String',
                        required: false
                      },
                      unit: {
                        cellValue: null,
                        type: 'List',
                        required: false,
                        validList:
                          'Particle_Surface_Treatment::PST_density::Unit'
                      }
                    },
                    GraftDensity: {
                      description: {
                        cellValue: null,
                        type: 'String',
                        required: false
                      },
                      value: {
                        cellValue: null,
                        type: 'String',
                        required: false
                      },
                      unit: {
                        cellValue: null,
                        type: 'String',
                        required: false
                      }
                    },
                    MolecularWeight: {
                      description: {
                        cellValue: null,
                        type: 'String',
                        required: false
                      },
                      value: {
                        cellValue: null,
                        type: 'String',
                        required: false
                      },
                      unit: {
                        cellValue: null,
                        type: 'String',
                        required: false
                      }
                    },
                    PST_Composition: {
                      Constituent: {
                        cellValue: null,
                        type: 'String',
                        required: false
                      },
                      Fraction: {
                        mass: {
                          cellValue: null,
                          type: 'String',
                          required: false
                        },
                        volume: {
                          cellValue: null,
                          type: 'String',
                          required: false
                        }
                      }
                    },
                    SurfaceChemistryProcessing: {
                      ChooseParameter: {
                        type: 'multiples',
                        values: [
                          {
                            Mixing: {
                              Description: {
                                cellValue: null,
                                type: 'String',
                                required: false
                              },
                              Mixer: {
                                value: {
                                  cellValue: null,
                                  type: 'String',
                                  required: false
                                }
                              },
                              MixingMethod: {
                                cellValue: null,
                                type: 'List',
                                required: false,
                                validList:
                                  'Surface_Chemical_Processing::Mixing::Mixing-method::Description/Fixed Value'
                              },
                              RPM: {
                                value: {
                                  cellValue: null,
                                  type: 'String',
                                  required: false
                                },
                                unit: {
                                  cellValue: null,
                                  type: 'String',
                                  required: false
                                }
                              },
                              Time: {
                                value: {
                                  cellValue: null,
                                  type: 'String',
                                  required: false
                                },
                                unit: {
                                  cellValue: null,
                                  type: 'List',
                                  required: false,
                                  validList:
                                    'Surface_Chemical_Processing::Mixing::Mixing-time::Unit'
                                }
                              },
                              Temperature: {
                                value: {
                                  cellValue: null,
                                  type: 'String',
                                  required: false
                                },
                                unit: {
                                  cellValue: null,
                                  type: 'List',
                                  required: false,
                                  validList:
                                    'Surface_Chemical_Processing::Mixing::Mixing-temperature::Unit'
                                }
                              },
                              ChemicalUsed: {
                                type: 'multiples',
                                values: [
                                  {
                                    description: {
                                      cellValue: null,
                                      type: 'String',
                                      required: false
                                    },
                                    value: {
                                      cellValue: null,
                                      type: 'String',
                                      required: false
                                    },
                                    unit: {
                                      cellValue: null,
                                      type: 'String',
                                      required: false
                                    }
                                  },
                                  {
                                    description: {
                                      cellValue: null,
                                      type: 'String',
                                      required: false
                                    },
                                    value: {
                                      cellValue: null,
                                      type: 'String',
                                      required: false
                                    },
                                    unit: {
                                      cellValue: null,
                                      type: 'String',
                                      required: false
                                    }
                                  },
                                  {
                                    description: {
                                      cellValue: null,
                                      type: 'String',
                                      required: false
                                    },
                                    value: {
                                      cellValue: null,
                                      type: 'String',
                                      required: false
                                    },
                                    unit: {
                                      cellValue: null,
                                      type: 'String',
                                      required: false
                                    }
                                  }
                                ],
                                cellValue: null
                              }
                            }
                          },
                          {
                            Cooling: {
                              Description: {
                                cellValue: null,
                                type: 'String',
                                required: false
                              },
                              Temperature: {
                                value: {
                                  cellValue: null,
                                  type: 'String',
                                  required: false
                                },
                                unit: {
                                  cellValue: null,
                                  type: 'List',
                                  required: false,
                                  validList:
                                    'Surface_Chemical_Processing::Cooling::Cooling-temperature::Unit'
                                }
                              },
                              Time: {
                                value: {
                                  cellValue: null,
                                  type: 'String',
                                  required: false
                                },
                                unit: {
                                  cellValue: null,
                                  type: 'List',
                                  required: false,
                                  validList:
                                    'Surface_Chemical_Processing::Cooling::Cooling-time::Unit'
                                }
                              },
                              Pressure: {
                                value: {
                                  cellValue: null,
                                  type: 'String',
                                  required: false
                                },
                                unit: {
                                  cellValue: null,
                                  type: 'List',
                                  required: false,
                                  validList:
                                    'Surface_Chemical_Processing::Cooling::Cooling-pressure::Unit'
                                }
                              },
                              AmbientCondition: {
                                cellValue: null,
                                type: 'List',
                                required: false,
                                validList:
                                  'Surface_Chemical_Processing::Cooling::Cooling-ambient_condition::Mode'
                              }
                            }
                          },
                          {
                            'Drying-Evaporation': {
                              Description: {
                                cellValue: null,
                                type: 'String',
                                required: false
                              },
                              Temperature: {
                                value: {
                                  cellValue: null,
                                  type: 'String',
                                  required: false
                                },
                                unit: {
                                  cellValue: null,
                                  type: 'List',
                                  required: false,
                                  validList:
                                    'Surface_Chemical_Processing::Drying/Evaporation::Drying/Evaporation-temperature::Unit'
                                }
                              },
                              Time: {
                                value: {
                                  cellValue: null,
                                  type: 'String',
                                  required: false
                                },
                                unit: {
                                  cellValue: null,
                                  type: 'List',
                                  required: false,
                                  validList:
                                    'Surface_Chemical_Processing::Drying/Evaporation::Drying/Evaporation-time::Unit'
                                }
                              },
                              Pressure: {
                                value: {
                                  cellValue: null,
                                  type: 'String',
                                  required: false
                                },
                                unit: {
                                  cellValue: null,
                                  type: 'List',
                                  required: false,
                                  validList:
                                    'Surface_Chemical_Processing::Drying/Evaporation::Drying/Evaporation-pressure::Unit'
                                }
                              },
                              AmbientCondition: {
                                cellValue: null,
                                type: 'List',
                                required: false,
                                validList:
                                  'Surface_Chemical_Processing::Drying/Evaporation::Drying/Evaporation-ambient_condition::Mode'
                              }
                            }
                          },
                          {
                            Solvent: {
                              SolventName: {
                                cellValue: null,
                                type: 'String',
                                required: false
                              },
                              SolventAmount: {
                                value: {
                                  cellValue: null,
                                  type: 'String',
                                  required: false
                                },
                                unit: {
                                  cellValue: null,
                                  type: 'String',
                                  required: false
                                }
                              }
                            }
                          },
                          {
                            Centrifugation: {
                              cellValue: null,
                              type: 'List',
                              required: false,
                              validList:
                                'Surface_Chemical_Processing::Centrifugation::Name'
                            }
                          },
                          {
                            Other: {
                              cellValue: null,
                              type: 'String',
                              required: false
                            }
                          }
                        ],
                        cellValue: null
                      }
                    }
                  }
                ],
                cellValue: null
              }
            }
          ],
          cellValue: null
        }
      }
    },
    'SYNTHESIS AND PROCESSING': {
      ExperimentalProcedure: {
        cellValue: null,
        type: 'String',
        required: false
      },
      ProcessingMethod: {
        type: 'varied_multiples',
        cellValue: 'MeltMixing',
        required: true,
        validList: 'Synthesis_and_Processing::Processing_method',
        values: [
          {
            ChooseParameter: {
              type: 'multiples',
              values: [
                {
                  Mixing: {
                    Description: {
                      cellValue: null,
                      type: 'String',
                      required: true
                    },
                    Mixer: {
                      value: {
                        cellValue: null,
                        type: 'String',
                        required: false
                      }
                    },
                    MixingMethod: {
                      cellValue: null,
                      type: 'List',
                      required: false,
                      validList:
                        'Synthesis_and_Processing::Mixing::Mixing-method::Description/Fixed Value'
                    },
                    RPM: {
                      value: {
                        cellValue: null,
                        type: 'String',
                        required: false
                      },
                      unit: {
                        cellValue: null,
                        type: 'String',
                        required: false
                      }
                    },
                    Time: {
                      value: {
                        cellValue: null,
                        type: 'String',
                        required: false
                      },
                      unit: {
                        cellValue: null,
                        type: 'List',
                        required: false,
                        validList:
                          'Synthesis_and_Processing::Mixing::Mixing-time::Unit'
                      }
                    },
                    Temperature: {
                      value: {
                        cellValue: null,
                        type: 'String',
                        required: false
                      },
                      unit: {
                        cellValue: null,
                        type: 'List',
                        required: false,
                        validList:
                          'Synthesis_and_Processing::Mixing::Mixing-temperature::Unit'
                      }
                    },
                    ChemicalUsed: {
                      type: 'multiples',
                      values: [
                        {
                          description: {
                            cellValue: null,
                            type: 'String',
                            required: false
                          },
                          value: {
                            cellValue: null,
                            type: 'String',
                            required: false
                          },
                          unit: {
                            cellValue: null,
                            type: 'String',
                            required: false
                          }
                        }
                      ]
                    }
                  }
                }
              ]
            }
          }
        ]
      }
    },
    MICROSTRUCTURE: {
      ImageFile: {
        type: 'multiples',
        values: [
          {
            File: {
              cellValue: null,
              type: 'File',
              required: true,
              validTypes: ['jpg', 'png', 'gif']
            },
            Description: {
              cellValue: null,
              type: 'String'
            },
            MicroscopyType: {
              cellValue: null,
              type: 'List',
              required: false,
              validList: 'Imagefile::Microscopy_type::Datafile'
            },
            Type: {
              cellValue: null,
              type: 'List',
              required: false,
              validList: 'Imagefile::Image_type::Datafile'
            },
            Dimension: {
              width: {
                cellValue: null,
                type: 'String'
              },
              height: {
                cellValue: null,
                type: 'String'
              },
              depth: {
                cellValue: null,
                type: 'String'
              }
            },
            ImagePreProcessing: {
              value: {
                cellValue: null,
                type: 'String'
              }
            }
          }
        ],
        cellValue: null
      },
      Experimental_Sample_Info: {
        SampleSize: {
          value: {
            cellValue: null,
            type: 'String'
          },
          unit: {
            cellValue: null,
            type: 'List',
            required: false,
            validList: 'Sample_experimental_info::Sample_size::Unit'
          }
        },
        SampleThickness: {
          value: {
            cellValue: null,
            type: 'String'
          },
          unit: {
            cellValue: null,
            type: 'List',
            required: false,
            validList: 'Sample_experimental_info::Sample_thickness::Unit'
          }
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
                    validList:
                      'Synthesis_and_Processing::Mixing::Mixing-method::Description/Fixed Value'
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
                    validList:
                      'Synthesis_and_Processing::Mixing::Mixing-time::Unit'
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
                    validList:
                      'Synthesis_and_Processing::Mixing::Mixing-temperature::Unit'
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
  ['Without DOI yet? Please fill out the following info.', null, null, null],
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
  ['Location', null, 'please put first author\'s major affiliation here', null],
  ['Date of citation', null, 'mm/dd/yyyy', null],
  [null, null, null, null],
  [
    'If lab generated, please fill in the lab data info below:',
    null,
    null,
    null
  ],
  ['Laboratory Data Info', null, null, null],
  ['Date of Sample Made', '2023-03-23T00:00:00.000Z', 'mm/dd/yyyy', null],
  ['Date of Data Measurement', '2023-03-23T00:00:00.000Z', 'mm/dd/yyyy', null],
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
  ['Without DOI yet? Please fill out the following info.', null, null, null],
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
  ['Location', null, 'please put first author\'s major affiliation here', null],
  ['Date of citation', null, 'mm/dd/yyyy', null],
  [null, null, null, null],
  [
    'If lab generated, please fill in the lab data info below:',
    null,
    null,
    null
  ],
  ['Laboratory Data Info', null, null, null],
  ['Date of Sample Made', '2023-03-23T00:00:00.000Z', 'mm/dd/yyyy', null],
  ['Date of Data Measurement', '2023-03-23T00:00:00.000Z', 'mm/dd/yyyy', null],
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
  [null, null, null, null, null, 'Processing method', null, null, null],
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
  ['Mixing - method', 'dissolving', null, null, null, null, null, null, null],
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
  [null, 'Name', 'Value', 'Unit', null, 'Cooling - time', null, null, null],
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
  [null, null, null, null, null, null, 'Mode', null, null]
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
            Description:
              '16 ml of MEK-ST (Nissan) was taken in a flask along with 50 ml of THF and 0.5 ml of the silane coupling agent. The solution was stirred and refluxed at 70°C under an inert N2 atmosphere for 24 hours.',
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
            Description:
              'THF was reduced to 20 ml in a rotor evaporator in order to reduce the amount of needed hexane.'
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
          Other:
            'The mixture was precipitated in 200 ml of hexane. The particles were then centrifuged at 10,000 rpm for 10 min at 10 deg C.'
        }
      ]
    }
  },
  PROCESSING: {
    ExperimentalProcedure:
      'Sample mixing at 50 RPM, specific energy input 500 kJ/kg'
  },
  CHARACTERIZATION: {
    Microscopy: {
      Transmission_Electron_Microscopy: {
        EquipmentUsed: 'JEOL-2010',
        Description:
          'To observe the dispersion of the nanoparticles in the polymer matrix, the materials were embedded in an epoxy matrix and slices of *50 nm were sectioned at room temperature in an ultramicrotome using a diamond knife. The sections were collected on a copper grid and imaged in a JEOL-2010 transmission electron microscope (TEM).',
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

const mockBaseObject = {
  ID: 'S10',
  Control_ID: 'S28',
  DATA_SOURCE: {
    Citation: {
      CommonFields: {
        YourName: null,
        YourEmail: null,
        Origin: null,
        CitationType: null,
        PublicationType: null,
        DOI: null,
        Publication: null,
        Title: null,
        Author: [
          {
            Author: null
          },
          {
            Author: null
          }
        ],
        Keyword: [
          {
            Keyword: null
          },
          {
            Keyword: null
          }
        ],
        PublicationYear: null,
        Volume: null,
        Issue: null,
        URL: null,
        Language: null,
        Location: null,
        DateOfCitation: null,
        LaboratoryDataInfo: {
          DateOfSampleMade: null,
          DateOfDataMeasurement: null,
          RelatedDOI: null
        },
        ComputationalDataInfo: {
          DateOfSimulationRun: null,
          DataOwner: null,
          RelatedDOI: null,
          NumberOfCPUs: null,
          ComputationalTime: null
        }
      }
    }
  },
  MATERIALS: {
    Matrix: {
      MatrixComponent: {
        ChemicalName: null,
        PubChemRef: null,
        Abbreviation: null,
        ConstitutionalUnit: null,
        PlasticType: null,
        PolymerClass: null,
        PolymerType: null,
        ManufacturerOrSourceName: null,
        TradeName: null,
        MolecularWeight: {
          description: null,
          value: null,
          unit: null
        },
        Polydispersity: null,
        Tacticity: null,
        Density: {
          value: null,
          unit: null
        },
        Viscosity: {
          value: null,
          unit: null
        },
        Hardener: null,
        Additive: {
          description: null,
          value: null,
          unit: null
        },
        MatrixComponentComposition: {
          Constituent: null,
          Fraction: {
            mass: null,
            volume: null
          }
        }
      }
    },
    Filler: {
      FillerComponent: [
        {
          Description: null,
          ChemicalName: null,
          PubChemRef: null,
          Abbreviation: null,
          ManufacturerOrSourceName: null,
          TradeName: null,
          Density: {
            description: null,
            value: null,
            unit: null
          },
          CrystalPhase: null,
          SphericalParticleDiameter: {
            description: null,
            value: null,
            unit: null,
            StandardDeviation: null
          },
          SurfaceArea: {
            specific: {
              description: null,
              value: null,
              unit: null
            },
            total: {
              description: null,
              value: null,
              unit: null
            }
          },
          ParticleAspectRatio: {
            description: null,
            value: null
          },
          NonSphericalShape: {
            Width: {
              description: null,
              value: null,
              unit: null
            },
            Length: {
              description: null,
              value: null,
              unit: null
            },
            Depth: {
              description: null,
              value: null,
              unit: null
            }
          },
          FillerComponentComposition: {
            mass: null,
            volume: null
          },
          FillerComponentInComposite: {
            mass: null,
            volume: null
          },
          ParticleSurfaceTreatment: [
            {
              ChemicalName: null,
              Abbreviation: null,
              ConstitutionalUnit: null,
              ManufacturerOrSourceName: null,
              TradeName: null,
              Density: {
                description: null,
                value: null,
                unit: null
              },
              GraftDensity: {
                description: null,
                value: null,
                unit: null
              },
              MolecularWeight: {
                description: null,
                value: null,
                unit: null
              },
              PST_Composition: {
                Constituent: null,
                Fraction: {
                  mass: null,
                  volume: null
                }
              },
              SurfaceChemistryProcessing: {
                ChooseParameter: [
                  {
                    Mixing: {
                      Description: null,
                      Mixer: {
                        value: null
                      },
                      MixingMethod: null,
                      RPM: {
                        value: null,
                        unit: null
                      },
                      Time: {
                        value: null,
                        unit: null
                      },
                      Temperature: {
                        value: null,
                        unit: null
                      },
                      ChemicalUsed: [
                        {
                          description: null,
                          value: null,
                          unit: null
                        },
                        {
                          description: null,
                          value: null,
                          unit: null
                        },
                        {
                          description: null,
                          value: null,
                          unit: null
                        }
                      ]
                    }
                  },
                  {
                    Cooling: {
                      Description: null,
                      Temperature: {
                        value: null,
                        unit: null
                      },
                      Time: {
                        value: null,
                        unit: null
                      },
                      Pressure: {
                        value: null,
                        unit: null
                      },
                      AmbientCondition: null
                    }
                  },
                  {
                    'Drying-Evaporation': {
                      Description: null,
                      Temperature: {
                        value: null,
                        unit: null
                      },
                      Time: {
                        value: null,
                        unit: null
                      },
                      Pressure: {
                        value: null,
                        unit: null
                      },
                      AmbientCondition: null
                    }
                  },
                  {
                    Solvent: {
                      SolventName: null,
                      SolventAmount: {
                        value: null,
                        unit: null
                      }
                    }
                  },
                  {
                    Centrifugation: null
                  },
                  {
                    Other: null
                  }
                ]
              }
            }
          ]
        }
      ]
    }
  },
  PROCESSING: {
    ExperimentalProcedure: null,
    ProcessingMethod: [
      {
        ChooseParameter: [
          {
            Mixing: {
              Description: null,
              Mixer: null,
              MixingMethod: null,
              RPM: {
                value: null,
                unit: null
              },
              Time: {
                value: null,
                unit: null
              },
              Temperature: {
                value: null,
                unit: null
              },
              ChemicalUsed: [
                {
                  description: null,
                  value: null,
                  unit: null
                }
              ]
            }
          },
          {
            'Drying-Evaporation': {
              Description: null,
              Temperature: {
                value: null,
                unit: null
              },
              Time: {
                value: null,
                unit: null
              },
              Pressure: {
                value: null,
                unit: null
              },
              AmbientCondition: null
            }
          },
          {
            Other: null
          },
          {
            Extrusion: {
              SingleScrewExtrusion: {
                Extruder: null,
                ResidenceTime: {
                  value: null,
                  unit: null
                },
                ExtrusionTemperature: {
                  value: null,
                  unit: null
                },
                ScrewDiameter: {
                  value: null,
                  unit: null
                },
                InnerBarrelDiameter: {
                  value: null,
                  unit: null
                },
                ScrewLength: {
                  value: null,
                  unit: null
                },
                D_L_ratio: null,
                RadialFlightClearance: {
                  value: null,
                  unit: null
                },
                FlightWidth: {
                  value: null,
                  unit: null
                },
                ChannelDepth: {
                  value: null,
                  unit: null
                },
                ScrewLead: {
                  value: null,
                  unit: null
                },
                NumberOfChannelsPerScrew: {
                  value: null
                },
                ScrewChannelWidth: {
                  value: null,
                  unit: null
                },
                HeatingZone: [
                  {
                    heatingZoneNumber: {
                      value: null
                    },
                    lengthOfHeatingZone: {
                      value: null,
                      unit: null
                    },
                    barrelTemperature: {
                      value: null,
                      unit: null
                    }
                  }
                ],
                DieDiameter: {
                  value: null,
                  unit: null
                },
                RotationSpeed: {
                  value: null,
                  unit: null
                },
                BarrelTemperature: {
                  value: null,
                  unit: null
                },
                Output: {
                  MeltTemperature: {
                    value: null,
                    unit: null
                  },
                  PressureAtDie: {
                    value: null,
                    unit: null
                  },
                  Torque: {
                    value: null,
                    unit: null
                  },
                  Amperage: {
                    value: null,
                    unit: null
                  },
                  Voltage: {
                    value: null,
                    unit: null
                  },
                  Power: {
                    value: null,
                    unit: null
                  },
                  ThroughPut: {
                    value: null,
                    unit: null
                  },
                  ResidenceTime: {
                    value: null,
                    unit: null
                  }
                }
              }
            }
          },
          {
            Extrusion: {
              TwinScrewExtrusion: {
                Extruder: null,
                ResidenceTime: {
                  value: null,
                  unit: null
                },
                ExtrusionTemperature: {
                  value: null,
                  unit: null
                },
                RotationMode: {
                  value: null
                },
                ScrewDiameter: {
                  value: null,
                  unit: null
                },
                ScrewChannelDiameter: {
                  value: null,
                  unit: null
                },
                D_L_ratio: null,
                FlightClearance: {
                  value: null,
                  unit: null
                },
                FlightWidth: {
                  value: null,
                  unit: null
                },
                HeatingZone: [
                  {
                    heatingZoneNumber: {
                      value: null
                    },
                    lengthOfHeatingZone: {
                      value: null,
                      unit: null
                    },
                    barrelTemperature: {
                      value: null,
                      unit: null
                    }
                  }
                ],
                DieDiameter: {
                  value: null,
                  unit: null
                },
                RotationSpeed: {
                  value: null
                },
                Output: {
                  MeltTemperature: {
                    value: null,
                    unit: null
                  },
                  PressureAtDie: {
                    value: null,
                    unit: null
                  },
                  Torque: {
                    value: null,
                    unit: null
                  },
                  Amperage: {
                    value: null,
                    unit: null
                  },
                  Voltage: {
                    value: null,
                    unit: null
                  },
                  Power: {
                    value: null,
                    unit: null
                  },
                  ThroughPut: {
                    value: null,
                    unit: null
                  },
                  ResidenceTime: {
                    value: null,
                    unit: null
                  }
                }
              }
            }
          }
        ]
      }
    ]
  },
  CHARACTERIZATION: {
    Microscopy: {
      Transmission_Electron_Microscopy: {
        EquipmentUsed: null,
        Description: null,
        Magnification: {
          description: null,
          value: null,
          unit: null,
          uncertainty: {
            uncertaintytype: null,
            value: null
          },
          datafile: null
        },
        AcceleratingVoltage: {
          description: null,
          value: null,
          unit: null,
          uncertainty: {
            uncertaintytype: null,
            value: null
          },
          datafile: null
        },
        EmissionCurrent: {
          description: null,
          value: null,
          unit: null,
          uncertainty: {
            uncertaintytype: null,
            value: null
          },
          datafile: null
        },
        WorkingDistance: {
          description: null,
          value: null,
          unit: null,
          uncertainty: {
            uncertaintytype: null,
            value: null
          }
        },
        ExposureTime: {
          value: null,
          unit: null,
          uncertainty: {
            uncertaintytype: null,
            value: null
          },
          datafile: null
        }
      },
      Scanning_Electron_Microscopy: {
        EquipmenUsed: null,
        Description: null,
        Magnification: {
          description: null,
          value: null,
          unit: null,
          uncertainty: {
            uncertaintytype: null,
            value: null
          },
          datafile: null
        },
        AcceleratingVoltage: {
          description: null,
          value: null,
          unit: null,
          uncertainty: {
            uncertaintytype: null,
            value: null
          },
          datafile: null
        },
        EmissionCurrent: {
          description: null,
          value: null,
          unit: null,
          uncertainty: {
            uncertaintytype: null,
            value: null
          },
          datafile: null
        },
        WorkingDistance: {
          description: null,
          value: null,
          unit: null,
          uncertainty: {
            uncertaintytype: null,
            value: null
          }
        },
        ExposureTime: {
          value: null,
          unit: null,
          uncertainty: {
            uncertaintytype: null,
            value: null
          },
          datafile: null
        }
      },
      Atomic_Force_Microscopy: {
        Equipment: null,
        Description: null,
        data: {
          description: null,
          value: null,
          unit: null,
          uncertainty: {
            uncertaintytype: null,
            value: null
          },
          datafile: null
        }
      },
      OpticalMicroscopy: {
        Equipment: null,
        Description: null,
        data: {
          description: null,
          value: null,
          unit: null,
          uncertainty: {
            uncertaintytype: null,
            value: null
          },
          datafile: null
        }
      }
    },
    Spectroscopy: {
      Fourier_Transform_Infrared_Spectroscopy: {
        Equipment: null,
        Description: null,
        data: {
          description: null,
          value: null,
          unit: null,
          uncertainty: {
            uncertaintytype: null,
            value: null
          },
          datafile: null
        }
      },
      Dielectric_and_Impedance_Spectroscopy_Analysis: {
        Equipment: null,
        Description: null,
        data: {
          description: null,
          value: null,
          unit: null,
          uncertainty: {
            uncertaintytype: null,
            value: null
          },
          datafile: null
        }
      },
      Raman_Spectroscopy: {
        Equipment: null,
        Description: null,
        data: {
          description: null,
          value: null,
          unit: null,
          uncertainty: {
            uncertaintytype: null,
            value: null
          },
          datafile: null
        }
      },
      XRay_Photoelectron_Spectroscopy: {
        Equipment: null,
        Description: null,
        data: {
          description: null,
          value: null,
          unit: null,
          uncertainty: {
            uncertaintytype: null,
            value: null
          },
          datafile: null
        }
      },
      Nuclear_Magnetic_Resonance: {
        Equipment: null,
        Description: null,
        data: {
          description: null,
          value: null,
          unit: null,
          uncertainty: {
            uncertaintytype: null,
            value: null
          },
          datafile: null
        }
      }
    },
    Thermochemical: {
      Differential_Scanning_Calorimetry: {
        Equipment: null,
        Description: null,
        HeatingRate: {
          description: null,
          value: null,
          unit: null,
          uncertainty: {
            uncertaintytype: null,
            value: null
          },
          datafile: null
        },
        CoolingRate: {
          description: null,
          value: null,
          unit: null,
          uncertainty: {
            uncertaintytype: null,
            value: null
          },
          datafile: null
        },
        CycleInformation: null,
        data: {
          description: null,
          value: null,
          unit: null,
          uncertainty: {
            uncertaintytype: null,
            value: null
          },
          datafile: null
        }
      },
      Thermogravimetric_Analysis: {
        Equipment: null,
        Description: null,
        data: {
          description: null,
          value: null,
          unit: null,
          uncertainty: {
            uncertaintytype: null,
            value: null
          },
          datafile: null
        }
      },
      Dynamic_Mechanical_Analysis: {
        Equipment: null,
        Description: null,
        data: {
          description: null,
          value: null,
          unit: null,
          uncertainty: {
            uncertaintytype: null,
            value: null
          },
          datafile: null
        }
      }
    },
    Scattering_And_Diffraction: {
      XRay_Diffraction_and_Scattering: {
        Equipment: null,
        Description: null,
        data: {
          description: null,
          value: null,
          unit: null,
          uncertainty: {
            uncertaintytype: null,
            value: null
          },
          datafile: null
        }
      }
    },
    Others: {
      Pulsed_Electro_Acoustic: {
        Equipment: null,
        Description: null,
        data: {
          description: null,
          value: null,
          unit: null,
          uncertainty: {
            uncertaintytype: null,
            value: null
          },
          datafile: null
        }
      },
      Rheometery: {
        RheometerType: null,
        Description: null,
        CapillarySize: null,
        data: {
          description: null,
          value: null,
          unit: null,
          uncertainty: {
            uncertaintytype: null,
            value: null
          },
          datafile: null
        }
      },
      Electrometry: {
        Equipment: null,
        Description: null,
        data: {
          description: null,
          value: null,
          unit: null,
          uncertainty: {
            uncertaintytype: null,
            value: null
          },
          datafile: null
        }
      }
    }
  },
  PROPERTIES: {
    Mechanical: {
      Tensile: {
        TensileModulus: {
          description: null,
          value: null,
          unit: null,
          uncertainty: {
            uncertaintytype: null,
            value: null
          },
          data: null
        },
        TensileStressAtBreak: {
          description: null,
          value: null,
          unit: null,
          uncertainty: {
            uncertaintytype: null,
            value: null
          },
          data: null
        },
        TensileStressAtYield: {
          description: null,
          value: null,
          unit: null,
          uncertainty: {
            uncertaintytype: null,
            value: null
          },
          data: null
        },
        TensileStrength: {
          description: null,
          value: null,
          unit: null,
          uncertainty: {
            uncertaintytype: null,
            value: null
          },
          data: null
        },
        TensileToughness: {
          description: null,
          value: null,
          unit: null,
          uncertainty: {
            uncertaintytype: null,
            value: null
          },
          data: null
        },
        StrainAtBreak: {
          description: null,
          value: null,
          unit: null,
          uncertainty: {
            uncertaintytype: null,
            value: null
          },
          data: null
        },
        ElongationAtBreak: {
          description: null,
          value: null,
          unit: null,
          uncertainty: {
            uncertaintytype: null,
            value: null
          },
          data: null
        },
        ElongationAtYield: {
          description: null,
          value: null,
          unit: null,
          uncertainty: {
            uncertaintytype: null,
            value: null
          },
          data: null
        },
        FiberTensileModulus: {
          description: null,
          value: null,
          unit: null,
          uncertainty: {
            uncertaintytype: null,
            value: null
          },
          data: null
        },
        FiberTensileStrength: {
          description: null,
          value: null,
          unit: null,
          uncertainty: {
            uncertaintytype: null,
            value: null
          },
          data: null
        },
        FiberTensileElongation: {
          description: null,
          value: null,
          unit: null,
          uncertainty: {
            uncertaintytype: null,
            value: null
          },
          data: null
        },
        PoissonsRatio: {
          value: null
        },
        Conditions: {
          StrainRate: {
            description: null,
            value: null,
            unit: null,
            uncertainty: {
              uncertaintytype: null,
              value: null
            },
            data: null
          },
          PreLoad: {
            description: null,
            value: null,
            unit: null,
            uncertainty: {
              uncertaintytype: null,
              value: null
            },
            data: null
          }
        },
        StressRelaxation: {
          description: null
        },
        LoadingProfile: {
          description: null
        }
      },
      Flexural: {
        FlexuralModulus: {
          description: null,
          value: null,
          unit: null,
          uncertainty: {
            uncertaintytype: null,
            value: null
          },
          data: null
        },
        FlexuralStressAtBreak: {
          description: null,
          value: null,
          unit: null,
          uncertainty: {
            uncertaintytype: null,
            value: null
          },
          data: null
        },
        FlexuralStressAtYield: {
          description: null,
          value: null,
          unit: null,
          uncertainty: {
            uncertaintytype: null,
            value: null
          },
          data: null
        },
        FlexuralToughness: {
          description: null,
          value: null,
          unit: null,
          uncertainty: {
            uncertaintytype: null,
            value: null
          },
          data: null
        },
        Conditions: {
          StrainRate: {
            description: null,
            value: null,
            unit: null,
            uncertainty: {
              uncertaintytype: null,
              value: null
            },
            data: null
          },
          PreLoad: {
            description: null,
            value: null,
            unit: null,
            uncertainty: {
              uncertaintytype: null,
              value: null
            },
            data: null
          }
        },
        LoadingProfile: {
          description: null
        }
      },
      Compression: {
        CompressionModulus: {
          description: null,
          value: null,
          unit: null,
          uncertainty: {
            uncertaintytype: null,
            value: null
          },
          data: null
        },
        CompressionStressAtBreak: {
          description: null,
          value: null,
          unit: null,
          uncertainty: {
            uncertaintytype: null,
            value: null
          },
          data: null
        },
        CompressionStressAtYield: {
          description: null,
          value: null,
          unit: null,
          uncertainty: {
            uncertaintytype: null,
            value: null
          },
          data: null
        },
        CompressiveToughness: {
          description: null,
          value: null,
          unit: null,
          uncertainty: {
            uncertaintytype: null,
            value: null
          },
          data: null
        },
        Conditions: {
          StrainRate: {
            description: null,
            value: null,
            unit: null,
            uncertainty: {
              uncertaintytype: null,
              value: null
            },
            data: null
          },
          Preload: {
            description: null,
            value: null,
            unit: null,
            uncertainty: {
              uncertaintytype: null,
              value: null
            },
            data: null
          }
        },
        LoadingProfile: {
          description: null
        }
      },
      Shear: {
        ShearModulus: {
          description: null,
          value: null,
          unit: null,
          uncertainty: {
            uncertaintytype: null,
            value: null
          },
          data: null
        },
        ShearStressAtBreak: {
          description: null,
          value: null,
          unit: null,
          uncertainty: {
            uncertaintytype: null,
            value: null
          },
          data: null
        },
        ShearStressAtYield: {
          description: null,
          value: null,
          unit: null,
          uncertainty: {
            uncertaintytype: null,
            value: null
          },
          data: null
        },
        Conditions: {
          StrainRate: {
            description: null,
            value: null,
            unit: null,
            uncertainty: {
              uncertaintytype: null,
              value: null
            },
            data: null
          },
          Preload: {
            description: null,
            value: null,
            unit: null,
            uncertainty: {
              uncertaintytype: null,
              value: null
            },
            data: null
          }
        },
        LoadingProfile: {
          description: null
        }
      },
      FractureToughness: {
        EssentialWorkOfFracture: {
          preCrackingProcess: null,
          strainRate: {
            description: null,
            value: null,
            unit: null,
            uncertainty: {
              uncertaintytype: null,
              value: null
            },
            data: null
          },
          FractureEnergy: {
            description: null,
            value: null,
            unit: null,
            uncertainty: {
              uncertaintytype: null,
              value: null
            },
            data: null
          }
        },
        LinearElastic: {
          sampleShape: null,
          preCrackingProcess: null,
          strainRate: {
            description: null,
            value: null,
            unit: null,
            uncertainty: {
              uncertaintytype: null,
              value: null
            },
            data: null
          },
          FractureEnergy: {
            description: null,
            value: {
              value: null,
              unit: null
            },
            uncertainty: {
              uncertaintytype: null,
              value: null
            },
            datafile: null
          },
          'K-factor': null,
          profile: {
            description: null
          }
        },
        PlasticElastic: {
          sampleShape: null,
          preCrackingProcess: null,
          strainRate: {
            description: null,
            value: null,
            unit: null,
            uncertainty: {
              uncertaintytype: null,
              value: null
            },
            data: null
          },
          FractureEnergy: {
            description: null,
            value: null,
            unit: null,
            uncertainty: {
              uncertaintytype: null,
              value: null
            },
            data: null
          },
          'J-integral': null,
          profile: null
        }
      },
      Impact: {
        Notch: null,
        IZOD_Area: {
          description: null,
          value: null,
          unit: null,
          uncertainty: {
            uncertaintytype: null,
            value: null
          },
          data: null
        },
        IZOD_ImpactEnergy: {
          description: null,
          value: null,
          unit: null,
          uncertainty: {
            uncertaintytype: null,
            value: null
          },
          data: null
        },
        CharpyImpactEnergy: {
          description: null,
          value: null,
          unit: null,
          uncertainty: {
            uncertaintytype: null,
            value: null
          },
          data: null
        },
        ImpactToughness: {
          description: null,
          value: null,
          unit: null,
          uncertainty: {
            uncertaintytype: null,
            value: null
          },
          data: null
        }
      },
      Hardness: {
        HardnessTestStandard: null,
        HardnessScale: null,
        HardnessValue: {
          description: null,
          value: null,
          unit: null,
          uncertainty: {
            uncertaintytype: null,
            value: null
          },
          data: null
        }
      }
    },
    Viscoelastic: {
      DynamicProperties: {
        Description: null,
        MeasurementMode: null,
        MeasurementMethod: null,
        DMA_mode: {
          FrequencySweep: {
            condition: {
              temperature: {
                description: null,
                value: null,
                unit: null
              },
              strainAmplitude: {
                description: null,
                value: {
                  value: null,
                  unit: null
                }
              }
            }
          },
          TemperatureSweep: {
            condition: {
              frequency: {
                description: null,
                value: null,
                unit: null
              },
              strainAmplitude: {
                description: null,
                value: {
                  value: null,
                  unit: null
                }
              }
            }
          },
          StrainSweep: {
            condition: {
              frequency: {
                description: null,
                value: null,
                unit: null
              },
              temperature: {
                description: null,
                value: null,
                unit: null
              }
            }
          }
        },
        MasterCurve: {
          description: null,
          data: null
        },
        DMA_Datafile: [
          {
            description: null,
            data: null
          },
          {
            description: null,
            data: null
          }
        ]
      },
      Creep: {
        Compressive: {
          CompressiveCreepRuptureStrength: {
            description: null,
            value: null,
            unit: null,
            uncertainty: {
              uncertaintytype: null,
              value: null
            },
            data: null
          },
          CompressiveCreepRuptureTime: {
            value: null,
            unit: null,
            uncertainty: {
              uncertaintytype: null,
              value: null
            },
            data: null
          },
          CompressiveCreepStrain: {
            description: null,
            value: null,
            unit: null,
            uncertainty: {
              uncertaintytype: null,
              value: null
            },
            data: null
          }
        },
        Tensile: {
          TensileCreepRecovery: null,
          TensileCreepModulus: {
            description: null,
            value: null,
            unit: null,
            uncertainty: {
              uncertaintytype: null,
              value: null
            },
            data: null
          },
          TensileCreepCompliance: {
            description: null,
            value: null,
            unit: null,
            uncertainty: {
              uncertaintytype: null,
              value: null
            },
            data: null
          },
          TensileCreepRuptureStrength: {
            description: null,
            value: null,
            unit: null,
            uncertainty: {
              uncertaintytype: null,
              value: null
            },
            data: null
          },
          TensileCreepRuptureTime: {
            value: null,
            unit: null,
            uncertainty: {
              uncertaintytype: null,
              value: null
            },
            data: null
          },
          TensileCreepStrain: {
            description: null,
            value: null,
            unit: null,
            uncertainty: {
              uncertaintytype: null,
              value: null
            },
            data: null
          }
        },
        Flexural: {
          FlexuralCreepRuptureStrength: {
            description: null,
            value: null,
            unit: null,
            uncertainty: {
              uncertaintytype: null,
              value: null
            },
            data: null
          },
          FlexuralCreepRuptureTime: {
            value: null,
            unit: null,
            uncertainty: {
              uncertaintytype: null,
              value: null
            },
            data: null
          },
          FlexuralCreepStrain: {
            description: null,
            value: null,
            unit: null,
            uncertainty: {
              uncertaintytype: null,
              value: null
            },
            data: null
          }
        }
      }
    },
    Electrical: {
      ElectricConductivity: {
        description: null,
        value: null,
        unit: null,
        data: null
      },
      CurrentDensity: {
        description: null,
        value: null,
        unit: null,
        data: null
      },
      EnergyDensity: {
        description: null,
        value: null,
        unit: null,
        data: null
      },
      SurfaceResistivity: {
        description: null,
        value: null,
        unit: null,
        data: null
      },
      VolumeResistivity: {
        description: null,
        value: null,
        unit: null,
        datafile: null
      },
      ArcResistance: {
        description: null,
        value: null,
        unit: null,
        datafile: null
      },
      Impedance: {
        description: null,
        value: null,
        unit: null,
        datafile: null
      },
      ElectricPercolationThreshold: {
        description: null,
        value: null,
        unit: null,
        data: null
      },
      DC_DielectricConstant: {
        description: null,
        value: null,
        unit: null,
        data: null
      },
      AC_DielectricDispersion: {
        Description: null,
        DielectricDispersionDependence: {
          FrequencyDependence: {
            condition: {
              temperature: {
                description: null,
                value: null,
                unit: null,
                data: null
              }
            }
          },
          TemperatureDependence: {
            condition: {
              frequency: {
                description: null,
                value: null,
                unit: null,
                data: null
              }
            }
          }
        },
        Dielectric_Real_Permittivity: {
          description: null,
          value: null,
          unit: null,
          data: null
        },
        Dielectric_Loss_Permittivity: {
          description: null,
          value: null,
          unit: null,
          data: null
        },
        Dielectric_Loss_Tangent: {
          description: null,
          value: null,
          unit: null,
          data: null
        }
      },
      DielectricBreakdownStrength: {
        Condition: null,
        Profile: {
          value: null,
          unit: null,
          data: null
        },
        WeibullPlot: {
          description: null,
          data: null
        },
        WeibullParameter: [
          {
            description: null,
            value: {
              value: null,
              unit: null
            }
          },
          {
            description: null,
            value: {
              value: null,
              unit: null
            }
          }
        ]
      }
    },
    Thermal: {
      DSC_Profile: [
        {
          data: null
        }
      ],
      MeasurementMethod: null,
      Crystallinity: {
        DegreeOfCrystallization: {
          description: null,
          value: null
        },
        GrowthRateOfCrystal: {
          description: null,
          value: {
            value: null,
            unit: null
          },
          uncertainty: {
            uncertaintytype: null,
            value: null
          },
          datafile: null
        },
        Growth_Rate_Parameter_Of_Avrami_Equation: {
          description: null,
          value: {
            value: null,
            unit: null
          },
          uncertainty: {
            uncertaintytype: null,
            value: null
          },
          datafile: null
        },
        Nucleation_Parameter_Of_Avrami_Equation: {
          description: null,
          value: {
            value: null,
            unit: null
          },
          uncertainty: {
            uncertaintytype: null,
            value: null
          },
          datafile: null
        },
        HalflifeOfCrystallization: {
          description: null,
          value: {
            value: null,
            unit: null
          },
          uncertainty: {
            uncertaintytype: null,
            value: null
          },
          datafile: null
        }
      },
      CrystallizationTemperature: {
        description: null,
        value: null,
        unit: null,
        uncertainty: {
          uncertaintytype: null,
          value: null
        },
        data: null
      },
      HeatOfCrystallization: {
        description: null,
        value: null,
        unit: null,
        uncertainty: {
          uncertaintytype: null,
          value: null
        },
        data: null
      },
      HeatOfFusion: {
        description: null,
        value: null,
        unit: null,
        uncertainty: {
          uncertaintytype: null,
          value: null
        },
        data: null
      },
      ThermalDecompositionTemperature: [
        {
          description: null,
          value: null,
          unit: null,
          uncertainty: {
            uncertaintytype: null,
            value: null
          },
          data: null
        }
      ],
      GlassTransitionTemperature: [
        {
          description: null,
          value: null,
          unit: null,
          uncertainty: {
            uncertaintytype: null,
            value: null
          },
          data: null
        }
      ],
      LC_PhaseTransitionTemperature: {
        description: null,
        value: null,
        unit: null,
        uncertainty: {
          uncertaintytype: null,
          value: null
        },
        data: null
      },
      MeltingTemperature: {
        description: null,
        value: null,
        unit: null,
        uncertainty: {
          uncertaintytype: null,
          value: null
        },
        data: null
      },
      SpecificHeatCapacity_Cp: {
        description: null,
        value: null,
        unit: null,
        uncertainty: {
          uncertaintytype: null,
          value: null
        },
        data: null
      },
      SpecificHeatCapacity_Cv: {
        description: null,
        value: null,
        unit: null,
        uncertainty: {
          uncertaintytype: null,
          value: null
        },
        data: null
      },
      ThermalConductivity: {
        description: null,
        value: null,
        unit: null,
        uncertainty: {
          uncertaintytype: null,
          value: null
        },
        data: null
      },
      ThermalDiffusivity: {
        description: null,
        value: null,
        unit: null,
        uncertainty: {
          uncertaintytype: null,
          value: null
        },
        data: null
      },
      BrittleTemperature: {
        description: null,
        value: null,
        unit: null,
        uncertainty: {
          uncertaintytype: null,
          value: null
        },
        data: null
      }
    },
    Volumetric: {
      WeightLoss: {
        description: null,
        value: null,
        unit: null,
        uncertainty: {
          uncertaintytype: null,
          value: null
        },
        data: null
      },
      InterfacialThickness: {
        description: null,
        value: null,
        unit: null,
        uncertainty: {
          uncertaintytype: null,
          value: null
        }
      },
      Density: {
        description: null,
        value: null,
        unit: null,
        uncertainty: {
          uncertaintytype: null,
          value: null
        },
        data: null
      },
      LinearExpansionCoefficient: {
        description: null,
        value: null,
        unit: null,
        uncertainty: {
          uncertaintytype: null,
          value: null
        },
        data: null
      },
      VolumeExpansionCoefficient: {
        description: null,
        value: null,
        unit: null,
        uncertainty: {
          uncertaintytype: null,
          value: null
        },
        data: null
      },
      SurfaceTension: {
        description: null,
        value: null,
        unit: null,
        uncertainty: {
          uncertaintytype: null,
          value: null
        },
        data: null
      },
      InterfacialTension: {
        description: null,
        value: null,
        unit: null,
        uncertainty: {
          uncertaintytype: null,
          value: null
        },
        data: null
      },
      WaterAbsorption: {
        description: null,
        value: null,
        unit: null,
        uncertainty: {
          uncertaintytype: null,
          value: null
        },
        data: null
      }
    },
    Rheological: {
      RheologicalComplexModulus: [
        {
          RheometerMode: {
            FrequencySweep: {
              condition: {
                temperature: {
                  description: null,
                  value: null,
                  unit: null
                },
                strainAmplitude: {
                  description: null,
                  value: null,
                  unit: null
                }
              }
            },
            TemperatureSweep: {
              condition: {
                frequency: {
                  description: null,
                  value: null,
                  unit: null
                },
                strainAmplitude: {
                  description: null,
                  value: null,
                  unit: null
                }
              }
            },
            StrainSweep: {
              condition: {
                frequency: {
                  description: null,
                  value: null,
                  unit: null
                },
                temperature: {
                  description: null,
                  value: null,
                  unit: null
                }
              }
            }
          },
          RheologicalStorageModulus: {
            description: null,
            data: null
          },
          RheologicalLossModulus: {
            description: null,
            data: null
          },
          RheologicalLossTangent: {
            description: null,
            data: null
          },
          RheologicalMasterCurve: [
            {
              description: null,
              data: null
            }
          ]
        }
      ],
      RheologicalViscosity: [
        {
          RheometerMode: {
            FrequencySweep: {
              condition: {
                temperature: {
                  description: null,
                  value: null,
                  unit: null
                },
                strainAmplitude: {
                  description: null,
                  value: null,
                  unit: null
                }
              }
            },
            TemperatureSweep: {
              condition: {
                frequency: {
                  description: null,
                  value: null,
                  unit: null
                },
                strainAmplitude: {
                  description: null,
                  value: null,
                  unit: null
                }
              }
            },
            StrainSweep: {
              condition: {
                frequency: {
                  description: null,
                  value: null,
                  unit: null
                },
                temperature: {
                  description: null,
                  value: null,
                  unit: null
                }
              }
            }
          },
          DynamicViscosity: {
            description: null,
            value: null,
            unit: null,
            uncertainty: {
              uncertaintytype: null,
              value: null
            },
            data: null
          },
          MeltViscosity: {
            description: null,
            value: null,
            unit: null,
            uncertainty: {
              uncertaintytype: null,
              value: null
            },
            data: null
          }
        }
      ]
    }
  },
  MICROSTRUCTURE: {
    ImageFile: [
      {
        File: null,
        Description: null,
        MicroscopyType: null,
        Type: null,
        Dimension: {
          width: null,
          height: null,
          depth: null
        },
        ImagePreProcessing: {
          value: null
        }
      }
    ],
    Experimental_Sample_Info: {
      SampleSize: {
        value: null,
        unit: null
      },
      SampleThickness: {
        value: 50,
        unit: 'nm'
      }
    }
  },
  'SIMULATION-FEA': {
    FEAModel: {
      SoftwareUsed: null,
      NumberOfElements: {
        description: null,
        value: null
      },
      MeshType: {
        description: null,
        value: null
      },
      'ElementType-Abaqus': {
        description: null,
        value: null
      },
      'ElementType-COMSOL': {
        description: null,
        value: null
      },
      'ElementType-General': {
        description: null
      },
      ModelInputFile: [
        {
          description: null,
          data: null
        },
        {
          description: null,
          data: null
        }
      ],
      'FEAModel-Abaqus': {
        LoadingType: null,
        MinFrequency: {
          description: null,
          value: null
        },
        MaxFrequency: {
          description: null,
          value: null
        },
        NumberOfFrequencyIntervals: {
          value: null
        },
        ReactionForceComputation: null
      }
    },
    BoundaryConditions: {
      BoundaryConditionType: null,
      MechanicalBoundaryCondition: null,
      'Mechanical_BC-x_direction': null,
      'Mechanical_BC-y_direction': null,
      'Mechanical_BC-z_direction': null
    },
    LoadingConditions: [
      {
        Direction: null,
        Magnitude: {
          description: null,
          value: null,
          unit: null
        },
        RelevantNodes: null
      }
    ],
    MicrostructureGeneration: {
      MicrostructureDimension: null,
      MicrostructureDatafile: {
        description: null,
        data: null
      },
      'Scale-nm_per_RVE_length_unit': null,
      '2D_RVE': {
        Width: null,
        Height: null
      },
      '3D_RVE': {
        Width: null,
        Length: null,
        Height: null
      },
      MeanNeighborDistance: {
        description: null,
        value: null,
        unit: null
      },
      Orientation: null
    }
  }
};

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
  lean: sinon.stub().resolvesThis(),
  populate: sinon.stub().resolvesThis()
};

const wrongXlsxFile = [
  {
    fieldname: 'uploadfile',
    originalname: 'Matester template.xlsx',
    encoding: '7bit',
    mimetype:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    destination: 'mm_files',
    filename:
      'coloured_monkey_celestia-2023-03-30T09:59:24.432Z-Matester template.xlsx',
    path: 'mm_files/coloured_monkey_celestia-2023-03-30T09:59:24.432Z-Matester template.xlsx',
    size: 101176
  }
];

const correctXlsxFile = [
  {
    fieldname: 'uploadfile',
    originalname: 'master_template.xlsx',
    encoding: '7bit',
    mimetype:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    destination: 'mm_files',
    filename:
      'coloured_monkey_celestia-2023-03-30T09:51:10.334Z-master_template.xlsx',
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
    filename:
      'entitled_bobolink_emmaline-2023-06-15T12:02:53.834Z-curations.zip',
    path: 'mm_files/entitled_bobolink_emmaline-2023-06-15T12:02:53.834Z-curations.zip',
    size: 121836
  }
];

const mockUploadedFiles = [
  {
    fieldname: 'uploadfile',
    originalname: 'master-template.xlsx',
    encoding: '7bit',
    mimetype:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    destination: 'mm_files',
    filename:
      'educational_hornet_maisie-2023-04-18T16:01:27.609Z-master-template.xlsx',
    path: 'mm_files/educational_hornet_maisie-2023-04-18T16:01:27.609Z-master-template.xlsx',
    size: 104928
  },
  {
    fieldname: 'uploadfile',
    originalname: 'Bello.xlsx',
    encoding: '7bit',
    mimetype:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    destination: 'mm_files',
    filename: 'educational_hornet_maisie-2023-04-18T16:01:27.616Z-Bello.xlsx',
    path: 'mm_files/educational_hornet_maisie-2023-04-18T16:01:27.616Z-Bello.xlsx',
    size: 101196
  },
  {
    fieldname: 'uploadfile',
    originalname: 'Matester_template.xlsx',
    encoding: '7bit',
    mimetype:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    destination: 'mm_files',
    filename:
      'educational_hornet_maisie-2023-04-18T16:01:27.625Z-Matester_template.xlsx',
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
  xml_str:
    '<?xml version="1.0" encoding="utf-8"?><PolymerNanocomposite><ID>L183_S1_P&#246;tschke_2003</ID><DATA_SOURCE><Citation><CommonFields><CitationType>research article</CitationType><Publication>Polymer</Publication><Title>Morphology and electrical resistivity of melt mixed blends of polyethylene and carbon nanotube filled polycarbonate</Title><Author>P&#246;tschke, Petra</Author><Author>Bhattacharyya, Arup R.</Author><Author>Janke, Andreas</Author><Keyword>Blends</Keyword><Keyword>Multiwalled carbon nanotube composites</Keyword><Keyword>Electrical resistivity</Keyword><Publisher>Elsevier</Publisher><PublicationYear>2003</PublicationYear><DOI>10.1016/j.polymer.2003.10.003</DOI><Volume>44</Volume><URL>http://www.sciencedirect.com/science/article/pii/S0032386103009054</URL><Language>English</Language></CommonFields></Citation></DATA_SOURCE><MATERIALS><Matrix><MatrixComponent><ChemicalName>polyethylene</ChemicalName><Abbreviation>PE</Abbreviation><ConstitutionalUnit>C2H4</ConstitutionalUnit><PlasticType>thermoplastic</PlasticType><PolymerType>homopolymer</PolymerType><ManufacturerName>BASF AG, Germany</ManufacturerName><TradeName>Lupolen 4261A</TradeName></MatrixComponent></Matrix><Filler><FillerComponent><ChemicalName>polycarbonate</ChemicalName><Abbreviation>PC</Abbreviation><ManufacturerName>Mitsubishi Engineering Plastics</ManufacturerName><TradeName>Iupilon E-2000</TradeName></FillerComponent><FillerComponent><ChemicalName>multi-wall carbon nanotube</ChemicalName><Abbreviation>MWNT</Abbreviation><ManufacturerName>Hyperion Catalysis International, Inc.</ManufacturerName><FillerComponentComposition><mass>0.02</mass></FillerComponentComposition></FillerComponent><FillerProcessing><ChooseParameter><Extrusion><TwinScrewExtrusion><Extruder>Haake</Extruder><RotationMode>CoRotation</RotationMode><ScrewDiameter><value>30</value><unit>mm</unit></ScrewDiameter><D_L_ratio>10</D_L_ratio></TwinScrewExtrusion></Extrusion></ChooseParameter></FillerProcessing><FillerComposition><volume>0.45</volume></FillerComposition></Filler></MATERIALS><PROCESSING><MeltMixing><ChooseParameter><Mixing><Mixer>DACA Micro Compounder</Mixer><RPM><value>50</value></RPM><Time><value>5</value><unit>minutes</unit></Time><Temperature><value>260</value><unit>Celsius</unit></Temperature></Mixing></ChooseParameter></MeltMixing></PROCESSING><CHARACTERIZATION><Scanning_Electron_Microscopy><EquipmentUsed>LEO VP 435</EquipmentUsed><Description>coated samples</Description></Scanning_Electron_Microscopy><Scanning_Electron_Microscopy><EquipmentUsed>Zeiss Gemini DSM 982</EquipmentUsed><Description>uncoated samples</Description></Scanning_Electron_Microscopy><Atomic_Force_Microscopy><Equipment>Dimension 3100 NanoScope IV</Equipment></Atomic_Force_Microscopy><Rheometery><RheometerType>null</RheometerType><Equipment>ARES oscillatory rheometer</Equipment></Rheometery><Electrometry><Equipment>Keithley electrometer Model 6517 equipped with a 8002A High Resistance Test Fixture</Equipment></Electrometry></CHARACTERIZATION><PROPERTIES><Electrical><VolumeResistivity><Type>DC</Type><Value><FixedValue><value><value>10000000</value><unit>Ohm*cm</unit></value></FixedValue></Value></VolumeResistivity></Electrical><Rheological><DynamicViscosity><Distribution><headers><column id="0">Frequency (rad/s)</column><column id="1">Complex viscosity (Pa*s)</column></headers><rows><row id="0"><column id="0">0.025343805422</column><column id="1">272423.983773</column></row><row id="1"><column id="0">0.0403729449739</column><column id="1">193581.454188</column></row><row id="2"><column id="0">0.0643176212921</column><column id="1">140736.83067</column></row><row id="3"><column id="0">0.102453697935</column><column id="1">97746.3535374</column></row><row id="4"><column id="0">0.16320193455</column><column id="1">67888.0544941</column></row><row id="5"><column id="0">0.254967076239</column><column id="1">47148.2112889</column></row><row id="6"><column id="0">0.398368312042</column><column id="1">34275.8552198</column></row><row id="7"><column id="0">0.647118972204</column><column id="1">25496.400286</column></row><row id="8"><column id="0">0.991621538974</column><column id="1">18534.5056607</column></row><row id="9"><column id="0">1.57981573808</column><column id="1">13786.392423</column></row><row id="10"><column id="0">2.51702692044</column><column id="1">10491.7002831</column></row><row id="11"><column id="0">4.00984333333</column><column id="1">7627.63484949</column></row><row id="12"><column id="0">6.38926218096</column><column id="1">6076.26007409</column></row><row id="13"><column id="0">9.98374020647</column><column id="1">4623.92363782</column></row><row id="14"><column id="0">15.9080364052</column><column id="1">3683.46979641</column></row><row id="15"><column id="0">24.859993927</column><column id="1">2934.15216646</column></row><row id="16"><column id="0">39.6155968303</column><column id="1">2446.69769684</column></row><row id="17"><column id="0">64.349416065</column><column id="1">1778.87434597</column></row><row id="18"><column id="0">102.553780693</column><column id="1">1552.72366776</column></row></rows></Distribution></DynamicViscosity></Rheological></PROPERTIES><MICROSTRUCTURE><LengthUnit>micrometer</LengthUnit><ImageFile><File>http://localhost/nmr/blob?id=583e05cfe74a1d205f4e2177</File><Description>height image</Description><MicroscopyType>AFM</MicroscopyType><Type>grayscale</Type><Dimension><width>20</width><height>20</height></Dimension></ImageFile><ImageFile><File>http://localhost/nmr/blob?id=583e05f1e74a1d205f4e218c</File><Description>phase image</Description><MicroscopyType>AFM</MicroscopyType><Type>grayscale</Type><Dimension><width>20</width><height>20</height></Dimension></ImageFile><ImageFile><File>http://localhost/nmr/blob?id=583e061ee74a1d205f4e21a1</File><Description>cryofractured extracted strands</Description><MicroscopyType>SEM</MicroscopyType><Type>grayscale</Type><Dimension><width>41</width><height>28</height></Dimension></ImageFile><ImageFile><File>http://localhost/nmr/blob?id=583e063ce74a1d205f4e21b6</File><Description>cryofractured extracted strands showing nanotube bridging of PE and PC</Description><MicroscopyType>SEM</MicroscopyType><Type>grayscale</Type><Dimension><width>22.4</width><height>15.5</height></Dimension></ImageFile></MICROSTRUCTURE></PolymerNanocomposite>',
  content: {
    PolymerNanocomposite: {
      ...mockCuratedXlsxObject
    }
  }
};

const user = {
  _id: 'ai094oja09aw40-o',
  displayName: 'test'
};

const mockUnzippedFolder = {
  folderPath: 'mm_files/bulk-curation-1688982949940',
  allfiles: [
    {
      mode: 33188,
      mtime: '2023-05-10T11:43:10.000Z',
      path: 'bulk/S10_L1/001.tif',
      type: 'file',
      data: '<Buffer ff d8 ff e0 00 10 4a 46 49 46 00 01 01 00 00 01 00 01 00 00 ff db 00 84 00 03 02 02 0a 0a 0a 0a 0a 0a 08 08 0a 08 0a 0a 0a 0a 08 08 0a 0a 0a 0a 0a 0a ... 57576 more bytes'
    },
    {
      mode: 33188,
      mtime: '2023-05-10T11:43:10.000Z',
      path: '__MACOSX/bulk/S10_L1/._001.tif',
      type: 'file',
      data: '<Buffer 00 05 16 07 00 02 00 00 4d 61 63 20 4f 53 20 58 20 20 20 20 20 20 20 20 00 02 00 00 00 09 00 00 00 32 00 00 02 ce 00 00 00 02 00 00 03 00 00 00 00 00 ... 718 more bytes>'
    }
  ]
};

const mockReadFolder = {
  masterTemplates: [
    'mm_files/bulk-curation-1686834726293/master_template.xlsx',
    'mm_files/bulk-curation-1688984487096/master_template (1).xlsx'
  ],
  curationFiles: [
    'mm_files/bulk-curation-1688982949940/Ls-94k-askd/real_permittivity.csv',
    'mm_files/bulk-curation-1688982949940/Ls-94k-askd/loss_permittivity.csv',
    'mm_files/bulk-curation-1688982949940/Ls-94k-askd/tan_delta.csv',
    'mm_files/bulk-curation-1688982949940/Ls-94k-askd/weibull.csv',
    'mm_files/bulk-curation-1688982949940/Ls-94k-askd/001.tif'
  ],
  folders: ['mm_files/bulk-curation-1686834726293/Ls-94k-askd']
};

const mockProcessedFiles = mockReadFolder.curationFiles.map((file) => ({
  params: { fileId: file }
}));

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
  bulkCurations: [],
  bulkErrors: [
    {
      filename: 'mm_files/bulk-curation-1686834726293/master_template.xlsx',
      '001.tif': 'file not uploaded'
    }
  ]
};

const mockBulkCuration2 = {
  bulkCurations: [mockCurateObject],
  bulkErrors: [
    {
      filename: 'mm_files/bulk-curation-1686834726293/master_template.xlsx',
      '001.tif': 'file not uploaded'
    }
  ]
};

const mockJsonSchema = {
  $schema: 'http://json-schema.org/draft-04/schema#',
  type: 'object',
  properties: {
    PolymerNanocomposite: {
      type: 'object',
      properties: {
        ID: { type: 'string' },
        Control_ID: { type: 'string' },
        DATA_SOURCE: {
          type: 'object',
          properties: {
            Citation: {
              type: 'object',
              properties: {
                CommonFields: {
                  type: 'object',
                  properties: {
                    YourName: { type: 'string' },
                    YourEmail: { type: 'string' },
                    Origin: { type: 'string' },
                    CitationType: { type: 'string' },
                    PublicationType: { type: 'string' },
                    DOI: { type: 'string' },
                    Publication: { type: 'string' },
                    Title: { type: 'string' },
                    Author: {
                      type: 'array',
                      items: { type: 'string' }
                    },
                    Keyword: {
                      type: 'array',
                      items: { type: 'string' }
                    },
                    PublicationYear: { type: 'string' },
                    Volume: { type: 'string' },
                    Issue: { type: 'string' },
                    URL: { type: 'string' },
                    Language: { type: 'string' },
                    Location: { type: 'string' },
                    DateOfCitation: { type: 'string' },
                    LaboratoryDataInfo: {
                      type: 'object',
                      properties: {
                        DateOfSampleMade: { type: 'string' },
                        DateOfDataMeasurement: { type: 'string' },
                        RelatedDOI: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};

const mockjsonError = {
  fieldError: {
    'DATA ORIGIN': {
      Citation: {
        CommonFields: {
          YourEmail: 'YourEmail cannot be null'
        }
      }
    }
  }
};

const mockCurationStream = {
  pipe: sinon.spy()
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
  mockJsonObject,
  mockJsonObjectErrored,
  mockjsonError,
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
  mockJsonSchema,
  mockCurationStream,
  mockReadFolder,
  mockProcessedFiles,
  mockRes
};
