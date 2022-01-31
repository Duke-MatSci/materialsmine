<template>
  <div>
    <div v-if="loading">loading...</div>
    <div v-if="materialsData && materialsData.length > 0">
      <h1>Material Components and Attributes</h1>
      <ul
        data-test="material-properties"
        v-for="material in materialsData"
        :key="material.classType"
      >
        <li data-test="material-class">Class: {{ material.classType }}</li>
        <li>Role: {{ material.role }}</li>
        <li>
          <div
            v-for="property in material.materialProperties"
            :key="property.type"
          >
            <span>{{ property.type }}: </span>
            <span>{{ property.value }}</span>
            <span> {{ property.units }}</span>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import materialComponentsQuery from '@/modules/queries/materialComponentQuery'
import getMaterialData from '@/modules/services/getMaterialData'

export default {
  methods: {
    fetchData () {
      this.error = null
      this.loading = true
      this.materialsData = null
      getMaterialData({
        query: materialComponentsQuery,
        route: this.$route.params.label
      })
        .then((materialsData) => {
          this.materialsData = materialsData
          this.loading = false
        })
        .catch((error) => {
          console.error(error)
          this.error = 'Sorry, something went wrong'
          this.loading = false
        })
    }
  },
  data () {
    return {
      materialsData: null,
      loading: false,
      error: null
    }
  },
  created () {
    this.fetchData()
  },
  watch: {
    $route: 'fetchData'
  }
}
</script>
<style></style>
