import createWrapper from '../../../jest/script/wrapper'
import { enableAutoDestroy } from '@vue/test-utils'
import FilePreview from '@/components/curate/FilePreview.vue'

describe('FilePreview.vue', () => {
  // Create a non-null file
  const fileContents = 'file contents'
  const file = new Blob([fileContents], { type: 'text/plain' })
  file.name = 'Test File'
  const defaultProps = {
    file: { file }
  }
  let wrapper
  beforeEach(() => {
    if (wrapper) {
      wrapper.destroy()
    }
    wrapper = createWrapper(FilePreview, { props: defaultProps }, true)
  })
  enableAutoDestroy(afterEach)

  it('renders file information and button', () => {
    expect(wrapper.text()).toContain(file.name)
    const removeButton = wrapper.find('#removeFile')
    expect(removeButton.exists()).toBe(true)
  })

  it('registers removing file', async () => {
    wrapper.find('#removeFile').trigger('click')
    const pageEvent = wrapper.emitted('remove')
    expect(pageEvent.length).toBe(1)
  })
})
