<template>
  <div class="main">
    <div class="metamine_intro-banner">
      <div class="metamine_intro-content">
        <h3 class="metamine_intro-header">MetaMine</h3>
        <div class="metamine_intro-span">Material Informatics for MetaMaterials</div>
      </div>
    </div>
    <div class="">
      <h3 class="metamine_headline"><span>MetaMine is an open source, data resource for members of the metamaterial community with four key goals:</span></h3>
      <div class="card-container">
        <ul class="ul_adjust">
          <li class="card card-float inline-display" @click.prevent="openLinks('/explorer/curate')">
            <div class="card-inside">
              <div class="card-icon-container"><i class="material-icons card-icon card-icon-adjust">people_alt</i></div>
              <h2 class="card-heading">Curation</h2>
              <p>Provide a curation platform for sharing of data across the community in ways that are findable, accessible, interoperable and reusable (FAIR ww.force11.org)</p>
            </div>
          </li>
          <li class="card card-float inline-display" @click.prevent="openLinks('/explorer')">
            <div class="card-inside">
              <div class="card-icon-container"><i class="material-icons card-icon card-icon-adjust">tune</i></div>
              <h2 class="card-heading">Visualizing Data</h2>
              <p>Provide a platform for visualizing data, and mechanisms for visualization methods to be shared</p>
            </div>
          </li>
          <li class="card card-float inline-display" @click.prevent="openLinks('/mm/pixelunit')">
            <div class="card-inside">
              <div class="card-icon-container"><i class="material-icons card-icon card-icon-adjust">grain</i></div>
              <h2 class="card-heading">Module Tools</h2>
              <p>Provide module tools for analysis and characterization of mechanical metamaterials.</p>
            </div>
          </li>
          <li class="card card-float inline-display">
            <div class="card-inside">
              <div class="card-icon-container"><i class="material-icons card-icon card-icon-adjust">widgets</i></div>
              <h2 class="card-heading">Simulation Tools</h2>
              <p>Improve the ability to design metamaterial through simulation and design tools.</p>
            </div>
          </li>
        </ul>
      </div>
    </div>
    <div class="mid-first">
      <ul>
        <li class="inline-display mid-first-li mid-first-container"><i class="material-icons card-icon">smart_display</i></li>
        <li class="inline-display mid-first-li mid-first-container">
          <p class="mid-first-p">New to MetaMine? <span class="mid-first-span">View Our step-by-step tutorials!</span></p>
        </li>
        <li class="inline-display mid-first-container" @click.prevent="openLinks('/how')" style="cursor:pointer"><i class="material-icons card-icon">arrow_right_alt</i></li>
      </ul>
    </div>
    <div class="mid-second">
      <p>
        <strong>Login or register</strong> for an account to enable advanced analysis and upload features.  Registering for an account is easy
        using <a href="https://accounts.oit.duke.edu/onelink/register" target="_blank" class="mid-second-link">Duke's OneLink feature</a>.
        InCommon support is coming soon.
        <a href="https://www.incommon.org/federation/incommon-federation-participants/" target="_blank" class="mid-second-link">InCommon federation</a> allows
        many university users to login with the same credentials they use for their own university.
      </p>
      <p><span>MetaMine is built on both a <a
        href="https://github.com/Duke-MatSci/nanomine-schema/tree/master/xml" target="_blank" class="mid-second-link">schema</a>* and an ontology
        to provide a robustness to the FAIR principles. MetaMine also allows for the registration of materials resources, bridging the gap
        between existing resources and the end users and making those existing resources available for research to material community.</span>
      </p>
    </div>
    <div class="">
      <div class="metamine_sponsor">
        <div class="metamine_sponsor-content">
          <img class="metamine_sponsor-img" src="@/assets/img/sponsors3.png" max-width="1024"  aspect-ratio="4.6" contain />
        </div>
      </div>
      <p class="metamine_footer-text">NSF supported the initial
        concept of NanoMine as a joint Northwestern University/Rensselaer Polytechnic Institute project through the
        CDMR program and development of a robust ontology and software framework via the
        DIBBS program. The
        DMREF program (Duke University, Northwestern University, Rensselaer Polytechnic Institute and the University of Vermont)
        currently supports the development and publication of innovative material simulation and design
        tools. The CSSI program (Duke University, Northwestern University, Rensselaer Polytechnic Institute, University of Vermont and CalTech)
        currently supports infrastructure and software development, integration and extension to the domain of meta-materials.
        NIST/CHIMAD support data curation, demonstration materials design problems, and integration into the larger
        MGI network and connection to the Materials Data Curator system run by NIST.
      </p>
      <h4 class="metamine_footer-ref metamine_footer-ref-header">* References</h4>
      <p class="metamine_footer-ref">Zhao, H., Li, X., Zhang, Y., Schadler, L. S., Chen, W., &amp; Brinson, L. C. (2016).
        <i>
          <a href="https://aip.scitation.org/doi/abs/10.1063/1.4943679">Perspective: NanoMine: A material genome approach for polymer nanocomposites analysis and design</a>
        </i>
        . APL Materials, 4(5), 053204.
      </p>
      <p class="metamine_footer-ref">Zhao, H., Wang, Y., Lin, A., Hu, B., Yan, R., McCusker, J., ... &amp; Brinson, L. C. (2018).
        <i>
          <a href="https://aip.scitation.org/doi/10.1063/1.5046839">NanoMine schema: An extensible data representation for polymer nanocomposites
          </a>
        </i>
        . APL Materials, 6(11), 111108.
      </p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HomeMM',
  methods: {
    openLinks (arg) {
      this.$router.push({
        path: arg
      })
    }
  }
}
</script>

<style lang="scss" scoped>
ul {
  text-align: center;
  padding-left: 0;
  padding-right: 0;
  margin-top: 4rem;
  margin-bottom: 2rem;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  display: -webkit-flex;
  display: flex;
  margin: 2rem auto;
  justify-content: center;
}
</style>
