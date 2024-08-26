<template>
  <div class="section_pages">
    <div class="wrapper viz-u-postion__rel">
      <h1
        class="visualize_header-h1 article_title u_centralize_text"
        @click="formatClassData"
      >
        Ontology Visualization
      </h1>
      <div
        v-if="currentClass && showCard"
        @click="goTo(currentClass.ID)"
        class="md-fab md-fab-top-right section_pages u--b-rad u--layout-flex u--layout-flex-justify-end u--padding-zero u--shadow-none u_height--auto u_width--auto utility-bg_border-dark visualize--link-right"
      >
        <div class="md-card-header">
          <div
            class="u--layout-flex u--layout-flex-justify-sb u_centralize_items"
          >
            <h3 class="md-title">{{ currentClass['Preferred Name'] }}</h3>
            <button
              type="button"
              data-test="hide-card"
              @click="hideCard"
              class="md-button md-icon-button md-dense md-theme-default"
            >
              <div class="md-ripple">
                <div class="md-button-content">
                  <md-icon class="">close</md-icon>
                </div>
              </div>
            </button>
          </div>
          <br />
          <p><strong>ID: </strong> {{ currentClass.ID }}</p>
          <p>
            <strong>SubClassOf: </strong>
            <router-link :to="parentLink" :disabled="parentClass === 'Thing'">{{
              parentClass
            }}</router-link>
          </p>
        </div>
      </div>

      <div v-if="elements.length">
        <cytoscape
          ref="cyRef"
          :config="config"
          :preConfig="preConfig"
          :afterCreated="afterCreated"
        >
          <cy-element
            v-for="def in elements"
            :key="`${def.data.id}`"
            :definition="def"
            @mousedown="selectNode($event, def.data.id)"
            @selected="selectNode($event, def.data.id)"
          />
        </cytoscape>
      </div>
      <div v-else class="md-empty-state">
        <div class="md-empty-state-container">
          <strong class="md-empty-state-label">No Data</strong>
          <p class="md-empty-state-description">No Ontology Data Found</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import fcose from 'cytoscape-fcose';

export default {
  data() {
    return {
      loading: true,
      showCard: false,
      elements: [],
      uniqueInd: 1,
      config: {
        style: [
          {
            selector: 'node',
            style: {
              'background-color': '#2b65ec',
              label: 'data(id)',
              'text-valign': 'center',
              'text-halign': 'center',
              'text-outline-color': '#2b65ec',
              'text-outline-width': '1px',
              'font-weight': 150,
              color: '#ffffff',
              width: 'data(width)',
              height: 'data(height)'
            }
          },
          {
            selector: 'edge',
            style: {
              width: 1,
              'line-color': '#08233c',
              'target-arrow-color': '#08233c',
              'curve-style': 'bezier',
              'target-arrow-shape': 'chevron',
              label: 'data(description)', // Display the edge description
              'font-size': 14, // Adjust the font size for the description label
              'text-rotation': 'autorotate', // Ensure the label follows the edge line
              color: '#000'
            }
          },
          {
            selector: 'node:selected',
            style: {
              'background-color': '#F08080',
              'border-color': 'red'
            }
          },
          {
            selector: 'edge:selected',
            style: {
              'line-color': '#F08080',
              'target-arrow-color': '#F08080'
            }
          }
        ]
      }
    };
  },
  computed: {
    ...mapGetters('ns', {
      classes: 'getClasses',
      currentClass: 'getCurrentClass'
    }),
    parentClass() {
      return this.currentClass?.subClassOf.split('/').pop().split('#').pop();
    },
    parentLink() {
      return `/ns/${this.parentClass}`;
    }
  },
  methods: {
    ...mapActions({
      searchNSData: 'ns/searchNSData'
    }),
    preConfig(cytoscape) {
      cytoscape.use(fcose);
    },
    afterCreated(cy) {
      // add elements and run layout algorithm
      cy.add(this.elements)
        .layout({
          name: 'fcose',
          fit: true,
          padding: 10,
          animate: false, // Enable animation
          randomize: true, // Randomize initial positions
          nodeDimensionsIncludeLabels: true, // Include node labels in dimension calculations
          idealEdgeLength: 1000, // Ideal length of edges
          edgeElasticity: 0.5, // Elasticity of edges
          nestingFactor: 0.3, // Factor for nesting of compound nodes
          gravity: 0.5 // Gravity to pull nodes towards center
        })
        .run();
    },
    async selectNode(event, id) {
      if (!event) {
        this.showCard = false;
        return;
      }
      this.showCard = true;
      await this.searchNSData({ query: id, singleResult: true });
    },
    async hideCard() {
      this.showCard = false;
      await this.searchNSData({ query: '', singleResult: true });
    },
    async formatClassData() {
      if (!this.classes || !this.classes.length) return;
      const arr = JSON.parse(JSON.stringify(this.classes));
      this.createNode(arr);
    },

    createNode(arr, nodeSize = 160) {
      if (!Array.isArray(arr)) {
        return;
      }

      for (let i = 0; i < arr.length; i++) {
        const obj = arr[i];

        let id = obj['ID'].split('/').pop().split('#').pop();
        const subClassOf = obj['subClassOf'].split('/').pop().split('#').pop();

        const node = this.createNodeObj(id, nodeSize);
        const line = this.createLineObj(id, subClassOf);

        this.elements.push(node);

        if (id !== subClassOf) {
          this.elements.push(line);
        }

        if (obj['subClasses'].length) {
          this.createNode(obj.subClasses, nodeSize);
        }
      }
    },
    createNodeObj(id = null, size = 160) {
      if (!id) return;
      const obj = {
        data: {
          id: id,
          width: size,
          height: size
        },
        group: 'nodes'
      };
      return obj;
    },
    createLineObj(source = null, target = null) {
      if (!source || !target) return;
      const obj = {
        data: {
          id: `${source}_&_${target}`,
          source,
          target,
          description: `${source} is a subclass of ${target}`
        }
      };
      return obj;
    },
    goTo(id) {
      const path = `/ns/${id.split('/').pop().split('#').pop()}`;
      this.$router.push(path);
    }
  },
  async mounted() {
    await this.formatClassData();
  }
};
</script>
