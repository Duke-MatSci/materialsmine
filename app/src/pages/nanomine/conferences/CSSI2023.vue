<template>
  <div class="section_teams">
    <div class="wrapper u--margin-neglg">
      <div>
        <h1 class="visualize_header-h1">
          Nanocomposites to Metamaterials: A Knowledge Graph Framework
        </h1>
      </div>
      <a class="u--color-primary" target="_blank" href="https://www.cssi-pi2023.org/">
        <div class="teams_text teams_header">
          2023 NSF Cyberinfrastructure for Sustained Scientific Innovation Principal Investigator Meeting
        </div>
        <div class="teams_text teams_header">
          September 26-27, 2023
        </div>
        <div class="teams_text">
          Houston, Texas
        </div>
      </a>

      <div class="howto_item-header teams_text teams_header">
        <a>Virtual Poster Link</a>
      </div>
      <div class="howto_item-header teams_text">
        <a href="https://metamaterials.northwestern.edu/" target="_blank">
          Metamaterial Visualization Tool</a> &ndash; coming soon to MaterialsMine
      </div>
      <accordion :startOpen="true" :customTitle="true" title="Referenced Publications:"
        class="teams_list-ordered">
        <template #custom_title>
          <h2 class="teams_text teams_header">Referenced Publications:</h2>
        </template>
        <div>
          <ol>
            <li v-for="(pub, index) in publications" :key="`pub_${index}`">
              {{ pub.citation }}
              <span v-if="pub.doi">
                DOI: <a :href="`https://www.doi.org/${pub.doi}`" target="_blank">{{ pub.doi }}</a>
              </span>
            </li>
          </ol>
        </div>
      </accordion>
    </div>
  </div>
</template>

<script>
import accordion from '@/components/accordion.vue'

export default {
  name: 'CSSI2023',
  components: {
    accordion
  },
  data () {
    return {
      publications: [
        {
          citation: `B. Ma, N. J. Finan, D. Jany, M. E. Deagen, L. S. Schadler, and L. C. Brinson, “Machine-Learning-Assisted 
            Understanding of Polymer Nanocomposites Composition–Property Relationship: A Case Study of NanoMine Database,” 
            Macromolecules, vol. 56, no. 11, pp. 3945–3953, Jun. 2023.`,
          doi: '10.1021/acs.macromol.2c02249'
        },
        {
          citation: `Lee, Doksoo, Yu-Chin Chan, Wei Chen, Liwei Wang, Anton van Beek, and Wei Chen.
            "T-METASET: Task-aware acquisition of metamaterial datasets through diversity-based active learning." 
            Journal of Mechanical Design 145, no. 3 (2023): 031704. `,
          doi: '10.1115/1.4055925'
        },
        {
          citation: `Chen, Wei, Doksoo Lee, Oluwaseyi Balogun, and Wei Chen. "GAN-DUF: Hierarchical 
            Deep Generative Models for Design Under Free-Form Geometric Uncertainty." 
            Journal of Mechanical Design 145, no. 1 (2023): 011703. `,
          doi: '10.1115/1.4055898'
        },
        {
          citation: `Tanriover, Ibrahim, Doksoo Lee, Wei Chen, and Koray Aydin. "Deep Generative 
            Modeling and Inverse Design of Manufacturable Free-Form Dielectric Metasurfaces." 
            ACS Photonics 10, no. 4 (2022): 875-883. `,
          doi: '10.1021/acsphotonics.2c01006'
        },
        {
          citation: `Wang, Liwei, Zhao Liu, Daicong Da, Yu-Chin Chan, Wei Chen, and Ping Zhu. "Generalized 
            de-homogenization via sawtooth-function-based mapping and its demonstration on data-driven frequency response optimization." 
            Computer Methods in Applied Mechanics and Engineering 395 (2022): 114967. `,
          doi: '10.1016/j.cma.2022.114967'
        },
        {
          citation: `Chen, Wei, Akshay Iyer, and Ramin Bostanabad. "Data centric design: A new approach 
            to design of microstructural material systems." Engineering 10 (2022): 89-98. `,
          doi: '10.1016/j.eng.2021.05.022'
        },
        {
          citation: `Chen, Wei, Doksoo Lee, Oluwaseyi Balogun, and Wei Chen. "Hierarchical Deep Generative 
            Models for Design Under Free-Form Geometric Uncertainty." In International Design Engineering 
            Technical Conferences and Computers and Information in Engineering Conference, vol. 86236, p. V03BT03A042. 
            American Society of Mechanical Engineers, 2022. `,
          doi: '10.1115/DETC2022-89707'
        },
        {
          citation: `Lee, Doksoo, Yu-Chin Chan, Wei Chen, Liwei Wang, and Wei Chen. "T-METASET: Task-Aware 
            Generation of Metamaterial Datasets by Diversity-Based Active Learning." In International Design 
            Engineering Technical Conferences and Computers and Information in Engineering Conference, vol. 86229, 
            p. V03AT03A011. American Society of Mechanical Engineers, 2022. `,
          doi: '10.1115/DETC2022-87653'
        },
        {
          citation: `Chen, Z., Ogren, A., Daraio, C., Brinson, L. C., & Rudin, C. (2022). How to see hidden patterns 
            in metamaterials with interpretable machine learning. Extreme Mechanics Letters, 57, 101895. `,
          doi: '10.1016/j.eml.2022.101895'
        },
        {
          citation: `Jablonka, Kevin Maik et al. "14 Examples of How LLMs Can Transform Materials Science and Chemistry: 
          A Reflection on a Large Language Model Hackathon." Digital Discovery, 2023.`,
          doi: '10.48550/arXiv.2306.06283'
        },
        {
          citation: `J. Boddapati, M. Flaschel, S. Kumar, L. De Lorenzis and C. Daraio, 2023. Single-test evaluation of 
            directional elastic properties of anisotropic structured materials. arXiv preprint arXiv:2304.09112. `,
          doi: '10.48550/arXiv.2304.09112'
        },
        {
          citation: `B. Feng, A. Ogren, C. Daraio and K. Bouman, "Visual Vibration Tomography: Estimating Interior 
            Material Properties from Monocular Video," in 2022 IEEE/CVF Conference on Computer Vision and Pattern 
            Recognition (CVPR), New Orleans, LA, USA, 2022 pp. 16210-16219. `,
          doi: '10.1109/CVPR52688.2022.01575'
        },
        {
          citation: `M.E. Deagen, L.C. Brinson, R.A. Vaia, L.S. Schadler, The Materials Tetrahedron Has a Digital 
            Twin, MRS Bulletin 47, 379–388 (2022). `,
          doi: '10.1557/s43577-021-00214-0'
        },
        {
          citation: `X. Li, B. Ma, J. Dai, C. Sui, D. Pande, D. R. Smith, L. C. Brinson, P.-C. Hsu, Metalized 
            polyamide heterostructure as a moisture-responsive actuator for multimodal adaptive personal 
            heat management, Science Advances 7, eabj7906 (2021). `,
          doi: '10.1126/sciadv.abj7906'
        },
        {
          citation: `Lee, D., Jiang, S., Balogun, O., & Chen, W., "Dynamic Control of Plasmonic Localization 
            by Inverse Optimization of Spatial Phase Modulation", ACS Photonics, 2022 9 (2), 351-359. `,
          doi: '10.1021/acsphotonics.1c01043'
        },
        {
          citation: `LC Brinson, LM Bartolo, B Blaiszik, D Elbert, I Foster, A Strachan, PW Voorhees, Community 
          Action on FAIR Data will Fuel a Revolution in Materials Research, MRS Bulletin, 2023.`,
          doi: '10.1557/s43577-023-00498-4'
        },
        {
          citation: `MV Bastawrous, LC Brinson, Z Chen, C Daraio, AC Ogren, C Rudin, 2023. Phononic materials with 
          effectively scale-separated hierarchical features using interpretable machine learning. (in preparation)`
        },
        {
          citation: `AC Ogren, BT Feng, KL Bouman, C Daraio, 2023. Gaussian Process Regression as a Surrogate Model 
            for Dispersion Computations. (submitted)`
        }
      ]
    }
  },
  created () {
    this.$store.commit('setAppHeaderInfo', { icon: 'co_present', name: 'CSSI PI Meeting 2023' })
  }
}
</script>
