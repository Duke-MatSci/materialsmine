<template>
<div class="explorer_page_header">
    <h2 class="visualize_header-h1 u_margin-top-med u_centralize_text">Sparql Query</h2>
    <yasgui></yasgui>
</div>
</template>

<script>
import yasgui from '@/components/explorer/yasgui.vue'

export default {
  name: 'Sparql',
  components: {
    yasgui
  }
}
</script>
