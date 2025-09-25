<template>
  <div class="section_teams">
    <div class="wrapper u--margin-neglg">
      <div>
        <h1 class="visualize_header-h1">
          Leveraging Data Resources for Functional Polymers and
          Polymer Nanocomposite Research—Principles and Examples
        </h1>
      </div>
      <div class="howto_item-header teams_text teams_header">
        <a href="https://www.mrs.org/meetings-events/spring-meetings-exhibits/2022-mrs-spring-meeting/symposium-sessions/tutorial-sessions-detail/2022_mrs_spring_meeting/sf04/tutorial-sf04-leveraging-data-resources-for-functional"
          target="_blank">Tutorial details</a>
      </div>
      <div class="howto_item-header teams_text">
        <a href="https://bit.ly/NMTUTORIAL" target="_blank">Tutorial handout</a>
      </div>
      <a class="u--color-primary" target="_blank"
        href="https://www.mrs.org/meetings-events/spring-meetings-exhibits/past-spring-meetings/2022-mrs-spring-meeting">
        <div class="teams_text teams_header">
          2022 Materials Research Society Spring Meeting & Exhibit
        </div>
        <div class="teams_text teams_header">
          Sunday, May 8, 2022
        </div>
        <div class="teams_text">
          Honolulu, Hawaii
        </div>
      </a>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MRS2022',
  created () {
    this.$store.commit('setAppHeaderInfo', { icon: 'co_present', name: 'MRS Conference 2022' })
  }
}
</script>
