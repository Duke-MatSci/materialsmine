import createWrapper from '../../../jest/script/wrapper'
import ClassesList from '@/components/ns/classes/ClassesList.vue'

describe('Classeslist.vue', () => {
  let wrapper
  describe('Classeslist mounted behaviour', () => {
    const highlightClass = jest.spyOn(ClassesList.methods, 'toggleClass')
    beforeEach(() => {
      wrapper = createWrapper(ClassesList, {}, false)
    })

    afterAll(async () => {
      await wrapper.destroy()
    })

    it('highlights selected class', () => {
      expect.assertions(2)
      expect(wrapper.exists()).toBe(true)
      expect(highlightClass).toHaveBeenCalled()
    })
  })

  describe('Classeslist with mock data', () => {
    beforeEach(() => {
      wrapper = createWrapper(ClassesList, {}, false)
      // Set classes
      wrapper.vm.$store.commit('ns/setClasses', classes)
    })

    afterAll(async () => {
      await wrapper.destroy()
    })

    it('renders Namespace Componenet ', () => {
      expect.assertions(5)
      const accordion = wrapper.findAllComponents('namespaceaccordion-stub')
      expect(accordion.length).toBe(classes.length)
      for (let i = 0; i < accordion.length; i++) {
        expect(accordion.at(i).props().id).toBe(classes[i].ID)
        expect(accordion.at(i).props().summary).toBe(
          classes[i]['Preferred Name']
        )
      }
    })

    it('renders toggles height of list ', async () => {
      expect.assertions(7)
      const button = wrapper.find('[data-test="toggle-list"]')

      expect(wrapper.vm.isListVisible).toBe(true)
      expect(button.find('.utility-color').text()).toBe('keyboard_arrow_up')
      expect(wrapper.find('div').attributes().class).not.toContain(
        'utility-roverflow'
      )

      await button.trigger('click.prevent')

      expect(wrapper.vm.isListVisible).toBe(false)
      expect(wrapper.find('.utility-color').text()).toBe('keyboard_arrow_down')
      expect(wrapper.find('div').attributes().class).toContain(
        'utility-roverflow'
      )
      expect(wrapper.find('div').attributes().style).toBe('max-height: 6rem;')
    })

    it('filters classes data into dropdown if search is successful ', async () => {
      expect.assertions(2)
      expect(wrapper.find('.search-dropdown-menu').exists()).toBe(false)

      await wrapper.setData({ searchKeyword: '1DSolidMechanicsModel' })

      expect(wrapper.find('.search-dropdown-menu').exists()).toBe(true)
    })
  })
})

const classes = [
  {
    subClasses: [
      {
        subClasses: [],
        ID: 'http://materialsmine.org/ns/Beam',
        prefixIRI: 'materialsmine:Beam',
        prefLabel: 'Beam',
        Label: 'Beam',
        'Preferred Name': 'Beam',
        Definitions:
          'A slender 1d structural element that primarily bears lateral loads.',
        subClassOf: 'http://materialsmine.org/ns/1DSolidMechanicsModel'
      }
    ],
    ID: 'http://materialsmine.org/ns/1DSolidMechanicsModel',
    prefixIRI: 'materialsmine:1DSolidMechanicsModel',
    prefLabel: '1D Solid Mechanics Model',
    Label: '1D Solid Mechanics Model',
    'Preferred Name': '1D Solid Mechanics Model',
    Definitions:
      'A one-dimensional model of a solid relating stress with strain.',
    subClassOf: 'http://www.w3.org/2002/07/owl#Thing'
  },
  {
    ID: 'http://materialsmine.org/ns/2DSolidMechanicsModel',
    subClasses: [
      {
        subClasses: [],
        ID: 'http://materialsmine.org/ns/SolidMechanicsModel',
        prefixIRI: 'materialsmine:SolidMechanicsModel',
        subClassOf: 'http://materialsmine.org/ns/2DSolidMechanicsModel',
        prefLabel: 'Solid Mechanics Model',
        Label: 'Solid Mechanics Model',
        'Preferred Name': 'Solid Mechanics Model',
        Definitions:
          'A model of a material/system that models interactions caused by forces resulting in stresses and strains.'
      }
    ],
    prefixIRI: 'materialsmine:2DSolidMechanicsModel',
    Definitions:
      'A two-dimensional mathematical model that assumes either out of plane strain or out of plane stress component is zero.',
    prefLabel: '2D Solid Mechanics Model',
    Label: '2D Solid Mechanics Model',
    'Preferred Name': '2D Solid Mechanics Model',
    subClassOf: 'http://www.w3.org/2002/07/owl#Thing'
  }
]
