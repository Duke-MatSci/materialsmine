import { mount } from '@vue/test-utils'
import HelloWorld from '@/components/HelloWorld.vue'

describe('Header.vue', () => {
  it('renders props.msg when passed', () => {
    const msg = 'Testing'
    const wrapper = mount(HelloWorld, {
      propsData: { msg }
    })
    expect(wrapper.text()).toMatch(msg)
  })
  it('add new item to list', () => {
    const msg = 'James Bond'
    const wrapper = mount(HelloWorld)
    const existingMovies = wrapper.vm.movies
    wrapper.setData({movies: [...existingMovies, msg]})
    expect(wrapper.vm.movies.length).toEqual(3)
  })
  it('check h1 inside helloworld.vue', () => {
    const wrapper = mount(HelloWorld)
    expect(wrapper.html('h1').match('Testing'))
  })
})