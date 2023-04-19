<template>
  <div>
    <section class="u_width--max" v-if="!!Object.keys(xmlViewer).length && xmlViewer.xmlString">
      <div>
        <h2 class="visualize_header-h1 u_margin-top-med u_centralize_text"> {{ xmlViewer.title }} </h2>
      </div>
      <!-- xml viewer  -->
      <div class="wrapper">
        <pre class="language-xml grid">
          <code class="inlinecode language-xml keepMarkUp">
            {{ xmlViewer.xmlString }}
          </code>
        </pre>
      </div>
      <comment :type="type" :identifier="xmlViewer?.id"></comment>

    </section>
    <section class="section_loader u--margin-toplg" v-else-if="$apollo.loading">
      <spinner :loading="$apollo.loading" text='Loading Xml'/>
    </section>
    <section class="section_loader u--margin-toplg" v-else>
      <h2 class="visualize_header-h1 u_margin-top-med u_centralize_text">This xml no longer exist or have been moved</h2>
    </section>
  </div>
</template>

<script>
import Prism from 'prismjs'
import 'prismjs/components/prism-xml-doc'
import 'prismjs/components/prism-markup'
import 'prismjs/themes/prism-coy.min.css'
import Comment from '@/components/explorer/Comment'
import spinner from '@/components/Spinner'
import { XML_VIEWER } from '@/modules/gql/xml-gql'
export default {
  name: 'XmlVisualizer',
  components: {
    Comment,
    spinner
  },
  data () {
    return {
      type: 'xml',
      xmlViewer: {}
    }
  },
  mounted () {
    window.Prism = window.Prism || {}
    window.Prism.manual = true
    // Prism.hooks.add('before-highlight', function (env) {
    //   env.code = env.element.innerText
    //   // env.code = env.code.replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    //   // env.code = env.code.replace(/&amp;/g, '&')
    // })
    // Prism.highlightElement('code[class*="language-"]')
    Prism.highlightAll()
  },
  apollo: {
    xmlViewer: {
      query: XML_VIEWER,
      variables () {
        return {
          input: { id: this.$route.params.id }
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
          message: error.networkError?.response?.statusText ?? error.graphQLErrors,
          action: () => this.$apollo.queries.xmlViewer.refetch()
        })
      }
    }
  }
}
</script>
