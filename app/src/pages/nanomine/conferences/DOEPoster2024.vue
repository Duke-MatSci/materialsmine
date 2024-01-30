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

      <div class="u--margin-toplg">
        <h1 class="visualize_header-h2">Poster:</h1>
      </div>
      <div class="howto_item-header teams_text">
        Link:
        <a href="/docs/DOE_Poster_20240129.pdf" download>DOE 2024 Poster</a>
      </div>

      <div class="u--margin-toplg">
        <h1 class="visualize_header-h2">Papers:</h1>
      </div>
      <div class="howto_item-header teams_text">
        1. Chen, Ogren, Daraio, Brinson, Rudin. "How to See Hidden Patterns in
        Metamaterials with Interpretable Machine Learning.” Extreme Mech.
        Letters, 2022.
        <a
          href="https://www.sciencedirect.com/science/article/abs/pii/S2352431622001717"
          target="_blank"
          >More...</a
        >
      </div>
      <div class="howto_item-header teams_text">
        2. Bastawrous, Chen, Ogren, Daraio, Rudin, Brinson. ”Phononic materials
        with effectively scale-separated hierarchical features using
        interpretable machine learning.” NJP Comp Matls submitted, 2023.
      </div>
      <div class="howto_item-header teams_text">
        3. Zhang, Karimi Mahabadi, Rudin, Guilleminot, Brinson. ”Stochastic
        Collocation As a Method of Quantifying Uncertainty in Metamaterial
        Bandgap Response For Stochastic Material Properties.” submitting Feb,
        2024 to Int J. Mech. Sci.
        <a href="https://doi.org/10.48550/arXiv.2310.12869" target="_blank"
          >More...</a
        >
      </div>
      <div class="u--margin-topxl"><span>&nbsp;</span></div>
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
