<template>
  <div class="xmlLoader">
    <section
      class="u_width--max viz-u-postion__rel utility-roverflow"
      v-if="!yamlLoading"
    >
      <md-drawer
        class="md-right"
        :class="{ ' md-fixed': showSidepanel }"
        :md-active.sync="showSidepanel"
      >
        <comment :type="type" :identifier="xmlId"></comment>
        <md-button
          @click="showSidepanel = false"
          class="md-fab md-fixed md-dense md-fab-top-right md-primary btn--primary"
        >
          <md-icon>close</md-icon>
        </md-button>
      </md-drawer>

      <div class="u_width--max viz-u-postion__rel utility-roverflow">
        <md-content
          class="u_width--max md-app-side-drawer md-app-container md-scrollbar u_margin-none"
        >
          <div :class="[isSmallTabView ? 'u_myprofile--container' : '']">
            <h2 class="visualize_header-h1 u_margin-top-med u_centralize_text">
              {{ `${optionalChaining(() => controlID)}.yaml` }}
            </h2>
            <div class="u_centralize_text viz-u-mgbottom-sm">
              <a
                @click.prevent="openYaml(true)"
                class="viz-tab__button"
                :class="[!loadYaml && 'active u--color-primary']"
                >XML View</a
              >
              ||
              <a
                class="viz-tab__button"
                :class="[loadYaml && 'active u--color-primary']"
                href="#"
                >YAML View</a
              >
            </div>
          </div>
          <!-- xml viewer  -->
          <div class="wrapper" style="min-width: 90%" ref="codeBlock">
            <!-- <XmlView ref="codeBlock" :content="dataFeed" :isYaml="loadYaml" /> -->
            <pre>
              <code class="language-yml keepMarkUp" >{{ optionalChaining(() => yamlString) }}</code>
            </pre>
          </div>
        </md-content>

        <md-content class="u_margin-bottom-small">
          <md-button
            class="md-primary md-raised btn--primary"
            :class="[
              isLargeTabView
                ? 'viz-u-display__show u--margin-centered'
                : 'viz-u-postion__abs utility-absolute-input visualize--link-bottom'
            ]"
            @click="
              requestApproval({
                curationId: xmlViewer.id,
                isNew: xmlViewer.isNewCuration
              })
            "
            v-if="
              isAuth &&
              !isAdmin &&
              xmlViewer.status === 'Not Approved' &&
              xmlViewer.curationState === 'Editing'
            "
          >
            Request Approval
          </md-button>
        </md-content>
      </div>
      <div
        :class="[
          isSmallTabView
            ? 'u_margin-top-small u_adjust-banner-text'
            : 'u--margin-neg',
          'md-fab md-fab-top-right u_width--max u--shadow-none u--layout-flex u--layout-flex-justify-end u--b-rad'
        ]"
      >
        <md-button
          class="md-fab md-dense md-primary btn--primary"
          @click.native.prevent="navBack"
        >
          <md-tooltip> Go Back </md-tooltip>
          <md-icon>arrow_back</md-icon>
        </md-button>

        <md-button
          @click="showSidepanel = true"
          class="md-fab md-dense md-primary btn--primary"
        >
          <md-tooltip md-direction="top">Comment</md-tooltip>
          <md-icon>comment</md-icon>
        </md-button>
      </div>
    </section>

    <section class="section_loader u--margin-toplg" v-else>
      <spinner :loading="yamlLoading" text="Loading Yaml" />
    </section>
  </div>
</template>

<script>
import Prism from 'prismjs'
import 'prismjs/themes/prism-coy.min.css'
import 'prismjs/themes/prism-dark.css'
import 'prismjs/themes/prism.css'
import 'prismjs/components/prism-yaml'
import optionalChainingUtil from '@/mixins/optional-chaining-util'
import Comment from '@/components/explorer/Comment'
import spinner from '@/components/Spinner'
import { mapGetters } from 'vuex'

export default {
  name: 'YamlVisualizer',
  mixins: [optionalChainingUtil],
  components: {
    Comment,
    spinner
  },
  data () {
    return {
      showSidepanel: false,
      type: 'xml',
      yamlString: '',
      yamlLoading: false
    }
  },
  computed: {
    ...mapGetters({
      isAuth: 'auth/isAuthenticated',
      isAdmin: 'auth/isAdmin',
      userId: 'auth/userId'
    }),
    isSmallTabView () {
      return screen.width < 760
    },
    isLargeTabView () {
      return screen.width < 1024
    },
    loadYaml () {
      return !!this.$route.query.isYaml
    },
    xmlId () {
      return this.$route.params.id
    },
    controlID () {
      return this.$route.query?.title?.split('.')[0]
    }
  },
  methods: {
    navBack () {
      this.$router.back()
    },
    async openAsYaml () {
      this.yamlLoading = true
      if (!this.controlID) {
        this.yamlLoading = false
        return this.$router.push({ name: 'XmlGallery' })
      }
      try {
        const res = await fetch(`/api/mn/yaml-loader/${this.controlID}`)
        if (!res.ok) {
          throw new Error('Failed to convert to YAML')
        }
        const yamlText = await res.text()
        this.yamlString = yamlText
        this.yamlLoading = false
      } catch (error) {
        this.yamlLoading = false
        this.$store.commit('setSnackbar', {
          message:
            error.message ??
            'An error occurred while trying to convert to YAML',
          action: () => this.openAsYaml()
        })
      }
    },
    openYaml () {
      const query = {
        isNewCuration: this.$route.query?.isNewCuration
      }
      const params = {
        id: this.$route.params.id
      }

      return this.$router.push({ name: 'XmlVisualizer', params, query })
    }
  },
  async mounted () {
    await this.openAsYaml()
    window.Prism = window.Prism || {}
    window.Prism.manual = true
  },
  updated () {
    const vm = this
    setTimeout(() => {
      Prism.highlightAll(vm.$refs.codeBlock)
    }, 200)
  }
}
</script>

prefix = nanomine.org uri =
