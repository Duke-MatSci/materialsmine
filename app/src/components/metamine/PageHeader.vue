<template>
  <div class="viz-u-postion__rel">
    <md-toolbar
      class="md-app-toolbar md-large md-dense md-primary md-theme-default adjust_metamine-toolbar"
    >
      <div class="md-toolbar-row">
        <div class="contactus_radios md-card-actions">
          <md-button class="md-icon-button" @click="toggleMenu">
            <md-icon class="metamine_menu-icon">menu</md-icon>
          </md-button>
          <router-link to="/mm"
            ><span class="md-title adjust_metamine-title">MetaMine</span></router-link
          >
        </div>
        <div class="md-toolbar-section-end">
          <div>
            <nav class="nav_menu nav_menu--lightbg">
              <ul class="nav_ul" style="width: 100%">
                <li>
                  <div class="nav_menu--container">
                    <a class="u--default-size nav_menu--handler" href="#">ABOUT</a>
                    <div class="nav_menu--siblings-mm">
                      <router-link to="/mm/teams" class="nav_menu--siblings-mm-lists">
                        About Us
                      </router-link>
                      <router-link to="/nm/how" class="nav_menu--siblings-mm-lists">
                        How To
                      </router-link>
                    </div>
                  </div>
                </li>
                <li>
                  <div class="nav_menu--container">
                    <a class="u--default-size nav_menu--handler" href="#">VISUALIZE</a>
                    <div class="nav_menu--siblings-mm">
                      <router-link to="/explorer" class="nav_menu--siblings-mm-lists">
                        Browse Data
                      </router-link>
                      <router-link
                        to="/mm/metamaterial_visualization_nu"
                        class="nav_menu--siblings-mm-lists"
                      >
                        Material Visualization
                      </router-link>
                      <router-link to="/explorer/dataset" class="nav_menu--siblings-mm-lists">
                        Explore Curated Datasets
                      </router-link>
                    </div>
                  </div>
                </li>
                <li>
                  <div class="nav_menu--container">
                    <a class="u--default-size nav_menu--handler" href="#">TOOLS</a>
                    <div class="nav_menu--siblings-mm">
                      <router-link to="/mm/pixelunit" class="nav_menu--siblings-mm-lists">
                        Geometry Explorer
                      </router-link>
                    </div>
                  </div>
                </li>
                <li>
                  <div class="nav_menu--container">
                    <a class="u--default-size nav_menu--handler" href="/nm/contact">CONTACT US</a>
                  </div>
                </li>
                <li>
                  <div class="nav_menu--container">
                    <a v-if="!isAuth" class="u--default-size nav_menu--handler" href="/secure">
                      <md-icon class="metamine_menu-icon">person</md-icon>
                      LOGIN/REGISTER
                    </a>
                    <a
                      v-else
                      class="u--default-size nav_menu--handler"
                      @click="store.dispatch('auth/logout')"
                    >
                      Hi {{ displayName }}
                    </a>
                  </div>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </md-toolbar>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';

defineOptions({
  name: 'MetaminePageHeader',
});

interface Props {
  toggleMenu: () => void;
}

const props = defineProps<Props>();

const store = useStore();
const isAuth = computed(() => store.state.auth.isAuth);
const displayName = computed(() => store.state.auth.displayName);
</script>
