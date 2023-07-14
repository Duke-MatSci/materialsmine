<template>
<div>
  <pre class="language-xml grid">
    <code class="inlinecode language-xml keepMarkUp">
      {{ xml }}
    </code>
  </pre>
</div>
</template>

<script>
import Prism from 'prismjs'
import 'prismjs/components/prism-xml-doc'
import 'prismjs/components/prism-markup'
import 'prismjs/themes/prism-coy.min.css'

export default {
  name: 'XmlView',
  props: {
    xml: String,
  },
  mounted () {
    window.Prism = window.Prism || {}
    window.Prism.manual = true
    Prism.highlightAll()
  }
}
</script>
