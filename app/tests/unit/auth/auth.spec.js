import createWrapper from '../../jest/script/wrapper'
import Auth from '@/auth/auth.vue'
import store from '@/store/index'

// spy on created method
const dispatch = jest.spyOn(store, 'dispatch').mockImplementation(() => {})

describe('auth.vue', () => {
  let wrapper
  beforeEach(async () => {
    wrapper = await createWrapper(Auth, {}, false)
  })

  it('dispatch properly', () => {
    expect(wrapper.find('div').exists()).toBe(true)
    expect(dispatch).toHaveBeenCalledWith('auth/authProcessor', undefined)
  })
})
