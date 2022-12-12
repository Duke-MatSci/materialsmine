import _ from 'lodash'
import Vuex from 'vuex'
import VueMaterial from 'vue-material'
import store from '@/store'
import router from '@/router'
import { mount, createLocalVue, shallowMount, RouterLinkStub } from '@vue/test-utils'

/** Add external plugins as needed */
// Using localVue to protect polluting global vue instance
const localVue = createLocalVue()
localVue.use(VueMaterial)
localVue.use(Vuex)

/**
 * createWrapper - creates a default mount wrapper for all components
 * @param {*} component vue component to test
 * @param {*} overrides props override
 * @param {Boolean} useMount true for mount and false for shallowMount
 * @returns {*} Vue Wrapper
 */
function createWrapper (component, overrides, useMount = true) {
  const mountType = !useMount ? shallowMount : mount
  const defaultMountOptions = {
    localVue,
    mocks: {
    //     $router: _.merge({ push: jest.fn() }, overrides.router || {})
      ...(overrides.mocks || {})
    },
    router,
    store,
    propsData: _.merge({}, overrides.props),
    slots: _.merge({}, overrides.slots),
    stubs: _.merge({ RouterLink: RouterLinkStub }, overrides.stubs)
  }
  return mountType(component, defaultMountOptions)
}

export default createWrapper
