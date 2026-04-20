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

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useStore } from 'vuex'
import Spinner from '@/components/Spinner.vue'
import fcose from 'cytoscape-fcose'
import dagre from 'cytoscape-dagre'

import { styleObj, fcoseLayout, modifiedLayout } from '@/pages/ns/cytoscape'

interface NodeData {
  id: string
  width?: number
  height?: number
  ancestors?: string[]
  source?: string
  target?: string
  description?: string
  branch?: string[]
  group?: string
}

interface ElementDefinition {
  data: NodeData
  group?: string
}

interface ClassData {
  ID: string
  'Preferred Name': string
  subClassOf: string
  subClasses: ClassData[]
}

const router = useRouter()
const route = useRoute()
const store = useStore()

const loading = ref(true)
const showCard = ref(false)
const elements = ref<ElementDefinition[]>([])
const uniqueInd = ref(1)
const config = ref({ ...styleObj })
const currentNodeData = ref<NodeData>({} as NodeData)
const showNodeAncestry = ref(false)
const cy = ref<any>(null)
const layoutOptions = ref({ ...modifiedLayout })
const key = ref(true)
const cyRef = ref<any>(null)

const classes = computed(() => store.getters['ns/getClasses'])
const currentClass = computed(() => store.getters['ns/getCurrentClass'])

const parentClass = computed(() =>
  currentClass.value?.subClassOf.split('/').pop()?.split('#').pop()
)

const parentLink = computed(() => `/ns/${parentClass.value}`)

const currentClassLink = computed(() => {
  const param = currentClass.value.ID.split('/').pop()?.split('#').pop()
  return `/ns/${param}`
})

const layout = computed(() => fcose)

const preConfig = (cytoscape: any) => {
  cytoscape.use(layout.value)
  cy.value = cytoscape
}

const afterCreated = (cyInstance: any) => {
  cyInstance.add(elements.value)
    .layout({ ...fcoseLayout })
    .run()
}

const queryClass = (bool: boolean) => {
  if (bool && Object.keys(currentNodeData.value).length) {
    return router.push({ query: { class: currentNodeData.value.id } })
  }
  router.push({ query: undefined })
}

const selectNode = async (event: any, data: NodeData) => {
  if (!event) {
    showCard.value = false
    return
  }
  showCard.value = true
  currentNodeData.value = { ...data }
  await store.dispatch('ns/searchNSData', { query: data.id, singleResult: true })
}

const hideCard = async () => {
  showCard.value = false
  await store.dispatch('ns/searchNSData', { query: '', singleResult: true })
}

const formatClassData = async () => {
  if (!classes.value || !classes.value.length) {
    loading.value = false
    return
  }
  const arr = JSON.parse(JSON.stringify(classes.value))
  const result = createNode(arr)
  elements.value = [...result]

  setTimeout(async () => {
    loading.value = false
    await nextTick()
    if (route.query?.class) {
      loadSingleNode(route.query.class as string)
    }
  }, 300)
}

const createNode = (arr: ClassData[], nodeSize = 160, ancestors: string[] = []): ElementDefinition[] => {
  if (!Array.isArray(arr)) {
    return []
  }
  let results: ElementDefinition[] = []
  for (let i = 0; i < arr.length; i++) {
    const obj = arr[i]

    const id = obj.ID.split('/').pop()?.split('#').pop() || ''
    const subClassOf = obj.subClassOf.split('/').pop()?.split('#').pop() || ''

    const node = createNodeObj(id, nodeSize, [
      ...ancestors,
      subClassOf,
      id
    ])
    const line = createLineObj(id, subClassOf, [...ancestors])

    if (node) results.push(node)

    if (id !== subClassOf && line) {
      results.push(line)
    }

    if (obj.subClasses?.length) {
      const children = createNode(obj.subClasses, nodeSize, [
        ...ancestors,
        subClassOf,
        id
      ])
      results = [...results, ...children]
    }
  }
  return results
}

const createNodeObj = (id: string | null = null, size = 160, ancestors: string[] = []): ElementDefinition | undefined => {
  if (!id) return
  const uniqueSet = new Set(ancestors)
  const obj: ElementDefinition = {
    data: {
      id: id,
      width: size,
      height: size,
      ancestors: [...uniqueSet]
    },
    group: 'nodes'
  }
  return obj
}

const createLineObj = (source: string | null = null, target: string | null = null, branch: string[] = []): ElementDefinition | undefined => {
  if (!source || !target) return
  const uniqueSet = new Set(branch)
  const obj: ElementDefinition = {
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
}

const traceAncestry = () => {
  const gene = currentNodeData.value.ancestors || []
  const arr = elements.value.filter(({ data }) => {
    const subArr = data.id.split('_&_')
    const isSub = subArr.every((element) => gene.includes(element))
    if (isSub) return true
    return false
  })

  const descendants = traceDescendants() ?? []
  isolateNodes([...arr, ...descendants])
}

const traceDescendants = (arr: ClassData[] | null = null): ElementDefinition[] | undefined => {
  const id = currentNodeData.value.id
  const subClass = !arr || !Array.isArray(arr) ? currentClass.value.subClasses : arr
  if (!subClass?.length) return

  const child = elements.value.filter((val) => {
    const ancestors = val.data?.ancestors ?? []
    const branch = val.data?.branch ?? []
    if (ancestors.includes(id) && ancestors[ancestors.length - 1] !== id) { return true }
    if (branch.includes(id)) return true
    return false
  })
  return child
}

const isolateNodes = async (nodes: ElementDefinition[] = []) => {
  showNodeAncestry.value = true
  const cyInstance = await cyRef.value?.cy

  if (!cyInstance || !nodes.length) return

  const selectedNodes = []
  for (let i = 0; i < nodes.length; i++) {
    const element = cyInstance.getElementById(nodes[i].data.id)
    selectedNodes.push(element)
  }

  // Get all the nodes connected to the selected node
  const relatedNodes = await cyInstance.collection(selectedNodes) // Includes the selected node and its connected nodes
  // Remove all elements from the graph
  cyInstance.remove(cyInstance.elements())

  // Add selected elements to the graph
  cyInstance.add(relatedNodes)

  // Apply the new layout
  cy.value.use(dagre)
  cyInstance.layout(layoutOptions.value).run()

  // Optionally, adjust the viewport to fit the isolated nodes
  cyInstance.fit(relatedNodes, 30) // Adjust the zoom level as needed
}

const reset = async () => {
  const cyInstance = await cyRef.value?.cy
  if (cyInstance) {
    // Remove all displayed elements
    cyInstance.remove(cyInstance.elements())

    // Add default elements
    cyInstance.add(elements.value)

    // Use default layout
    cyInstance.layout({ ...fcoseLayout }).run()
  }
  // Hide card and reset data
  hideCard()
  currentNodeData.value = {} as NodeData
  showNodeAncestry.value = false
}

const goTo = (id: string) => {
  const path = `/ns/${id.split('/').pop()?.split('#').pop()}`
  router.push(path)
}

const loadSingleNode = async (id: string) => {
  const cyInstance = await cyRef.value?.cy
  if (!cyInstance) return
  if (id === 'Thing') {
    return queryClass(false)
  }

  const elem = cyInstance.getElementById(id)
  await elem.emit('click')
  await elem.select()
  traceAncestry()
}

const loadPageContent = async () => {
  setTimeout(async () => {
    loading.value = false
    await nextTick()
    if (route.query?.class) {
      loadSingleNode(route.query.class as string)
    }
  }, 300)
}

onMounted(async () => {
  await formatClassData()
})

watch(() => route.query, (newValue) => {
  if (newValue?.class && elements.value.length) {
    return loadSingleNode(newValue.class as string)
  }
  reset()
}, { immediate: true })
</script>
