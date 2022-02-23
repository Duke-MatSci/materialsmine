import createWrapper from '../../../jest/script/wrapper'
import ReferenceContainer from '@/components/nanomine/ReferenceContainer.vue'

var wrapper = null
// global.console = {
//   log: jest.fn(), // console.log are ignored in tests

//   // Keep native behavior for other methods
//   error: console.error,
//   warn: console.warn,
//   info: console.info,
//   debug: console.debug
// }

const referenceProp = [
  {
    authors: 'Lee, W. K., Yu, S., Engel, C. J., Reese, T., Rhee, D., Chen, W., & Odom, T. W.',
    title: 'Concurrent design of quasi-random photonic nanostructures',
    venue: 'Proceedings of the National Academy of Sciences, 114(33), 8734-8739',
    date: '2017'
  },
  {
    authors: 'Li, X., Zhang, Y., Zhao, H., Burkhart, C., Brinson, L.C., Chen, W.',
    title: 'A Transfer Learning Approach for Microstructure Reconstruction and Structure-property Predictions',
    venue: 'Scientific Report',
    date: '2018'
  }
]

const textMatch = new RegExp(referenceProp[0].title)

describe('ReferenceContainer.vue', () => {
  beforeAll(() => {
    wrapper = createWrapper(ReferenceContainer, {
      props: {
        references: referenceProp,
        openOnLoad: false
      }
    })
  })

  it('mounts properly', () => {
    expect(wrapper.exists()).toBeTruthy()
  })

  it('does not display until opened', () => {
    expect(wrapper.text()).not.toMatch(textMatch)
  })

  it('opens when told to, displays correct data', async () => {
    const referenceHeader = wrapper.find('h4')
    expect(referenceHeader.exists()).toBeTruthy()
    await referenceHeader.trigger('click')
    expect(wrapper.text()).toMatch(textMatch)
  })

  it('handles empty reference prop', async () => {
    wrapper.setProps({ references: [] })
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toEqual('')
  })
})

describe('ReferenceContainer.vue', () => {
  beforeAll(() => {
    wrapper = createWrapper(ReferenceContainer, {
      props: {
        references: referenceProp,
        openOnLoad: true
      }
    })
  })

  it('opens on load when told to', () => {
    expect(wrapper.text()).toMatch(textMatch)
  })

  it('closes when told to', async () => {
    const referenceHeader = wrapper.find('h4')
    expect(referenceHeader.exists()).toBeTruthy()
    await referenceHeader.trigger('click')
    expect(wrapper.text()).not.toMatch(textMatch)
  })
})
