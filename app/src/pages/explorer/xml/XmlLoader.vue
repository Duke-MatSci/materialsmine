<template>
  <div class="xmlLoader">
    <section
      class="u_width--max viz-u-postion__rel utility-roverflow"
      v-if="!!Object.keys(xmlViewer).length && xmlViewer.xmlString"
    >
      <md-drawer
        class="md-right"
        :class="{ ' md-fixed': showSidepanel }"
        :md-active.sync="showSidepanel"
      >
        <comment
          :type="type"
          :identifier="optionalChaining(() => xmlViewer.id)"
        ></comment>
        <md-button
          @click="showSidepanel = false"
          class="md-fab md-fixed md-dense md-fab-top-right md-primary btn--primary"
        >
          <md-icon>close</md-icon>
        </md-button>
      </md-drawer>

      <md-content
        class="u_width--max md-app-side-drawer md-app-container md-scrollbar"
      >
        <div :class="[isSmallTabView ? 'u_margin-top-med' : '']">
          <h2 class="visualize_header-h1 u_margin-top-med u_centralize_text">
            {{ optionalChaining(() => xmlViewer.title) }}
          </h2>
        </div>
        <!-- xml viewer  -->
        <div class="wrapper">
          <XmlView :xml="optionalChaining(() => xmlViewer.xmlString)" />
        </div>
      </md-content>
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

        <md-button
          @click.prevent="editCuration(xmlViewer.id, xmlViewer.isNewCuration)"
          v-if="isAuth && (xmlViewer.user === userId || isAdmin)"
          class="md-fab md-dense md-primary btn--primary"
        >
          <md-tooltip md-direction="top">Edit Curation</md-tooltip>
          <md-icon>edit</md-icon>
        </md-button>

        <md-button
          @click="approveCuration"
          v-if="isAuth && isAdmin"
          class="md-fab md-dense md-primary btn--primary"
        >
          <md-tooltip md-direction="top">Approve</md-tooltip>
          <md-icon>check</md-icon>
        </md-button>
      </div>
    </section>

    <section class="section_loader u--margin-toplg" v-else-if="$apollo.loading">
      <spinner :loading="$apollo.loading" text="Loading Xml" />
    </section>
    <section class="section_loader u--margin-toplg" v-else>
      <h2 class="visualize_header-h1 u_margin-top-med u_centralize_text">
        This XML no longer exists or has been moved
      </h2>
    </section>
  </div>
</template>

<script>
import Prism from 'prismjs'
import 'prismjs/components/prism-xml-doc'
import 'prismjs/components/prism-markup'
import 'prismjs/themes/prism-coy.min.css'
import optionalChainingUtil from '@/mixins/optional-chaining-util'
import Comment from '@/components/explorer/Comment'
import spinner from '@/components/Spinner'
import XmlView from '@/components/explorer/XmlView'
import { XML_VIEWER } from '@/modules/gql/xml-gql'
import { mapGetters } from 'vuex'
export default {
  name: 'XmlVisualizer',
  mixins: [optionalChainingUtil],
  components: {
    Comment,
    spinner,
    XmlView
  },
  data () {
    return {
      showSidepanel: false,
      type: 'xml',
      xmlViewer: {}
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
    }
  },
  methods: {
    approveCuration () {
      this.$store.commit('setSnackbar', {
        message: 'Something went wrong',
        action: () => this.approveCuration()
      })
    },
    navBack () {
      this.$router.back()
    },
    editCuration (id, isNew) {
      if (!!id && typeof isNew === 'boolean') {
        return this.$router.push({
          name: 'EditXmlCuration',
          query: { isNew: isNew, id: id }
        })
      }
    }
  },
  mounted () {
    window.Prism = window.Prism || {}
    window.Prism.manual = true
    Prism.highlightAll()
  },
  apollo: {
    xmlViewer: {
      query: XML_VIEWER,
      variables () {
        return {
          input: {
            id: this.$route.params.id,
            isNewCuration: this.$route?.query?.isNewCuration
              ? JSON.parse(this.$route?.query?.isNewCuration)
              : false
          }
        }
      },
      fetchPolicy: 'cache-and-network',
      error (error) {
        if (error.networkError) {
          const err = error.networkError
          this.error = `Network Error: ${err?.response?.status} ${err?.response?.statusText}`
        } else if (error.graphQLErrors) {
          this.error = error.graphQLErrors
        }
        this.$store.commit('setSnackbar', {
          message:
            error.networkError?.response?.statusText ?? error.graphQLErrors,
          action: () => this.$apollo.queries.xmlViewer.refetch()
        })
      }
    }
  }
}
</script>
