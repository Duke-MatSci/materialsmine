<template>
  <div>
    <div v-if="loading">loading...</div>
    <div v-if="materialsData && materialsData.length > 0">
      <div class="md-display-1">Material Components and Attributes</div>
      <div class="card-container">
        <md-card
          data-test="material-properties"
          v-for="material in materialsData"
          :key="material.classType"
        >
          <md-card-header>
            <div class="md-title">{{ material.classType }}</div>
          </md-card-header>
          <md-card-content>
            <div data-test="material-class">
              <span class="md-body-2">Class</span> {{ material.classType }}
            </div>
            <div><span class="md-body-2">Role</span> {{ material.role }}</div>
            <md-divider class="md-divider"></md-divider>
            <div
              v-for="property in material.materialProperties"
              :key="property.type"
            >
              <span class="md-body-2">{{ property.type }} </span>
              <span>{{ property.value }}</span>
              <span> {{ property.units }}</span>
            </div>
          </md-card-content>
        </md-card>
      </div>
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
<style lang="scss" scoped>
.card-container {
  display: flex;
  flex-wrap: wrap;
  padding: 0;
  gap: 28px;
}
.md-card {
  max-width: 350px;
  vertical-align: top;
  margin: 0;
  padding: 0;
}

.md-divider {
  margin: 10px 0px;
}
.md-display-1 {
  margin: 10px 0px;
  color: #000;
}
</style>
