<!-- https:qa.materialsmine.org/nm/2024-doe-poster -->
<template>
  <div class="section_teams">
    <div class="wrapper u--margin-neglg">
      <div>
        <h1 class="visualize_header-h1">
          2024 FAIR Data and Interpretable AI Framework for Architectured
          Metamaterials
        </h1>
      </div>

      <div class="howto_item-header teams_text">
        Link:
        <a href="/docs/DOE_Poster_20240129.pdf" download>DOE 2024 Poster</a>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MRS2022',
  created() {
    this.$store.commit('setAppHeaderInfo', {
      icon: 'close_fullscreen',
      name: 'DOE 2024'
    });
  }
};
</script>
