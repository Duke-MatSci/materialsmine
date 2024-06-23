<template>
  <div class="utility-roverflow">
    <md-app-drawer
      class="u_toggle-display-off"
      :md-active.sync="sideBar"
      md-permanent="clipped"
    >
      <md-list class="md-dense">
        <li class="md-list-item">
          <router-link
            mdripple="true"
            to="/portal"
            class="md-list-item-link md-list-item-container md-button-clean"
          >
            <div
              class="md-list-item-content md-list-item-content-reduce u--layout-flex-justify-fs md-ripple"
            >
              <i class="md-icon md-icon-font u--default-size md-theme-default"
                >manage_accounts</i
              >
              <span class="md-body-1 u--color-black u--margin-neg-left"
                >Account</span
              >
            </div>
          </router-link>
        </li>

        <div
          class="u_width--max"
          v-for="(link, index) in links"
          :key="index + 'D'"
        >
          <div
            class="u--font-emph-l u_margin-top-small u--padding-rl-xs-mobile"
            md-elevation="0"
          >
            <span class="md-body-2 u--color-grey-sec">{{ link.name }}</span>
          </div>
          <md-divider></md-divider>

          <li class="md-list-item" v-for="(child, i) in link.children" :key="i">
            <router-link
              mdripple="true"
              :to="child.link"
              class="md-list-item-link md-list-item-container md-button-clean"
            >
              <div
                class="md-list-item-content md-list-item-content-reduce u--layout-flex-justify-fs md-ripple"
              >
                <i
                  class="md-icon md-icon-font u--default-size md-theme-default"
                  >{{ child.icon }}</i
                >
                <span class="md-body-1 u--color-black u--margin-neg-left">{{
                  child.name
                }}</span>
              </div>
            </router-link>
          </li>
          <li
            class="md-list-item"
            v-for="(child, i) in link.hrefChildren"
            :key="i + 'h'"
          >
            <a
              mdripple="true"
              :href="child.href"
              class="md-list-item-link md-list-item-container md-button-clean"
            >
              <div
                class="md-list-item-content md-list-item-content-reduce u--layout-flex-justify-fs md-ripple"
              >
                <i
                  class="md-icon md-icon-font u--default-size md-theme-default"
                  >{{ child.icon }}</i
                >
                <span class="md-body-1 u--color-black u--margin-neg-left">{{
                  child.name
                }}</span>
              </div>
            </a>
          </li>
        </div>
      </md-list>
    </md-app-drawer>

    <div class="footer_content-mobile u_myprofile--image">
      <nav class="nav_menu">
        <ul class="u_centralize_text">
          <li
            class="u_margin-right-small"
            v-for="(link, index) in links"
            :key="index + 'e'"
          >
            <div class="nav_menu--container">
              <a class="u--default-size nav_menu--handler u--color-primary">
                <span class="u--color-primary">{{ link.name }} </span>
              </a>
              <div
                v-if="!!link.children && !!link.children.length"
                class="nav_menu--siblings"
              >
                <router-link
                  v-for="(child, i) in link.children"
                  :key="i + 'i'"
                  :to="child.link"
                  class="nav_menu--siblings-lists"
                  ><a>{{ child.name }}</a></router-link
                >
              </div>
            </div>
          </li>
        </ul>
      </nav>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SideNav',
  data() {
    return {
      sideBar: false,
      links: [
        {
          name: 'Deploy',
          children: [
            {
              name: 'General Deployment',
              link: '/portal/general-deployment',
              icon: 'launch'
            },
            {
              name: 'Ontology Deployment',
              link: '/portal/ontology-deployment',
              icon: 'webhook'
            }
          ]
        },
        {
          name: 'Chart',
          children: [
            {
              name: 'Manage Charts',
              link: '/portal/manage-chart',
              icon: 'question_answer'
            },
            {
              name: 'Favorite Charts',
              link: '/portal/favoritechart',
              icon: 'bookmark'
            }
          ]
        },
        {
          name: 'Curation',
          children: [
            {
              name: 'Manage Curation',
              link: '/portal/manage-curation',
              icon: 'upload'
            },
            // {
            //   name: 'View Curation',
            //   link: '/portal/view-curation',
            //   icon: 'track_changes'
            // },
            { name: 'View Schema', link: '/portal/view-schema', icon: 'schema' }
          ]
          // hrefChildren: [
          //   {
          //     name: 'File Store',
          //     href: '/api/admin/store',
          //     icon: 'folder_open'
          //   }
          // ]
        },
        {
          name: 'Enquiries',
          children: [
            {
              name: 'Contact Enquiries',
              link: '/portal/contact-inquiry',
              icon: 'contact_mail'
            },
            {
              name: 'Resolved Enquiries',
              link: '/portal/resolved-inquiries',
              icon: 'question_answer'
            }
          ]
        },
        {
          name: 'User',
          children: [
            { name: 'Manage User', link: '/portal/users', icon: 'people' }
          ]
        }
      ]
    };
  }
};
</script>
