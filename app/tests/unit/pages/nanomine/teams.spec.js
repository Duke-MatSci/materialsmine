import { mount, createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'
import TeamsPage from '@/pages/teams/Teams.vue'
import store from '@/store'

const localVue = createLocalVue()
localVue.use(Vuex)

describe('Teams.vue', () => {
  it('mounts properly', () => {
    const wrapper = mount(TeamsPage, { store, localVue })
    expect(wrapper.exists()).toBeTruthy()
  })

  it('loads team members', () => {
    const wrapper = mount(TeamsPage, { store, localVue })
    const teamsList = wrapper.get('.teams_list').get('ul')
    expect(teamsList.findAll('.teams_container').length).toBeGreaterThanOrEqual(6)
  })

  it('loads partners', () => {
    const wrapper = mount(TeamsPage, { store, localVue })
    const partnerContainer = wrapper.get('.team_partner-container')
    expect(partnerContainer.findAll('.teams_partner').length).toBeGreaterThanOrEqual(4)
  })
})
