<template>
  <md-list class="md-dense">
    <li class="md-list-item">
      <router-link mdripple="true" to="/portal" class="md-list-item-link md-list-item-container md-button-clean">
        <div class="md-list-item-content md-list-item-content-reduce u--layout-flex-justify-fs md-ripple">
          <i class="md-icon md-icon-font u--default-size md-theme-default">manage_accounts</i>
          <span class="md-body-1 u--color-black u--margin-neg-left">Account</span>
        </div>
      </router-link>
    </li>
    <li class="md-list-item">
      <router-link mdripple="true" to="/portal/deploy" class="md-list-item-link md-list-item-container md-button-clean">
        <div class="md-list-item-content md-list-item-content-reduce u--layout-flex-justify-fs md-ripple">
          <i class="md-icon md-icon-font u--default-size md-theme-default">settings</i>
          <span class="md-body-1 u--color-black u--margin-neg-left">Deploy</span>
        </div>
      </router-link>
    </li>

    <div class="u_width--max" v-for="(link, index) in links" :key="index + 'D'">

      <div class="u--font-emph-l u_margin-top-small u--padding-rl-xs-mobile" md-elevation="0">
        <span class="md-body-2 u--color-grey-sec">{{ link.name }}</span>
      </div>
      <md-divider></md-divider>

      <li class="md-list-item" v-for="(child, i) in link.children" :key="i">
        <router-link mdripple="true" :to="child.link" class="md-list-item-link md-list-item-container md-button-clean">
          <div class="md-list-item-content md-list-item-content-reduce u--layout-flex-justify-fs md-ripple">
            <i class="md-icon md-icon-font u--default-size md-theme-default">{{ child.icon }}</i>
            <span class="md-body-1 u--color-black u--margin-neg-left">{{ child.name }}</span>
          </div>
        </router-link>
      </li>
    </div>
  </md-list>
</template>

<script>
export default {
  name: 'SideNav',
  props: ['sideBar'],
  data () {
    return {
      links: [
        {
          name: 'Chart',
          children: [
            { name: 'Manage Charts', link: '/portal/manage-chart', icon: 'question_answer' },
            { name: 'Delete Charts', link: '/portal/delete-chart', icon: 'chat_bubble_outline' }
          ]
        },
        {
          name: 'Curation',
          children: [
            { name: 'Manage Curation', link: '/portal/manage-curation', icon: 'upload' },
            { name: 'View Curation', link: '/portal/view-curation', icon: 'track_changes' }
          ]
        },
        {
          name: 'Enquiries',
          children: [
            { name: 'Contact Enquiries', link: '/portal/contact-inquiry', icon: 'contact_mail' },
            { name: 'Resolved Enquiries', link: '/portal/resolved-inquiries', icon: 'question_answer' }
          ]
        },
        {
          name: 'User',
          children: [
            { name: 'Manage User', link: '/portal/users', icon: 'people' }
          ]
        }
      ]
    }
  }
}
</script>
