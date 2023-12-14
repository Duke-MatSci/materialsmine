import createWrapper from '../../../jest/script/wrapper'
import { enableAutoDestroy } from '@vue/test-utils'
import SpreadsheetUploadBulk from '@/pages/explorer/curate/spreadsheet/SpreadsheetUploadBulk.vue'

const apollo = {
  verifyUser: {
    isAuth: true,
    user: {
      username: 'Test User'
    }
  }
}

const testFiles = [
  {
    file: { name: 'FakeFile.zip' },
    id: 'MultipleSamples 2.zip-6541598-1688622380706-application/zip',
    status: 'incomplete'
  }
]

const mockValues = {
  bulkCurations: [
    {
      xml: '',
      user: {
        _id: '63feb2a02e34b87a5c278ab8',
        displayName: 'Test User'
      },
      sampleID: 'L1_S23',
      groupId: '123456',
      isApproved: false,
      status: 'Editing'
    },
    {
      xml: '',
      user: {
        _id: '63feb2a02e34b87a5c278ab8',
        displayName: 'Test User'
      },
      sampleID: 'L2_S34',
      groupId: '123456',
      isApproved: false,
      status: 'Editing'
    }
  ],
  bulkErrors: [
    {
      filename: 'bulkzip_029485858/L340_5ty_2/permitivity_master_template.xlsx',
      errors: 'This had been curated already'
    },
    {
      filename: 'bulkzip_029485858/L340_5ty_2/master_template.xlsx',
      errors: {
        'real_permittivity.csv': 'file not uploaded',
        'loss_permittivity.csv': 'file not uploaded'
      }
    }
  ]
}

global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve(mockValues),
    statusText: 'OK',
    status: 200
  })
)

describe('SpreadsheetUploadBulk.vue', () => {
  let wrapper
  beforeEach(async () => {
    wrapper = await createWrapper(
      SpreadsheetUploadBulk,
      {
        mocks: {
          $apollo: {
            loading: false
          }
        },
        stubs: {
          MdPortal: { template: '<div><slot/></div>' }
        }
      },
      true
    )
    await wrapper.setData({ verifyUser: apollo.verifyUser })
  })

  enableAutoDestroy(afterEach)

  it('renders steppers', () => {
    expect.assertions(1)
    const steppers = wrapper.findAll('.md-stepper')
    expect(steppers.length).toBe(3)
  })

  it.skip('provides link to download template', () => {
    expect.assertions(3)
    const steppers = wrapper.findAll('.md-stepper')
    expect(steppers.at(0).text()).toContain(
      'Click here to download the template spreadsheet, and fill it out with your data.'
    )
    const downloadLinks = steppers.at(0).findAll('a')
    expect(downloadLinks.at(0).exists()).toBe(true)
    expect(downloadLinks.at(0).html()).toContain('href')
  })

  it('contains drop area for zip file', () => {
    expect.assertions(1)
    const steppers = wrapper.findAll('.form__drop-area')
    expect(steppers.length).toBe(1)
  })

  it('verifies provided information', async () => {
    expect.assertions(1)
    await wrapper.setData({ spreadsheetFiles: testFiles })
    const verificationStep = wrapper.findAll('.md-stepper').at(2)
    expect(verificationStep.text()).toContain(testFiles[0].file.name)
  })

  it('renders a submit button', () => {
    expect.assertions(1)
    const submitButton = wrapper.find('#submit')
    expect(submitButton.exists()).toBe(true)
  })

  it('calls submit functions', async () => {
    expect.assertions(2)
    const submitFiles = jest.spyOn(wrapper.vm, 'submitFiles')

    const submitButton = wrapper.find('#submit')
    await submitButton.trigger('click')

    expect(submitFiles).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('Upload in progress')
  })

  it('renders results', async () => {
    expect.assertions(6)
    await wrapper.setData({
      submitted: true,
      uploadInProgress: false,
      uploadResponse: mockValues
    })

    // Successful curations
    const cards = wrapper.findAll('.md-card')
    expect(cards.length).toBe(2)
    expect(cards.at(0).text()).toContain(mockValues.bulkCurations[0].sampleID)

    // Errors
    const list = wrapper.find('.md-list')
    expect(list.exists()).toBe(true)
    expect(list.text()).toContain('master_template.xlsx')
    expect(list.text()).toContain(mockValues.bulkErrors[0].errors)
    expect(wrapper.findAll('.md-list-item').length).toBe(3)
  })
})
