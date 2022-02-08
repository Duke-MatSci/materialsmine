import _ from 'lodash'
import VueMaterial from 'vue-material'
import store from '@/store'
import router from '@/router'
import { mount, createLocalVue, shallowMount } from '@vue/test-utils'

/** Add external plugins as needed */
const localVue = createLocalVue()
localVue.use(VueMaterial)

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
    // mocks: {
    //     $router: _.merge({ push: jest.fn() }, overrides.router || {})
    // },
    router,
    store,
    propsData: _.merge({}, overrides)
  }
  return mountType(component, defaultMountOptions)
}

export default createWrapper
