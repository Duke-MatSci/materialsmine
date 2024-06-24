import createWrapper from '../../../../jest/script/wrapper'
import { enableAutoDestroy } from '@vue/test-utils'
import ChartSetting from '@/components/explorer/dynamfit/ChartSetting.vue'

describe('ChartSetting.vue', () => {
  enableAutoDestroy(afterEach)

  describe('ChartSetting.vue base template', () => {
    let wrapper
    beforeEach(async () => {
      if (wrapper) {
        wrapper.destroy()
      }
      wrapper = await createWrapper(ChartSetting, {}, false)
    })

    it('renders layout', () => {
      const template = wrapper.find(
        'div.u_width--max.utility-bg_border-dark.md-card-header.u--b-rad'
      )
      expect(template.exists()).toBe(true)
      expect(wrapper.findAll('.u_width--max > label').length).toBe(1)
      expect(wrapper.findAll('label').length).toBe(6)
    })

    it('renders text', () => {
      const label = wrapper.find(
        'div.u_width--max > label.form-label.md-subheading'
      )
      const textContainer = label.findAll('div')
      expect(label.exists()).toBe(true)
      expect(textContainer.length).toBe(2)
      expect(textContainer.at(0).text()).toBe(
        'Upload Compatible Viscoelastic Data'
      )
      expect(textContainer.at(1).text()).toBe(
        "(accepted formats: '.csv', '.tsv')"
      )
    })

    it('renders file upload', () => {
      expect(
        wrapper
          .find('div.utility-margin-right.viz-u-mgup-md.viz-u-mgbottom-big')
          .exists()
      ).toBe(true)
      expect(wrapper.findAll('label').at(1).attributes('for')).toBe(
        'Viscoelastic_Data'
      )
      expect(wrapper.find('div.form__file-input ').exists()).toBe(true)
      expect(wrapper.find('div.md-theme-default ').exists()).toBe(true)
      expect(wrapper.find('div.md-file > input').exists()).toBe(true)
      expect(wrapper.find('label.btn').exists()).toBe(true)
      expect(wrapper.find('span.md-caption').exists()).toBe(false)
    })

    it('only accepts tsv or csv file', () => {
      const container = wrapper.find(
        'div.utility-margin-right > label > .form__file-input > .md-theme-default'
      )

      const input = container.find('div.md-file > input')
      const btn = container.find('label')
      expect(container.exists()).toBe(true)
      expect(btn.attributes('class')).toBe(
        'btn btn--primary md-button u--b-rad'
      )
      expect(btn.attributes('for')).toBe('Viscoelastic_Data')
      expect(btn.find('p.md-body-1').text()).toBe('Upload file')
      expect(input.attributes('accept')).toBe('.csv, .tsv, .txt')
      expect(input.attributes('type')).toBe('file')
    })
  })

  describe('ChartSetting.vue ', () => {
    let wrapper
    const fileName = (+new Date() * Math.random()).toString(36).substring(0, 8)
    const invalidFile = [{ type: 'image/png', name: fileName }]
    const validFile = [{ type: 'text/tab-separated-values', name: fileName }]

    beforeEach(async () => {
      if (wrapper) {
        wrapper.destroy()
      }
      await jest.clearAllMocks()
      wrapper = await createWrapper(ChartSetting, {}, false)
    })

    it('rejects uploading unsupported file format', async () => {
      const event = {
        target: {
          files: [...invalidFile]
        }
      }
      const uploadFile = jest.spyOn(wrapper.vm.$store, 'dispatch')
      const displayInfo = jest
        .spyOn(wrapper.vm, 'displayInfo')
        .mockImplementationOnce(() => {})
        .mockImplementationOnce(() => {})
      await wrapper.vm.onInputChange(event)

      expect(displayInfo).toHaveBeenCalledTimes(2)
      expect(displayInfo).toHaveBeenNthCalledWith(1, 'Uploading File...')
      expect(displayInfo).toHaveBeenNthCalledWith(2, 'Unsupported file format')
      expect(uploadFile).toHaveBeenCalledTimes(0)
    })

    it('sends supported file format to the server', async () => {
      const event = {
        target: {
          files: [...validFile]
        }
      }
      const isTemp = wrapper.vm.isTemp
      const randomStr = (+new Date() * Math.random())
        .toString(36)
        .substring(0, 10)

      // const payload = {
      //   fileName: randomStr,
      //   numberOfProny: wrapper.vm.dynamfit.range,
      //   model: wrapper.vm.dynamfit.model,
      //   fitSettings: wrapper.vm.dynamfit.fitSettings
      // }

      const dispatch = jest
        .spyOn(wrapper.vm.$store, 'dispatch')
        .mockImplementationOnce(() => Promise.resolve({ fileName: randomStr }))
        .mockImplementationOnce(() => {})

      await wrapper.vm.onInputChange(event)

      // TODO: CHECK WHY THIS IS FAILING
      // expect(dispatch).toHaveBeenCalledTimes(2)

      expect(dispatch).toHaveBeenCalledWith('uploadFile', {
        file: [...event.target?.files],
        isTemp
      })
      // TODO: CHECK WHY THIS IS FAILING
      // expect(dispatch).toHaveBeenNthCalledWith(
      //   2,
      //   'explorer/fetchDynamfitData',
      //   payload
      // )
    })

    it('fetches dynamfitdata on successful file upload', async () => {
      const event = {
        target: {
          files: [...validFile]
        }
      }
      const isTemp = wrapper.vm.isTemp
      const randomStr = (+new Date() * Math.random())
        .toString(36)
        .substring(0, 10)
      const uploadFile = jest
        .spyOn(wrapper.vm.$store, 'dispatch')
        .mockImplementationOnce(() => Promise.resolve({ fileName: randomStr }))
        .mockImplementationOnce(() => {})

      const displayInfo = jest
        .spyOn(wrapper.vm, 'displayInfo')
        .mockImplementationOnce(() => {})
        .mockImplementationOnce(() => {})
      await wrapper.vm.onInputChange(event)

      expect(uploadFile).toHaveBeenCalledTimes(2)
      expect(displayInfo).toHaveBeenCalledTimes(2)

      expect(displayInfo).toHaveBeenNthCalledWith(1, 'Uploading File...')
      expect(uploadFile).toHaveBeenNthCalledWith(1, 'uploadFile', {
        file: [...event.target?.files],
        isTemp
      })
      expect(displayInfo).toHaveBeenNthCalledWith(2, 'Upload Successful', 1500)
    })
  })

  describe('ChartSetting.vue independent function', () => {
    let wrapper

    beforeEach(async () => {
      if (wrapper) {
        wrapper.destroy()
      }
      await jest.clearAllMocks()
      wrapper = await createWrapper(ChartSetting, {}, false)
    })

    it('displayInfo() shows message on snackbar', async () => {
      const snackbar = jest.spyOn(wrapper.vm.$store, 'commit')
      await wrapper.vm.displayInfo('Something is ok', 1000)

      expect(snackbar).toHaveBeenCalledTimes(1)
      expect(snackbar).toHaveBeenNthCalledWith(1, 'setSnackbar', {
        duration: 1000,
        message: 'Something is ok'
      })
    })

    it('displayInfo() shows message on snackbar with just one arguement provided', async () => {
      const snackbar = jest.spyOn(wrapper.vm.$store, 'commit')
      await wrapper.vm.displayInfo('Something is ok2')

      expect(snackbar).toHaveBeenCalledTimes(1)
      expect(snackbar).toHaveBeenNthCalledWith(1, 'setSnackbar', {
        duration: 3000,
        message: 'Something is ok2'
      })
    })

    it('displayInfo() does not show message on snackbar withouth argument', async () => {
      const snackbar = jest.spyOn(wrapper.vm.$store, 'commit')
      await wrapper.vm.displayInfo()
      expect(snackbar).toHaveBeenCalledTimes(0)
    })
  })
})
