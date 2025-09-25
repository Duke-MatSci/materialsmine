import createWrapper from '../../../jest/script/wrapper'
import { enableAutoDestroy } from '@vue/test-utils'
import { classes } from '../../../jest/__mocks__/nsMock'
import Visualize from '@/pages/ns/Visualize.vue'

const classMock = [...classes]

const totalNodeLength = () => {
  let count = classMock.length

  for (let i = 0; i < count; i++) {
    const element = classMock[i]
    const childCount = element?.subClasses.length ?? 0 // Get the length of subClasses for each element
    count += childCount // Add the number of subClasses to the count
  }

  return count
}

describe('Visualize.vue', async () => {
  let wrapper
  const mountMethod = jest.spyOn(Visualize.methods, 'formatClassData')
  const createNode = jest.spyOn(Visualize.methods, 'createNode')
  beforeEach(async () => {
    wrapper = createWrapper(
      Visualize,
      {
        stubs: {
          Cytoscape: {
            template: '<section data-test="cytoscape"><slot/></section>'
          },
          CyElement: {
            template: '<div data-test="cy-element" ><slot/></div>'
          }
        }
      },
      false
    )
    await wrapper.setData({ loading: false })
  })

  enableAutoDestroy(afterEach)

  describe('Visualize.vue without class Data', async () => {
    it('call attempts to format the classes data on mount', () => {
      expect.assertions(4)
      // Expect store data to be empty
      expect(wrapper.vm.classes.length).toBe(0)

      // Attempts to format empty data
      expect(mountMethod).toHaveBeenCalledTimes(1)
      expect(createNode).toHaveBeenCalledTimes(0)

      // Results
      expect(wrapper.vm.elements.length).toBe(0)
    })

    it('mount header text properly', () => {
      expect.assertions(3)

      const titleContainer = wrapper.find('div.wrapper.viz-u-postion__rel')
      expect(titleContainer.exists()).toBe(true)

      const h1 = titleContainer.find('h1')
      expect(h1.attributes('class')).toEqual(
        'visualize_header-h1 article_title u_centralize_text'
      )
      expect(h1.text()).toMatch('Ontology Visualization')
    })

    it('mount empty text on empty state', () => {
      expect.assertions(4)
      const emptyDiv = wrapper.find('div.md-empty-state')
      expect(emptyDiv.exists()).toBe(true)

      const containter = emptyDiv.find('div.md-empty-state-container')
      expect(containter.exists()).toBe(true)

      expect(containter.find('strong.md-empty-state-label').text()).toBe(
        'No Data'
      )
      expect(containter.find('p.md-empty-state-description').text()).toBe(
        'No Ontology Data Found'
      )
    })
  })

  describe('Visualize.vue with classes Data', () => {
    const createNodeObj = jest.spyOn(Visualize.methods, 'createNodeObj')
    const createLineObj = jest.spyOn(Visualize.methods, 'createLineObj')
    const nodeLength = totalNodeLength()

    beforeAll(async () => {
      // 1. Set the class data from store
      await wrapper.vm.$store.commit('ns/setClasses', classMock)
      // 2. Call the Mounted method
      await wrapper.vm.formatClassData()
    })
    it('calls the right methods to format the class data', () => {
      // expect.assertions(4)
      expect(createNode).toHaveBeenNthCalledWith(1, wrapper.vm.classes)
      expect(createNodeObj).toHaveBeenCalledTimes(nodeLength)
      expect(createLineObj).toHaveBeenCalled()
    })

    it('still renders header text properly', () => {
      expect.assertions(3)

      const titleContainer = wrapper.find('div.wrapper.viz-u-postion__rel')
      expect(titleContainer.exists()).toBe(true)

      const h1 = titleContainer.find('h1')
      expect(h1.text()).toMatch('Ontology Visualization')
      expect(h1.attributes('class')).toEqual(
        'visualize_header-h1 article_title u_centralize_text'
      )
    })

    it('does not render empty', () => {
      expect.assertions(3)
      expect(wrapper.find('div.md-empty-state').exists()).toBe(false)

      expect(wrapper.find('strong.md-empty-state-label').exists()).toBe(false)
      expect(wrapper.find('p.md-empty-state-description').exists()).toBe(false)
    })

    it('renders canvas and node object', () => {
      expect.assertions(3)
      expect(wrapper.find('[data-test="cytoscape"]').exists()).toBe(true)
      expect(wrapper.find('[data-test="cy-element"]').exists()).toBe(true)
      expect(wrapper.findAll('[data-test="cy-element"]').length).toBe(
        wrapper.vm.elements.length
      )
    })
  })
})
