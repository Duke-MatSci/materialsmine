<template>
  <div>
    <p v-show="showSchemaWarning && specValidation.valid === false">Vega-Lite specification does not conform to schema</p>
    <p v-show="renderError">Error while rendering Vega-Lite specification</p>
    <p v-show="!validVersionNum">Could not determine vega lite schema version</p>
    <p v-show="!hasDataObject">No data object was provided in Vega-Lite specification</p>

    <div v-show="!renderError&&validVersionNum" v-bind:id="id"></div>
  </div>
</template>

<script>
import vegaLite4Schema from 'vega-lite4/build/vega-lite-schema.json'
import vegaLite5Schema from 'vega-lite5/build/vega-lite-schema.json'
import { compile as vegaLite4Compile } from 'vega-lite4'
import { compile as vegaLite5Compile, isNumeric } from 'vega-lite5'
import embed from 'vega-embed'

import debounce from '@/modules/debounce'

import { validate as jsonValidate } from 'jsonschema'

const vegaLiteVersions = {
  4: {
    schema: vegaLite4Schema,
    compile: vegaLite4Compile
  },
  5: {
    schema: vegaLite5Schema,
    compile: vegaLite5Compile
  }
}

const schemaIdMap = {}

for (const [ver, verObj] of Object.entries(vegaLiteVersions)) {
  const schemaId = `https://vega.github.io/schema/vega-lite/v${ver}.json`
  schemaIdMap[schemaId] = verObj
  verObj.schemaId = schemaId
  verObj.versionNum = ver
}

export default {
  name: 'vega-lite',
  data () {
    return {
      id: 'vega-lite',
      specValidation: {},
      renderError: false,
      validVersionNum: true
    }
  },
  computed: {
    hasDataObject () {
      return !!this.spec.data
    }
  },
  props: {
    spec: {
      type: Object,
      default: () => null
    },
    dataname: {
      type: String,
      default: () => null
    },
    data: {
      type: Object,
      default: () => null
    },
    showSchemaWarning: {
      type: Boolean,
      default: () => false
    }
  },
  created () {
    this.onSpecChange = debounce(this.processSpec, 300)
    this.onSpecChange()
  },
  methods: {
    async plotSpec (versionNum) {
      // Cancel plotting if the component's element no longer exists in dom
      if (!document.body.contains(this.$el)) {
        return
      }
      try {
        const { spec: vegaSpec } = vegaLiteVersions[versionNum].compile(this.spec)
        const result = await embed(`#${this.id}`, vegaSpec, {})
        if (this.data) {
          const name = this.dataname || ((this.spec || {}).data || {}).name || 'source_0'
          result.view.insert(name, this.data).resize().run()
        }
        this.$emit('new-vega-view', result.view)
        this.renderError = false
        this.alignVegaTooltips()
      } catch (ex) {
        console.error('Error while rendering vega-lite specification', ex)
        this.renderError = true
      }
    },
    alignVegaTooltips () {
      const canvas = document.getElementsByClassName('marks')[0]
      const vegaBindings = document.getElementsByClassName('vega-bindings')[0]
      vegaBindings.style.width = canvas.style.width
    },
    validateSpec (versionNum) {
      try {
        const validation = jsonValidate(this.spec, vegaLiteVersions[versionNum].schema)
        if (!validation.valid) {
          console.warn('Invalid spec', validation)
        } else {
          console.debug('Valid spec', validation)
        }
        this.specValidation = validation
      } catch (e) {
        console.error('spec validation error')
        console.error(e)
        this.specValidation = { valid: false }
      }
    },
    getVersionNum () {
      const schemaId = this.spec.$schema
      let versionNum = null

      if (schemaId) {
        // Try to match using provided schema id
        if (schemaId in schemaIdMap) {
          versionNum = schemaIdMap[schemaId].versionNum
        } else {
          console.warn(`unknown vega lite schema type: ${schemaId}`)
          console.warn('available schemas:', Object.keys(schemaIdMap))
        }
      } else {
        // Run validators on spec to see what works
        console.warn('no schema id provided in spec. Attempting to match schema...')
        for (const [vNum, vObj] of Object.entries(vegaLiteVersions)) {
          try {
            const validation = jsonValidate(vObj.schema)
            // Prefer higher version numbers
            if (validation.valid && vNum > versionNum) {
              versionNum = vNum
            }
          } catch (e) {
            console.warn(`does not match v${vNum}`)
          }
        }
        if (versionNum) {
          console.warn(`using vega lite v${versionNum}`)
        } else {
          console.warn('could not find workable vega lite version')
        }
      }

      return versionNum
    },
    processSpec () {
      const versionNum = this.getVersionNum()
      this.validVersionNum = isNumeric(versionNum)
      if (this.validVersionNum) {
        if (this.hasDataObject) {
          this.validateSpec(versionNum)
        }
        this.plotSpec(versionNum)
      }
    }
  },
  watch: {
    spec () {
      this.onSpecChange()
    }
  }
}

</script>
