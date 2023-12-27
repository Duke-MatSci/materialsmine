import createWrapper from '../../../jest/script/wrapper'
import { enableAutoDestroy } from '@vue/test-utils'

import Xml from '@/pages/explorer/xml/Xml.vue'

let wrapper = null

describe('Xml.vue', () => {
  enableAutoDestroy(afterEach)

  describe('Xml.vue delete curation Funtion', () => {
    beforeEach(async () => {
      wrapper = createWrapper(
        Xml,
        {
          mocks: {
            $apollo: {
              loading: false,
              queries: {
                xmlFinder: {
                  refetch: jest.fn()
                }
              }
            }
          },
          stubs: {
            pagination: true,
            dialogBox: { template: '<div id="dialogBox"><slot/></div>' }
          }
        },
        true
      )
      wrapper.setData({ xmlFinder })
      await wrapper.vm.$store.commit('auth/setUser', {
        token: 'Randomtoken',
        userId: 'userId',
        displayName: 'Test user'
      })
      // wrapper.$store.commit()
    })

    afterEach(async () => {
      // wrapper.destroy()
      await jest.resetAllMocks()
    })

    it('mounts properly and renders the right card numbers', () => {
      expect(wrapper.exists()).toBeTruthy()
      expect(wrapper.findAll('div.md-card.btn--animated.gallery-item'))
    })

    it('conditionally shows the delete icon if auth and card author is logged in', () => {
      const cards = wrapper.findAll('div.md-card.btn--animated.gallery-item')
      const xmldata = xmlFinder.xmlData
      const iconClass = '.md-icon.md-icon-font.md-theme-default'
      // user is logged in
      expect(wrapper.vm.isAuth).toBeTruthy()
      for (let i = 0; i < cards.length; i++) {
        if (xmldata[i].user === 'userId') {
          expect(cards.at(i).findAll(iconClass).length).toBe(3)
          expect(cards.at(i).findAll(iconClass).at(1).text()).toContain(
            'delete'
          )
        } else {
          expect(cards.at(i).findAll(iconClass).length).toBe(1)
        }
      }
    })

    it('opens dialog box when delete button is clicked ', async () => {
      const xmldata = xmlFinder.xmlData
      const cards = wrapper.findAll('div.md-card.btn--animated.gallery-item')
      const deleteBtn = cards.at(0).find('.u_gridicon').findAll('div').at(2)

      const spy = jest
        .spyOn(wrapper.vm, 'openDialogBox')
        .mockImplementation(() => {})
      await deleteBtn.trigger('click')

      expect(spy).toHaveBeenCalled()
      expect(spy).toHaveBeenCalledWith(xmldata[0].id, xmldata[0].isNewCuration)
    })

    it('opens dialog box when delete button is clicked ', async () => {
      const xmldata = xmlFinder.xmlData
      const cards = wrapper.findAll('div.md-card.btn--animated.gallery-item')
      const deleteBtn = cards.at(0).find('.u_gridicon').findAll('div').at(2)

      const spy = jest
        .spyOn(wrapper.vm, 'openDialogBox')
        .mockImplementation(() => {})
      await deleteBtn.trigger('click')

      expect(spy).toHaveBeenCalled()
      expect(spy).toHaveBeenCalledWith(xmldata[0].id, xmldata[0].isNewCuration)
    })

    it('openDialogBox method brings up a confirmation block ', async () => {
      const xmldata = xmlFinder.xmlData
      const toggleDialogBox = jest.spyOn(wrapper.vm, 'toggleDialogBox')
      expect(wrapper.vm.dialogBoxAction).toBe(null)
      expect(wrapper.vm.dialogBoxActive).toBe(false)

      await wrapper.vm.openDialogBox(xmldata[0].id, xmldata[0].isNewCuration)

      expect(wrapper.vm.dialogBoxAction).not.toBe(null)
      expect(wrapper.vm.dialogBoxActive).toBe(true)
      expect(toggleDialogBox).toHaveBeenCalled()
    })

    it('closeDialogBox method cancels the process', async () => {
      const toggleDialogBox = jest.spyOn(wrapper.vm, 'toggleDialogBox')
      expect(wrapper.vm.dialogBoxActive).toBe(true)
      expect(wrapper.find('#dialogBox').exists()).toBe(true)

      // call directly the function assigned to the dialog box cancel button
      await wrapper.vm.closeDialogBox()

      expect(toggleDialogBox).toHaveBeenCalledTimes(1)
      expect(wrapper.vm.dialogBoxAction).toBe(null)
      expect(wrapper.vm.dialogBoxActive).toBe(false)
    })

    it('confirmAction method calls the right method', async () => {
      const xmldata = xmlFinder.xmlData
      const cards = wrapper.findAll('div.md-card.btn--animated.gallery-item')
      const deleteBtn = cards.at(0).find('.u_gridicon').findAll('div').at(2)
      const openDialogBox = jest.spyOn(wrapper.vm, 'openDialogBox')
      const toggleDialogBox = jest.spyOn(wrapper.vm, 'toggleDialogBox')
      const deleteXmlCuration = jest
        .spyOn(wrapper.vm, 'deleteXmlCuration')
        .mockImplementation(() => {})

      // click delete btn
      await deleteBtn.trigger('click')

      // expect confirmation box
      expect(openDialogBox).toHaveBeenCalled()
      expect(toggleDialogBox).toHaveBeenCalled()
      expect(wrapper.vm.dialogBoxActive).toBe(true)
      expect(wrapper.find('#dialogBox').exists()).toBe(true)

      // call directly the function assigned to the dialog box Confirm button
      await wrapper.vm.confirmAction()

      expect(toggleDialogBox).toHaveBeenCalled()
      expect(deleteXmlCuration).toHaveBeenCalledWith(
        xmldata[0].id,
        xmldata[0].isNewCuration
      )
      expect(wrapper.vm.dialogBoxAction).toBe(null)
      expect(wrapper.vm.dialogBoxActive).toBe(false)
    })
  })
})

const xmlFinder = {
  totalItems: 400,
  pageSize: 4,
  pageNumber: 1,
  totalPages: 100,
  hasPreviousPage: false,
  hasNextPage: true,
  xmlData: [
    {
      id: '6565e212a6c1e5c3471658af',
      title: 'Test',
      isNewCuration: true,
      sequence: null,
      status: 'Not Approved',
      user: 'userId',
      __typename: 'XmlCatalogs'
    },
    {
      id: '58587cfee74a1d205f4eae8d',
      isNewCuration: false,
      title: "L175_S8_O'Reilly_2015.xml",
      entityState: 'EditedValid',
      status: 'Not Approved',
      user: 'userId',
      sequence: 175,
      __typename: 'XmlCatalogs'
    },
    {
      id: '583e3adde74a1d205f4e3a99',
      isNewCuration: false,
      title: 'L183_S11_Poetschke_2003.xml',
      entityState: 'EditedValid',
      status: 'Not Approved',
      user: '6501cc8b21b1c08de4732093',
      sequence: 183,
      __typename: 'XmlCatalogs'
    },
    {
      id: '583e38c4e74a1d205f4e3034',
      isNewCuration: false,
      title: 'L183_S5_Poetschke_2003.xml',
      entityState: 'EditedValid',
      status: 'Not Approved',
      user: '6501cc8b21b1c08de4732093',
      sequence: 183,
      __typename: 'XmlCatalogs'
    }
  ],
  __typename: 'XmlDataList'
}
