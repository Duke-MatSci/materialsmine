<template>
  <div class="sample-view">
    <spinner v-if="loading" :loading="loading" :text="'Loading sample page'" />
    <div v-else>
      <div v-if="header">
        <h1>{{ this.$route.params.label }}</h1>
        <span>{{ header.sample_label }}</span>
        <span>{{ header.process_label }}</span>
        <div>DOI: {{ header.DOI }}</div>
      </div>
      <div v-if="materialComponents">
        <h2>Material Components and Attributes</h2>
        <ul v-for="material in materialComponents" :key="material.class">
          <li>Class: {{ material.class }}</li>
          <li>Role: {{ material.role }}</li>
          <li
            v-for="property in material.materialProperties"
            :key="property.type"
          >
            <span>{{ property.type }}</span
            >:
            <span>{{ property.value }}</span>
            <span>{{ property.units }}</span>
          </li>
        </ul>
      </div>
      <div v-if="sampleImages">
        <h2>Sample Images</h2>

        <img
          data-test="sample_image"
          v-for="image in sampleImages"
          :key="image.src"
          :src="image.src"
          :alt="image.alt"
        />
      </div>
      <div v-if="curatedProperties">
        <h2>Curated Properties of Nanocomposite Sample</h2>
        <div>Scalar attributes:</div>
        <ul>
          <li
            v-for="property in curatedProperties"
            :key="property.type + property.value"
          >
            <span>{{ property.type }}:</span>
            <span>{{ property.value }}</span>
            <span>{{ property.units }}</span>
          </li>
        </ul>
      </div>
      <div v-if="processingSteps && processLabel">
        <h2>Curated Processing Steps and Parameters</h2>
        <div>Class: {{ processLabel }}</div>
        <div>Processing Steps:</div>
        <ul>
          <li v-for="step in processingSteps" :key="step.description">
            <span>{{ step.parameterLabel }}</span>
            {{ step.description }}
          </li>
        </ul>
      </div>
      <div v-if="otherSamples">
        <h2>Other Samples from this Research Article</h2>
        <div>
          <router-link
            style="display: block"
            :to="`/explorer/sample/${link}`"
            v-for="link in otherSamples"
            :key="link"
          >
            {{ link }}
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { querySparql, parseSPARQL } from '@/modules/sparql'
import sampleQueries from '@/modules/queries/sampleQueries'
import Spinner from '@/components/Spinner'

export default {
  name: 'SampleView',
  components: {
    Spinner
  },
  data () {
    return {
      header: null,
      materialComponents: null,
      curatedProperties: null,
      processLabel: null,
      processingSteps: null,
      sampleImages: null,
      otherSamples: null,
      loading: false
    }
  },
  methods: {
    async fetchData (query) {
      const sampleId = this.$route.params.label
      return await querySparql(query(sampleId))
    },
    parseHeader (data) {
      const parsedData = parseSPARQL(data)
      if (!parsedData.length) return null
      const [sampleData] = parsedData
      return sampleData
    },
    parseOtherSamples (data) {
      const parsedData = parseSPARQL(data)
      if (!parsedData.length) return null
      const links = parsedData.map(({ sample }) => sample.split('/').pop())
      return links
    },
    parseProcessLabel (data) {
      const parsedData = parseSPARQL(data)
      if (!parsedData.length) return null
      const [processLabelObject] = parsedData
      const { process_label: processLabel } = processLabelObject
      return processLabel
    },
    parseMaterialData (data) {
      const parsedData = parseSPARQL(data)
      if (!parsedData.length) return null
      const seen = new Set()
      const filteredArr = parsedData
        .filter((item) => {
          const duplicate = seen.has(item.std_name)
          seen.add(item.std_name)
          return !duplicate
        })
        .map((item) => {
          return {
            class: item.std_name,
            role: item.role
          }
        })

      filteredArr.forEach((element) => {
        const materialProperties = parsedData
          .filter((item) => item.std_name === element.class)
          .map((item) => {
            const { attrUnits, attrValue: value, attrType } = item
            const units = attrUnits || ''
            const type = attrType
              .split('/')
              .pop()
              .match(/[A-Z][a-z]+|[0-9]+/g)
              .join(' ')
            return {
              type,
              units,
              value
            }
          })
        element.materialProperties = materialProperties
      })
      return filteredArr
    },
    parseCuratedProperties (data) {
      const parseData = parseSPARQL(data)
      if (!parseData.length) return null
      const curatedProperties = parseData.map((property) => {
        const { AttrType, value, Units: units } = property
        const type = AttrType.split('/')
          .pop()
          .match(/[A-Z][a-z]+|[0-9]+/g)
          .join(' ')
        return {
          type,
          units,
          value
        }
      })
      return curatedProperties
    },
    parseProcessingSteps (data) {
      const parsedData = parseSPARQL(data)
      if (!parsedData.length) return null
      const steps = parsedData.map(
        ({ param_label: parameterLabel, Descr: description }) => {
          return { parameterLabel, description }
        }
      )
      return steps
    },
    parseSampleImages (data) {
      const parsedData = parseSPARQL(data)
      if (!parsedData.length) return null
      const images = parsedData.map((item) => {
        return { src: item.image, alt: item.sample }
      })
      return images
    },
    async fetchSamplePageData () {
      this.loading = true
      Promise.allSettled([
        this.fetchData(sampleQueries.materialComponents),
        this.fetchData(sampleQueries.curatedProperties),
        this.fetchData(sampleQueries.processLabel),
        this.fetchData(sampleQueries.processingSteps),
        this.fetchData(sampleQueries.sampleImages),
        this.fetchData(sampleQueries.otherSamples),
        this.fetchData(sampleQueries.header)
      ]).then((res) => {
        const data = res.map((promise) => {
          if (promise.status === 'fulfilled') return promise.value
          console.error(promise.reason)
          return null
        })
        const [
          materialComponents,
          curatedProperties,
          processLabel,
          processingSteps,
          sampleImages,
          otherSamples,
          header
        ] = data
        this.materialComponents = this.parseMaterialData(materialComponents)
        this.curatedProperties = this.parseCuratedProperties(curatedProperties)
        this.processLabel = this.parseProcessLabel(processLabel)
        this.processingSteps = this.parseProcessingSteps(processingSteps)
        this.sampleImages = this.parseSampleImages(sampleImages)
        this.otherSamples = this.parseOtherSamples(otherSamples)
        this.header = this.parseHeader(header)
        this.loading = false
      })
    }
  },

  watch: {
    $route: 'fetchSamplePageData'
  },
  created () {
    this.fetchSamplePageData()
  }
}
</script>
<style>
.sample-view {
  width: 100%;
  height: 100%;
}
</style>
