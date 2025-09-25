import createWrapper from '../../../jest/script/wrapper'
import { enableAutoDestroy } from '@vue/test-utils'
import FileDrop from '@/components/curate/FileDrop.vue'

describe('FileDrop.vue', () => {
  const slots = {
    default: '<div id="dropZone">File Drop Content</div>'
  }
  // Create a non-null file
  const fileContents = 'file contents'
  const file = new Blob([fileContents], { type: 'text/plain' })

  let wrapper
  beforeEach(() => {
    if (wrapper) {
      wrapper.destroy()
    }
    wrapper = createWrapper(FileDrop, { slots }, true)
  })

  enableAutoDestroy(afterEach)

  it('renders slot content', () => {
    expect(wrapper.text()).toBe('File Drop Content')
    const dropZone = wrapper.find('#dropZone')
    expect(dropZone.exists()).toBe(true)
  })

  it('registers file drop', async () => {
    wrapper.find('#dropZone').trigger('drop', { dataTransfer: { files: [file] } })
    const pageEvent = wrapper.emitted('files-dropped')
    expect(pageEvent.length).toBe(1)
  })
})
