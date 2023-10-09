import createWrapper from '../../../jest/script/wrapper'
import CurationForm from '@/pages/explorer/curate/form/CurationForm.vue'

describe('CurationForm.vue', () => {
  let wrapper

  afterEach(async () => {
    await jest.restoreAllMocks()
  })

  describe('Curation form Loading State', async () => {
    beforeAll(async () => {
      wrapper = await createWrapper(CurationForm, {}, false)
    })

    const createdSpy = jest
      .spyOn(CurationForm.methods, 'fetchCurationData')
      .mockImplementation(() => {})

    it('calls the right funtion on mount', async () => {
      expect(createdSpy).toHaveBeenCalledTimes(1)
    })

    test('loading state visual assertion', async () => {
      expect(wrapper.vm.loading).toBe(true)
      expect(wrapper.vm.error).toBe(false)
      var layout = wrapper.find('div > div.section_loader.u--margin-toplg')
      expect(layout.exists()).toBe(true)
      var component = layout.findComponent('spinner-stub')
      expect(component.props().text).toBe('Loading Curation Form')
      expect(component.props().loading).toBe(true)
    })
  })

  describe('Curation form Error State', async () => {
    const createdSpy = jest.spyOn(CurationForm.methods, 'fetchCurationData')
    beforeAll(async () => {
      wrapper = await createWrapper(CurationForm, {}, false)
    })

    it('calls the right funtion on mount', async () => {
      expect.assertions(1)
      expect(createdSpy).toHaveBeenCalledTimes(1)
    })

    it('does not load spinner and loading state ', async () => {
      expect.assertions(4)
      expect(wrapper.vm.loading).toBe(false)
      expect(wrapper.vm.error).toBe(true)
      var layout = wrapper.find('div > div.section_loader.u--margin-toplg')
      expect(layout.exists()).toBe(false)
      expect(wrapper.findComponent('spinner-stub').exists()).toBe(false)
    })

    it('loads error text ', async () => {
      expect.assertions(3)
      var layout = wrapper.find(
        'div > div.utility-roverflow.u_centralize_text.u_margin-top-med'
      )
      expect(layout.exists()).toBe(true)
      var text = layout.find('h1')
      expect(text.text()).toBe('Unable to load form')
      expect(text.attributes().class).toBe(
        'visualize_header-h1 u--margin-topxl'
      )
    })
  })

  describe('Curation form when form loading is complete', async () => {
    jest.spyOn(CurationForm.methods, 'fetchData').mockImplementation(() => {})
    beforeEach(async () => {
      wrapper = await createWrapper(CurationForm, {}, false)
      await wrapper.vm.$store.commit(
        'explorer/curation/setCurationFormData',
        data
      )
      await wrapper.vm.fetchCurationData()
    })

    it('does not load spinner and loading state ', async () => {
      expect.assertions(4)
      expect(wrapper.vm.loading).toBe(false)
      expect(wrapper.vm.error).toBe(true)
      var layout = wrapper.find('div > div.section_loader.u--margin-toplg')
      expect(layout.exists()).toBe(false)
      expect(wrapper.findComponent('spinner-stub').exists()).toBe(false)
    })

    it('loads does not show error text ', async () => {
      expect.assertions(2)
      var layout = wrapper.find(
        'div > div.utility-roverflow.u_centralize_text.u_margin-top-med'
      )
      expect(layout.exists()).toBe(false)
      var text = wrapper.find('h1')
      expect(text.exists()).toBe(false)
    })

    it('load inactive horizontal stepper', async () => {
      const stepper = wrapper.findComponent('md-steppers-stub')
      expect(stepper.exists()).toBe(true)
      expect(stepper.attributes('class')).toBe(
        'form__stepper form__stepper-curate'
      )
      expect(stepper.props().mdActiveStep).toBe('stepper_null')
      expect(stepper.props().mdVertical).toBe(false)
    })

    it('loads the right number of steps headers', async () => {
      const stepper = wrapper.findComponent('md-steppers-stub')
      const title = Object.keys(data).filter((word) => word !== 'ID')
      const steps = stepper.findAllComponents('md-step-stub')
      expect(steps.length).toBe(title.length)
      for (let i = 0; i < steps.length; i++) {
        expect(steps.at(i).props().mdLabel).toBe(title[i])
        expect(steps.at(i).attributes().id).toBe(`stepper_${i}`)
      }
    })

    it('loads the select dropdown', async () => {
      const select = wrapper.findComponent('md-select-stub')
      const title = Object.keys(data).filter((word) => word !== 'ID')
      const options = select.findAllComponents('md-option-stub')

      expect(select.props().value).toBe('stepper_null')
      expect(options.length).toBe(title.length)

      for (let i = 0; i < options.length; i++) {
        expect(options.at(i).props().value).toBe(`stepper_${i}`)
        expect(options.at(i).text()).toBe(title[i])
      }
    })
  })
})

const data = {
  ID: {
    cellValue: '1. Data Origin|[4,1]',
    type: 'String',
    required: false
  },
  'DATA ORIGIN': {
    Citation: {
      CommonFields: {
        YourName: {
          cellValue: '1. Data Origin|[2,1]',
          type: 'String',
          required: false
        },
        YourEmail: {
          cellValue: '1. Data Origin|[3,1]',
          type: 'String',
          required: false
        },
        Origin: {
          cellValue: '1. Data Origin|[6,1]',
          type: 'List',
          required: false,
          validList: 'origin'
        },
        Title: {
          cellValue: '1. Data Origin|[16,1]',
          type: 'String',
          required: false
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
        }
      }
    }
  },
  'MATERIAL TYPES': {
    Matrix: {
      MatrixComponent: {
        ChemicalName: {
          cellValue: '2. Material Types|[5,1]',
          type: 'String',
          required: false
        },
        PubChemRef: {
          cellValue: '2. Material Types|[6,1]',
          type: 'String',
          required: false
        },
        Abbreviation: {
          cellValue: '2. Material Types|[7,1]',
          type: 'String',
          required: false
        },
        ConstitutionalUnit: {
          cellValue: '2. Material Types|[8,1]',
          type: 'String',
          required: false
        }
      }
    },
    Filler: {
      FillerComponent: {
        type: 'multiples',
        values: [
          {
            Description: {
              cellValue: '2. Material Types|[26,1]',
              type: 'String',
              required: false
            },
            ChemicalName: {
              cellValue: '2. Material Types|[27,1]',
              type: 'String',
              required: false
            },
            PubChemRef: {
              cellValue: '2. Material Types|[28,1]',
              type: 'String',
              required: false
            },
            Abbreviation: {
              cellValue: '2. Material Types|[29,1]',
              type: 'String',
              required: false
            },
            ManufacturerOrSourceName: {
              cellValue: '2. Material Types|[30,1]',
              type: 'String',
              required: false
            }
          }
        ]
      }
    }
  },
  'SIMULATION-FEA': {
    LoadingConditions: {
      type: 'multiples',
      values: [
        {
          Direction: {
            cellValue: '7. Simulation - FEA|[28,1]',
            type: 'List',
            required: false,
            validList:
              'SIMULATION-FEA::BoundaryConditions::Mechanical_BC-z_direction::description'
          },
          Magnitude: {
            description: {
              cellValue: '7. Simulation - FEA|[29,1]',
              type: 'String',
              required: false
            },
            value: {
              cellValue: '7. Simulation - FEA|[29,2]',
              type: 'String',
              required: false
            },
            unit: {
              cellValue: '7. Simulation - FEA|[29,3]',
              type: 'String',
              required: false
            }
          },
          RelevantNodes: {
            cellValue: '7. Simulation - FEA|[28,1]',
            type: 'List',
            required: false,
            validList:
              'SIMULATION-FEA::BoundaryConditions::Mechanical_BC-z_direction::description'
          }
        }
      ]
    }
  }
}
