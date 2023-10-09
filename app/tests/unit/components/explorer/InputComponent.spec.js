import createWrapper from '../../../jest/script/wrapper'
import { enableAutoDestroy } from '@vue/test-utils'
import InputComponent from '@/components/explorer/InputComponent.vue'

const reduceSpacing =
  'align-items: baseline; min-height: auto; padding-top: 0px;'

describe('Validate input component', () => {
  it('InputComponent.vue without the required props', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    const wrapper = createWrapper(InputComponent, {}, false)
    var layout = wrapper.find('div.md-card-actions.viz-u-display__show')
    var text = layout.find('p')
    expect(consoleSpy).toHaveBeenCalledTimes(3)
    expect(layout.exists()).toBe(true)
    expect(text.exists()).toBe(true)
    expect(text.text()).toBe('inputObj prop not provided')
    expect(text.attributes('class')).toBe('md-body u--color-error')
    await jest.resetAllMocks()
  })
})

describe('InputComponent.vue with input type string', async () => {
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  const inputObj = {
    type: 'String',
    cellValue: 'Some value',
    required: false
  }
  const name = 'Some String'
  const uniqueKey = ['key', 'key1']
  const title = 'data'
  let wrapper
  beforeEach(() => {
    if (wrapper) {
      wrapper.destroy()
    }
    wrapper = createWrapper(
      InputComponent,
      {
        props: {
          inputObj: inputObj,
          name: name,
          uniqueKey: uniqueKey,
          title: title
        }
      },
      true
    )
  })

  enableAutoDestroy(afterEach)

  it('throws no console error on mount', () => {
    expect(consoleSpy).toHaveBeenCalledTimes(0)
  })

  it('does not renders the error message', () => {
    var layout = wrapper.find('div.md-card-actions.viz-u-display__show')
    var text = layout.find('p.u--color-error')
    expect(layout.exists()).toBe(true)
    expect(text.exists()).toBe(false)
  })

  it('it renders a text input and label', async () => {
    const inputContainer = wrapper.find('div.md-card-actions > div.md-field')
    expect(inputContainer.attributes('style')).toEqual(
      'align-items: baseline; min-height: auto; padding-top: 0px;'
    )
    expect(inputContainer.find('p.md-body-2.u--color-grey-sec').text()).toBe(
      `${name}:`
    )
    expect(inputContainer.find('input').attributes('type')).toBe('text')
    expect(inputContainer.find('input').attributes('id')).toBe(
      `${uniqueKey.join(',')}`
    )
    expect(inputContainer.find('input').attributes('name')).toBe(
      `${uniqueKey.join(',')}`
    )
    expect(inputContainer.find('span.md-error').text()).toBe('Input Required')
  })

  it('input elememt is reactive and bound to the inputObj property named cellValue', async () => {
    var text = 'sampletext'
    const input = wrapper.find('input')
    expect(wrapper.vm.inputObj.cellValue).toBe(inputObj.cellValue)
    await input.setValue(text)
    expect(wrapper.vm.inputObj.cellValue).toBe(text)
  })

  it('detects error when error obj present', async () => {
    const errorObj = { data: { key: { key1: 'This is a required text' } } }
    const input = wrapper.find('input')
    expect(wrapper.find('div.md-field').attributes('class')).toBe(
      'md-field md-theme-default md-has-value'
    )
    expect(wrapper.vm.inputError).toBe(false)
    await input.setValue('')
    await wrapper.vm.$store.commit(
      'explorer/curation/setCurationFormError',
      errorObj
    )
    expect(wrapper.vm.inputError).toBe(true)
    expect(wrapper.find('div.md-field').attributes('class')).toBe(
      'md-field md-theme-default md-invalid'
    )
    await jest.resetAllMocks()
  })
})

describe('InputComponent.vue with input type list', () => {
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  const inputObj = {
    type: 'List',
    cellValue: '',
    required: false,
    validList: 'origin'
  }
  const name = 'Some List'
  const uniqueKey = ['key', 'key1']
  const title = 'data'
  let wrapper
  beforeEach(async () => {
    if (wrapper) {
      wrapper.destroy()
    }
    wrapper = createWrapper(
      InputComponent,
      {
        props: {
          inputObj: inputObj,
          name: name,
          uniqueKey: uniqueKey,
          title: title
        }
      },
      false
    )
    await wrapper.vm.$store.commit(
      'explorer/curation/setCurationFormError',
      {}
    )
  })

  it('throws no console error on mount', () => {
    expect(consoleSpy).toHaveBeenCalledTimes(0)
  })

  it('does not renders the error message', () => {
    var layout = wrapper.find('div.md-card-actions.viz-u-display__show')
    var text = layout.find('p.u--color-error')
    expect(layout.exists()).toBe(true)
    expect(text.exists()).toBe(false)
  })

  it('it renders a material form select component and label', async () => {
    const inputContainer = wrapper.find('div.md-card-actions > md-field-stub')
    expect(wrapper.vm.inputObj.type).toEqual('List')
    expect(inputContainer.attributes('style')).toEqual(reduceSpacing)
    expect(inputContainer.find('p.md-body-2.u--color-grey-sec').exists()).toBe(
      false
    )
    expect(
      inputContainer.find('md-select-stub').attributes('placeholder')
    ).toBe(`Please choose ${name}`)
    expect(inputContainer.find('md-select-stub').attributes('id')).toBe(
      `${uniqueKey.join(',')}`
    )
    expect(inputContainer.find('md-select-stub').attributes('name')).toBe(
      `${uniqueKey.join(',')}`
    )
    expect(inputContainer.find('span.md-error').text()).toBe('Input Required')
  })

  it('select elememt list is bound to data property listItem', async () => {
    const listItem = ['Sample', 'Origin', 'Text']
    await wrapper.setData({ listItem: listItem })
    const options = wrapper.findAll('md-option-stub')
    expect(options.length).toBe(listItem.length + 1) // the default option is an extra
    for (let i = 1; i < options.length; i++) {
      expect(options.at(i).text()).toBe(listItem[i - 1])
      expect(options.at(i).attributes('value')).toBe(listItem[i - 1])
    }
  })

  it('detects error when error obj present', async () => {
    const errorObj = { data: { key: { key1: 'This is a required field' } } }
    expect(
      wrapper.find('div.md-card-actions > md-field-stub').attributes('class')
    ).toEqual('')
    expect(wrapper.vm.inputError).toBe(false)

    await wrapper.vm.$store.commit(
      'explorer/curation/setCurationFormError',
      errorObj
    )

    expect(wrapper.vm.inputError).toBe(true)
    expect(
      wrapper.find('div.md-card-actions > md-field-stub').attributes('class')
    ).toEqual('md-invalid')
  })
})

describe('InputComponent.vue with input type replace_nested', () => {
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  const inputObj = {
    type: 'replace_nested',
    values: ['sampletext'],
    required: false
  }
  const name = 'Author'
  const uniqueKey = ['key', 'key1', 'key2']
  const title = 'data'
  let wrapper
  beforeEach(async () => {
    if (wrapper) {
      wrapper.destroy()
    }
    wrapper = createWrapper(
      InputComponent,
      {
        props: {
          inputObj: inputObj,
          name: name,
          uniqueKey: uniqueKey,
          title: title
        }
      },
      false
    )
    await wrapper.vm.$store.commit(
      'explorer/curation/setCurationFormError',
      {}
    )
  })

  it('throws no console error on mount', () => {
    expect(consoleSpy).toHaveBeenCalledTimes(0)
  })

  it('does not renders the error message', () => {
    var layout = wrapper.find('div.md-card-actions.viz-u-display__show')
    var text = layout.find('p.u--color-error')
    expect(layout.exists()).toBe(true)
    expect(text.exists()).toBe(false)
  })

  it('it renders a material form input chip component and placeholder', async () => {
    const chips = wrapper.find('div.md-card-actions > md-chips-stub')
    const button = wrapper.find('md-button-stub')
    expect(wrapper.vm.inputObj.type).toEqual('replace_nested')
    expect(chips.attributes('class')).toEqual('md-primary')
    expect(chips.find('span.md-error').text()).toBe('Input Required')
    expect(chips.attributes('mdplaceholder')).toBe(`Enter ${name}`)
    expect(chips.attributes('mdautoinsert')).toBe('true')
    expect(button.find('md-tooltip-stub').text()).toBe(`Click to add ${name}`)
    expect(button.find('md-tooltip-stub').attributes('mddirection')).toBe(
      'top'
    )
    expect(button.find('md-icon-stub').text()).toBe('add')
  })

  it('input elememt is reactive and bound to the inputObj property named values', async () => {
    const input = wrapper.find('md-chips-stub')
    expect(input.attributes('value')).toEqual(inputObj.values.join(','))
  })

  it('detects error when error obj present', async () => {
    const errorObj = {
      data: { key: { key1: { key2: 'This is a required field' } } }
    }
    expect(
      wrapper.find('div.md-card-actions > md-chips-stub').attributes('class')
    ).toEqual('md-primary')
    expect(wrapper.vm.inputError).toBe(false)

    await wrapper.vm.$store.commit(
      'explorer/curation/setCurationFormError',
      errorObj
    )

    expect(wrapper.vm.inputError).toBe(true)
    expect(
      wrapper.find('div.md-card-actions > md-chips-stub').attributes('class')
    ).toEqual('md-invalid md-primary')
    await wrapper.vm.$store.commit(
      'explorer/curation/setCurationFormError',
      {}
    )
  })
})

describe('InputComponent.vue with input type File', () => {
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  const inputObj = {
    type: 'File',
    cellValue: '',
    required: false
  }
  const name = 'file'
  const uniqueKey = ['key', 'key1']
  const title = 'data'
  let wrapper
  beforeEach(async () => {
    if (wrapper) {
      wrapper.destroy()
    }
    wrapper = createWrapper(
      InputComponent,
      {
        props: {
          inputObj: inputObj,
          name: name,
          uniqueKey: uniqueKey,
          title: title
        }
      },
      false
    )
    await wrapper.vm.$store.commit(
      'explorer/curation/setCurationFormError',
      {}
    )
  })

  it('throws no console error on mount', () => {
    expect(consoleSpy).toHaveBeenCalledTimes(0)
  })

  it('does not renders the error message', () => {
    var layout = wrapper.find('div.md-card-actions.viz-u-display__show')
    var text = layout.find('p.u--color-error')
    expect(layout.exists()).toBe(true)
    expect(text.exists()).toBe(false)
  })

  it('it renders an input type file component and placeholder', async () => {
    const label = wrapper.findAll('label')
    expect(label.at(0).attributes('for')).toBe(uniqueKey.join(','))
    expect(label.at(1).text()).toBe('Select file to upload')
    expect(label.at(0).find('div.form__file-input').exists()).toBe(true)
    expect(
      label
        .at(0)
        .find('.form__file-input > div.md-field.md-theme-default')
        .exists()
    ).toBe(true)
    expect(label.at(0).find('div.md-field').attributes('style')).toBe(
      reduceSpacing
    )
    expect(
      label.at(0).find('.form__file-input > .md-field > md-icon-stub').text()
    ).toBe('attach_file')
    expect(
      label.at(0).find('.form__file-input > .md-field > div.md-file').exists()
    ).toBe(true)
    expect(
      label
        .at(0)
        .find('.form__file-input > .md-field > div.md-file > input')
        .attributes('type')
    ).toBe('file')
    expect(
      label.at(0).find('.form__file-input > .md-field > span.md-error').text()
    ).toBe('At least one file is required')
  })

  // @Todo

  // test('brings up dialog box to ask for confirm when file is added')
})
