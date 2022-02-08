import createWrapper from '../../../jest/script/wrapper'
import TeamsPage from '@/pages/nanomine/teams/Teams.vue'

var wrapper = null

describe('Teams.vue', () => {
  beforeAll(() => {
    wrapper = createWrapper(TeamsPage, { props: {}, slots: {} })
  })

  it('mounts properly', () => {
    expect(wrapper.exists()).toBeTruthy()
  })

  it('loads team members', () => {
    const teamsList = wrapper.get('.teams_list').get('ul')
    expect(teamsList.findAll('.teams_container').length).toBeGreaterThanOrEqual(6)
  })

  it('loads partners', () => {
    const partnerContainer = wrapper.get('.team_partner-container')
    expect(partnerContainer.findAll('.teams_partner').length).toBeGreaterThanOrEqual(4)
  })
})
