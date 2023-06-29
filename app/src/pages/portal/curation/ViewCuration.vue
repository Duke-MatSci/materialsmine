<template>
  <div class="">
    <div class=" viz-u-mgup-sm utility-margin md-theme-default">
      <div class="md-card-header contactus_radios md-card-header-flex">
        <div class="md-card-header-text">
          <div class="md-layout-item_para_fl u--color-grey wrapper--medium">
            View and search all valid curation samples.
          </div>
        </div>
      </div>

      <md-divider class="u_margin-top-small"></md-divider>
    </div>
    <search-gallery :searchForm="false" :isEmpty="isEmpty" :totalItems="xmlFinder.totalItems || 0" :loading="loading" :error="!!error" :dense="true">

      <template #page_input>
        <input type="number" id="pagesize" class="u_width--xs utility-navfont" name="pagesize" v-model.lazy="pageSize" min="1" max="20">
      </template>

      <template v-if="!!Object.keys(xmlFinder).length && !!xmlFinder.xmlData.length">
        <md-card
          v-for="(xml, index) in xmlFinder.xmlData"
          :key="index"
          class="btn--animated gallery-item viz-u-mgup-md u_margin-none"
        >
          <router-link :to="{ name: 'XmlGallery', query: { page: 1, size: 20, q: xml.groupId }}">
            <md-card-media-cover md-solid>
              <div class="u_gridicon">
                <div>
                  <p class="u--color-primary u_margin-none u--padding-zero u_content__result"><strong>Last updated: </strong>{{ new Date().toLocaleDateString() }}</p>
                </div>

              </div>
              <md-card-media md-ratio="4:3">
                <div class="viz-u-postion__abs u--layout-flex md-layout md-alignment-center-left u_centralize_content u_width--max search_box_link u_height--max" style="top:0px">
                  <div class="viz-u-postion__rel u--layout-flex md-layout u_centralize_content u_width--max">
                    <template v-if="xml.samples > 8">
                      <div v-for="n in 8" :key="n" class="u_margin-top-small md-layout-item md-size-25 viz-u-postion__rel CodeMirror">
                        <md-icon class="u--color-primary media-icon-mod viz-u-postion__rel u_icon_mobile_lg ">description</md-icon>
                      </div>
                    </template>
                    <template v-else>
                      <div v-for="n in xml.samples" :key="n" class="u_margin-top-small md-layout-item md-size-25 viz-u-postion__rel CodeMirror">
                        <md-icon class="u--color-primary media-icon-mod viz-u-postion__rel u_icon_mobile_lg">description</md-icon>
                      </div>
                    </template>
                  </div>
                </div>
              </md-card-media>
              <md-card-area class="u_gridbg search-dropdown-menu_parent viz-u-postion__abs">
                <div class="md-card-actions u_show_hide viz-u-display__show">
                  <span class="md-body-2">
                    {{ xml.samples > 1 ? `${xml.samples} samples` : `${xml.samples} sample`}}
                  </span>
                  <span class="md-body-1">Approved: {{ xml.approved }} </span>
                </div>
              </md-card-area>
            </md-card-media-cover>
          </router-link>
        </md-card>
      </template>

      <template #pagination>
        <pagination v-if="xmlFinder && xmlFinder.xmlData"
          :cpage="pageNumber"
          :tpages="xmlFinder.totalPages || 1"
          @go-to-page="loadPrevNextImage($event)"
        />
      </template>

      <template #errorMessage>{{ !!error ? 'Cannot Load Xml List' : 'Sorry! No Xml Found' }}</template>

    </search-gallery>
  </div>
</template>

<script>
import pagination from '@/components/explorer/Pagination'
import SearchGallery from '@/components/SearchGallery.vue'
export default {
  name: 'Deploy',
  components: {
    SearchGallery,
    pagination
  },
  data () {
    return {
      baseUrl: window.location.origin,
      renderText: 'Showing all XML Groups',
      xmlFinder: {
        totalItems: 4,
        pageSize: 20,
        pageNumber: 1,
        totalPages: 1,

        xmlData: [
          {
            groupId: '58587cfee74a1d205f4eae8d',
            samples: 4,
            approved: 1
          },
          {
            groupId: 'L175_S6_O',
            samples: 8,
            approved: 3,
            __typename: 'XmlCatalogs'
          },
          {
            groupId: '58587cfee74a1d205f4eae8d',
            samples: 1,
            approved: 0,
            __typename: 'XmlCatalogs'
          },
          {
            groupId: 'L175_S6_O',
            samples: 16,
            approved: 12,
            __typename: 'XmlCatalogs'
          }
        ],
        __typename: 'XmlDataList'
      },
      pageNumber: 1,
      pageSize: 20,
      searchEnabled: false,
      searchWord: '',
      error: null,
      loading: false
    }
  },
  computed: {
    isEmpty () {
      if (this.xmlFinder.length === 0 || !Object.keys(this.xmlFinder).length || this.xmlFinder.totalItems === 0) return true
      return false
    }
  },
  created () {
    this.$store.commit('setAppHeaderInfo', { icon: '', name: 'View Curation' })
  }
}
</script>
