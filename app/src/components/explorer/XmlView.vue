<template>
  <div>
    <pre class="language-xml grid">
      <code class="inlinecode language-xml keepMarkUp">
        {{ xml }}
      </code>
    </pre>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import Prism from 'prismjs';
import 'prismjs/components/prism-xml-doc';
import 'prismjs/components/prism-markup';
import 'prismjs/themes/prism-coy.min.css';

// Component name for debugging
defineOptions({
  name: 'XmlView',
});

// Props
interface Props {
  xml?: string;
}

const props = withDefaults(defineProps<Props>(), {
  xml: '',
});

// Lifecycle
onMounted(() => {
  window.Prism = window.Prism || {};
  window.Prism.manual = true;
  Prism.highlightAll();
});
</script>
