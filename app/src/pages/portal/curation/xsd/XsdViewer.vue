<template>
  <div class="xmlLoader">
  <md-app-content class="u_width--max viz-u-postion__rel utility-roverflow">
    <md-content class="u_width--max md-app-side-drawer md-app-container md-scrollbar" >
      <div :class="[isSmallTabView ? 'u_margin-top-med' : '']">
        <h2 class="visualize_header-h1 u_margin-top-med u_centralize_text"> XSD view </h2>
      </div>
      <!-- xsd viewer  -->
      <div class="wrapper">
        <section class="section_loader " v-if="!xsd" >
          <spinner text='Loading Json Schema'/>
        </section>
        <pre v-else class="language-xml grid">
          <code class="inlinecode language-xml keepMarkUp">
            {{ xsd }}
          </code>
        </pre>
      </div>

    </md-content>
    <div :class="[isSmallTabView ? 'u_margin-top-small u_adjust-banner-text' : 'u--margin-neg','md-fab md-fab-top-right u_width--max u--shadow-none u--layout-flex u--layout-flex-justify-end u--b-rad']">
      <md-button class="md-fab md-dense md-primary btn--primary" @click.native.prevent="navBack">
        <md-tooltip> Go Back </md-tooltip>
        <md-icon>arrow_back</md-icon>
      </md-button>

      <md-button @click="downloadJsonSchema()" v-if="isAuth && isAdmin" class="md-fab md-dense md-primary btn--primary ">
        <md-tooltip md-direction="top">Download schema</md-tooltip>
        <md-icon>download</md-icon>
      </md-button>
    </div>
	</md-app-content>
</div>
</template>

<script>
import spinner from '@/components/Spinner'
import Prism from 'prismjs'
import 'prismjs/components/prism-xml-doc'
import 'prismjs/components/prism-markup'
import 'prismjs/themes/prism-coy.min.css'
import { mapGetters } from 'vuex'

export default {
  name: 'XsdView',
  data () {
    return {
      xsd: null
    }
  },
  components: {
    spinner
  },
  async mounted () {
    window.Prism = window.Prism || {}
    window.Prism.manual = true
    Prism.highlightAll()
    this.fetchJsonSchema()
  },

  created () {
    this.$store.commit('setAppHeaderInfo', { icon: '', name: 'XSD Schema' })
  },

  computed: {
    ...mapGetters({
      token: 'auth/token',
      isAdmin: 'auth/isAdmin',
      isAuth: 'auth/isAuthenticated'

    }),
    isSmallTabView () {
      return screen.width < 760
    }
  },

  methods: {
    navBack () {
      this.$router.back()
    },

    fetchJsonSchema () {
      fetch('http://localhost/api/curate?getXSD=true', {
        method: 'GET',
        headers: { Authorization: `Bearer ${this.token}`, accept: 'application/json' }
      })
        .then(resp => resp.json())
        .then((data) => {
          this.xsd = data?.xsd
        })
        .catch(error => console.log(error))
    },

    downloadJsonSchema () {
      this.$store.commit('setSnackbar', {
        message: 'Preparing File For Download',
        duration: 7000
      })
      fetch('http://localhost/api/curate?isFile=true', {
        method: 'GET',
        headers: { Authorization: `Bearer ${this.token}` },
        responseType: 'blob'
      })
        .then(resp => resp.blob())
        .then((data) => {
          const fileUrl = window.URL.createObjectURL(data)
          const fileLink = document.createElement('a')
          fileLink.href = fileUrl
          fileLink.setAttribute('download', 'XSD-Schema')
          document.body.appendChild(fileLink)

          fileLink.click()
        })
        .catch((error) => {
          console.log(error)
          this.$store.commit('setSnackbar', {
            message: 'Something went wrong',
            action: () => this.downloadJsonSchema()
          })
        })
    }
  }
}
</script>
