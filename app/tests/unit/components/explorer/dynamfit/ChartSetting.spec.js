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
})
