/** Below are just examples. Please comment all out before push
 * to avoid unneccessary test. Two options are provided below
 */

import { mount } from '@vue/test-utils'
import HelloWorld from '@/components/HelloWorld.vue'

/** Option 1 */
describe('Header.vue', () => {
  it('renders props.msg when passed', () => {
    const msg = 'Testing'
    const wrapper = mount(HelloWorld, {
      propsData: { msg }
    })
    expect(wrapper.text()).toMatch(msg)
  })
  it('add new item to movies', () => {
    const msg = 'James Bond'
    const wrapper = mount(HelloWorld)
    const existingMovies = wrapper.vm.movies
    wrapper.setData({ movies: [...existingMovies, msg] })
    expect(wrapper.vm.movies.length).toEqual(3)
    // expect(wrapper.vm.movies).toMatchSnapshot()
  })
  it('check h1 inside helloworld.vue', () => {
    const wrapper = mount(HelloWorld)
    expect(wrapper.html('h1').match('Testing'))
    /** examples of other test to perform
     * expect(data).toBeTruthy()
     * expect(data.length).toBeGreaterThan(0)
     * expect(request.method).toEqual('GET')
     * expect(windowRefService).toBeTruthy()
     * expect(result.length).toBe(4)
     * */
  })
})

/** Option 2:
 * In the example below we mount component once and make it available
 * for each test cases using before each.
 */
// describe('Header.vue', () => {

//   beforeEach(() => {
//     const wrapper = mount(HelloWorld)
//   })
//   afterEach(() => {
//     // perform some task if you need to as well
//   })
//   it('renders props.msg when passed', () => {
//     const msg = 'Testing'
//     wrapper.setProps({msg})
//     expect(wrapper.text()).toMatch(msg)
//   })
//   it('add new item to movies', () => {
//     const msg = 'James Bond'
//     const existingMovies = wrapper.vm.movies
//     wrapper.setData({ movies: [...existingMovies, msg] })
//     expect(wrapper.vm.movies.length).toEqual(3)
//     expect(wrapper.vm.movies).toMatchSnapshot()
//   })
//   it('check h1 inside helloworld.vue', () => {
//     expect(wrapper.html('h1').match('Testing'))
//   })
// })
