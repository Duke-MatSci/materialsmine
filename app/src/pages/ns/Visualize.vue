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
        class="md-fab md-fab-top-right section_pages u--b-rad u--layout-flex u--layout-flex-justify-end u--padding-zero u--shadow-none u_height--auto u_width--auto utility-bg_border-dark visualize--link-right"
      >
        <div class="md-card-header">
          <div
            class="u--layout-flex u--layout-flex-justify-sb u_centralize_items"
          >
            <h3 class="md-title">
              {{ currentClass['Preferred Name'] }}
              <router-link :to="currentClassLink"
                ><md-icon>exit_to_app</md-icon></router-link
              >
            </h3>
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

          <br />

          <button
            v-if="!showNodeAncestry"
            class="md-button btn btn--primary btn--noradius"
            @click.prevent="queryClass(true)"
          >
            Visualize
          </button>
          <button
            v-else
            class="md-button btn btn--tertiary btn--noradius"
            @click.prevent="queryClass(false)"
          >
            Reset
          </button>
        </div>
      </div>

      <div class="editImage_modal" v-if="loading">
        <spinner text="Loading Ontology Data" />
      </div>
      <template v-else>
        <div v-if="elements.length">
          <cytoscape
            ref="cyRef"
            :key="key"
            :config="config"
            :preConfig="preConfig"
            :afterCreated="afterCreated"
          >
            <cy-element
              v-for="def in elements"
              :key="`${def.data.id}`"
              :definition="def"
              @click="selectNode($event, def.data)"
              @selected="selectNode($event, def.data)"
            />
          </cytoscape>
        </div>
        <div v-else class="md-empty-state">
          <div class="md-empty-state-container">
            <strong class="md-empty-state-label">No Data</strong>
            <p class="md-empty-state-description">No Ontology Data Found</p>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import Spinner from '@/components/Spinner.vue'
import fcose from 'cytoscape-fcose'
import dagre from 'cytoscape-dagre'

import { styleObj, fcoseLayout, modifiedLayout } from './cytoscape'

export default {
  components: {
    Spinner
  },
  data () {
    return {
      loading: true,
      showCard: false,
      elements: [],
      uniqueInd: 1,
      config: { ...styleObj },
      currentNodeData: {},
      showNodeAncestry: false,
      cy: null,
      layoutOptions: { ...modifiedLayout },
      key: true
    }
  },
  computed: {
    ...mapGetters('ns', {
      classes: 'getClasses',
      currentClass: 'getCurrentClass'
    }),
    parentClass () {
      return this.currentClass?.subClassOf.split('/').pop().split('#').pop()
    },
    parentLink () {
      return `/ns/${this.parentClass}`
    },
    currentClassLink () {
      const param = this.currentClass.ID.split('/').pop().split('#').pop()
      return `/ns/${param}`
    },
    layout () {
      return fcose
    }
  },
  methods: {
    ...mapActions({
      searchNSData: 'ns/searchNSData'
    }),
    preConfig (cytoscape) {
      cytoscape.use(this.layout)
      this.cy = cytoscape
    },
    afterCreated (cy) {
      cy.add(this.elements)
        .layout({ ...fcoseLayout })
        .run()
    },
    queryClass (bool) {
      if (bool && Object.keys(this.currentNodeData)) {
        return this.$router.push({ query: { class: this.currentNodeData.id } })
      }
      this.$router.push({ query: null })
    },
    async selectNode (event, data) {
      if (!event) {
        this.showCard = false
        return
      }
      this.showCard = true
      this.currentNodeData = { ...data }
      await this.searchNSData({ query: data.id, singleResult: true })
    },
    async hideCard () {
      this.showCard = false
      await this.searchNSData({ query: '', singleResult: true })
    },
    async formatClassData () {
      if (!this.classes || !this.classes.length) {
        this.loading = false
        return
      }
      const arr = JSON.parse(JSON.stringify(this.classes))
      const result = this.createNode(arr)
      this.elements = [...result]

      setTimeout(async () => {
        this.loading = false
        await this.$nextTick()
        if (this.$route.query?.class) {
          this.loadSingleNode(this.$route.query.class)
        }
      }, 300)
    },

    createNode (arr, nodeSize = 160, ancestors = []) {
      if (!Array.isArray(arr)) {
        return
      }
      let results = []
      for (let i = 0; i < arr.length; i++) {
        const obj = arr[i]

        const id = obj.ID.split('/').pop().split('#').pop()
        const subClassOf = obj.subClassOf.split('/').pop().split('#').pop()

        const node = this.createNodeObj(id, nodeSize, [
          ...ancestors,
          subClassOf,
          id
        ])
        const line = this.createLineObj(id, subClassOf, [...ancestors])

        results.push(node)

        if (id !== subClassOf) {
          results.push(line)
        }

        if (obj.subClasses.length) {
          const children = this.createNode(obj.subClasses, nodeSize, [
            ...ancestors,
            subClassOf,
            id
          ])
          results = [...results, ...children]
        }
      }
      return results
    },
    createNodeObj (id = null, size = 160, ancestors = []) {
      if (!id) return
      const uniqueSet = new Set(ancestors)
      const obj = {
        data: {
          id: id,
          width: size,
          height: size,
          ancestors: [...uniqueSet]
        },
        group: 'nodes'
      }
      return obj
    },
    createLineObj (source = null, target = null, branch = []) {
      if (!source || !target) return
      const uniqueSet = new Set(branch)
      const obj = {
        data: {
          id: `${source}_&_${target}`,
          source,
          target,
          description: `${source} is a subclass of ${target}`,
          branch: [...uniqueSet],
          group: 'edges'
        }
      }
      return obj
    },
    traceAncestry () {
      const gene = this.currentNodeData.ancestors
      // let target
      const arr = this.elements.filter(({ data }) => {
        const subArr = data.id.split('_&_')
        const isSub = subArr.every((element) => gene.includes(element))
        if (isSub) return true
      })

      const descendants = this.traceDescendants() ?? []
      this.isolateNodes([...arr, ...descendants])
    },
    traceDescendants (arr = null) {
      const id = this.currentNodeData.id
      const subClass =
        !arr || !Array.isArray(arr) ? this.currentClass.subClasses : arr
      if (!subClass.length) return

      const child = this.elements.filter((val) => {
        const ancestors = val.data?.ancestors ?? []
        const branch = val.data?.branch ?? []
        if (ancestors.includes(id) && ancestors[ancestors.length - 1] !== id) { return true }
        if (branch.includes(id)) return true
      })
      return child
    },
    async isolateNodes (nodes = []) {
      this.showNodeAncestry = true
      const cy = await this.$refs?.cyRef?.cy

      if (!cy || !nodes.length) return

      const selectedNodes = []
      for (let i = 0; i < nodes.length; i++) {
        const element = cy.getElementById(nodes[i].data.id)
        selectedNodes.push(element)
      }

      // Get all the nodes connected to the selected node
      const relatedNodes = await cy.collection(selectedNodes) // Includes the selected node and its connected nodes
      // Remove all elements from the graph
      cy.remove(cy.elements())

      // Add selected elements to the graph
      cy.add(relatedNodes)

      // Apply the new layout
      this.cy.use(dagre)
      cy.layout(this.layoutOptions).run()

      // Optionally, adjust the viewport to fit the isolated nodes
      cy.fit(relatedNodes, 30) // Adjust the zoom level as needed
    },
    async reset () {
      const cy = await this.$refs?.cyRef?.cy
      if (cy) {
        // Remove all displayed elements
        cy.remove(cy.elements())

        // Add default elements
        cy.add(this.elements)

        // Use default layout
        cy.layout({ ...fcoseLayout }).run()
      }
      // Hide card and reset data
      this.hideCard()
      this.currentNodeData = {}
      this.showNodeAncestry = false
    },
    goTo (id) {
      const path = `/ns/${id.split('/').pop().split('#').pop()}`
      this.$router.push(path)
    },
    async loadSingleNode (id) {
      const cy = await this.$refs?.cyRef?.cy
      if (!cy) return
      if (id === 'Thing') {
        return this.queryClass(false)
      }

      const elem = cy.getElementById(id)
      await elem.emit('click')
      await elem.select()
      this.traceAncestry()
    },
    async loadPageContent () {
      setTimeout(async () => {
        this.loading = false
        await this.$nextTick()
        if (this.$route.query?.class) {
          this.loadSingleNode(this.$route.query.class)
        }
      }, 300)
    }
  },
  async mounted () {
    await this.formatClassData()
  },
  watch: {
    '$route.query': {
      immediate: true,
      handler (newValue) {
        if (newValue?.class && this.elements.length) {
          return this.loadSingleNode(newValue?.class)
        }
        this.reset()
      }
    }
  }
}
</script>
