import createWrapper from '../../../jest/script/wrapper'
import { enableAutoDestroy } from '@vue/test-utils'
import MultipleInputComponent from '@/components/explorer/MultipleInputComponent.vue'

describe('MultipleInputComponent.vue with input type string', async () => {
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
      MultipleInputComponent,
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

  it('it renders Input component, text input and label', async () => {
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

  it('InputComponent input elememt is reactive and bound to the inputObj property named cellValue', async () => {
    var text = 'sampletext'
    const input = wrapper.find('input')
    expect(wrapper.vm.inputObj.cellValue).toBe(inputObj.cellValue)
    await input.setValue(text)
    expect(wrapper.vm.inputObj.cellValue).toBe(text)
  })
})
