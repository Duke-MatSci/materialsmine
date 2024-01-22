<template>
  <div class="data-selector-wrapper">
    <div class="data-row">
      <div class="article_metadata_strong md-title">Data</div>
      <md-table
        class="u_width--max u_divider-fullspan utility-transparentbg viz-u-postion__rel viz-u-zIndex__min"
        :value="fetchedNames"
        md-sort="key"
        md-sort-order="asc"
        @md-selected="onSelect"
        :md-selected-value="selectedValue"
      >
        <md-table-empty-state md-label="No data available">
        </md-table-empty-state>
        <template #md-table-row="{ item }">
          <md-table-row
            md-selectable="multiple"
            md-auto-select
            md-default-selected
            :key="item.name"
          >
            <md-table-cell md-label="Name" md-sort-by="name">
              <md-chip
                :style="{ 'background-color': item.color, color: 'white' }"
              >
                {{ item.name }}
              </md-chip>
            </md-table-cell>
          </md-table-row>
        </template>
      </md-table>
    </div>
    <div v-if="page === 'scatter'">
      <div class="u--layout-flex u--layout-flex-column" style="margin: 5px 0px">
        <div>
          <div class="query-xaxis-label">X-axis</div>
          <select
            class="u_width--max form__select"
            v-model="query1Value"
            name="xAxis"
            @change="handleQuery1Change"
          >
            <option v-for="item in columns" :value="item" v-bind:key="item">
              {{ item }}
            </option>
          </select>
        </div>
      </div>
      <div class="u--layout-flex u--layout-flex-column" style="margin: 5px 0px">
        <div>
          <div class="query-yaxis-label">Y-axis</div>
          <select
            class="u_width--max form__select"
            v-model="query2Value"
            name="yAxis"
            @change="handleQuery2Change"
          >
            <option v-for="item in columns" :value="item" v-bind:key="item">
              {{ item }}
            </option>
          </select>
        </div>
      </div>
    </div>
    <div v-if="page === 'hist'">
      <div class="u--layout-flex u--layout-flex-column" style="margin: 5px 0px">
        <div>
          <div class="query-xaxis-label">X-axis</div>
          <select
            class="u_width--max form__select"
            v-model="query1Value"
            name="xAxis"
            @change="handleQuery1Change"
          >
            <option v-for="item in columns" :value="item" v-bind:key="item">
              {{ item }}
            </option>
          </select>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'DataSelector',
  mounted () {
    this.query1Value = this.query1
      ? this.query1
      : this.$route.query.pairwise_query1
    this.query2Value = this.query2
      ? this.query2
      : this.$route.query.pairwise_query2
    this.$store.commit(
      'metamineNU/setQuery1',
      this.$route.query.pairwise_query1,
      {
        root: true
      }
    )
    this.$store.commit(
      'metamineNU/setQuery2',
      this.$route.query.pairwise_query2,
      {
        root: true
      }
    )
  },
  data () {
    return {
      columns: ['C11', 'C12', 'C22', 'C16', 'C26', 'C66'],
      query1Value: 'C11',
      query2Value: 'C12'
    }
  },
  computed: {
    ...mapState('metamineNU', {
      activeData: (state) => state.activeData,
      fetchedNames: (state) => state.fetchedNames,
      dataLibrary: (state) => state.dataLibrary,
      page: (state) => state.page,
      query1: (state) => state.query1,
      query2: (state) => state.query2
    }),
    selectedValue () {
      return this.fetchedNames.filter((item) =>
        this.activeData.map((data) => data.name).includes(item.name)
      )
    },
    fetchedNamesWithInfo () {
      return this.fetchedNames.map((element) => {
        element.showDropDown = false
        return element
      })
    }
  },
  methods: {
    handleQuery1Change () {
      this.changeRouteQuery()
      this.$store.commit('metamineNU/setQuery1', this.query1Value)
    },
    handleQuery2Change () {
      this.changeRouteQuery()
      this.$store.commit('metamineNU/setQuery2', this.query2Value)
    },
    changeRouteQuery () {
      const query = {
        pairwise_query1: this.query1Value,
        pairwise_query2: this.query2Value
      }
      this.$router.push({ query })
    },
    onSelectInfo (items) {
      this.showDropDown.map(
        (entry, index) => !!items.map((item) => item.key).includes(index)
      )
    },
    onSelect (items) {
      const self = this
      const selected = items
      this.fetchedNamesWithInfo.map((entry, index) =>
        items.map((item) => item.key).includes(index)
          ? (entry.showDropDown = true)
          : (entry.showDropDown = false)
      )
      const unselected = this.fetchedNames.filter(
        (item) => !selected.includes(item)
      )
      selected.map((dataNameObj, index) => {
        let sourceItems = self.activeData
        let destItems = self.dataLibrary
        const checked = destItems.filter(
          (item) => item.name === dataNameObj.name
        )
        destItems = destItems.filter((item) => item.name !== dataNameObj.name)
        sourceItems = [...sourceItems, ...checked]
        self.$store.commit('metamineNU/setActiveData', sourceItems)
        self.$store.commit('metamineNU/setDataLibrary', destItems)
      })
      unselected.map((dataNameObj, index) => {
        let sourceItems = self.dataLibrary
        let destItems = self.activeData
        const unchecked = destItems.filter(
          (item) => item.name === dataNameObj.name
        )
        destItems = destItems.filter((item) => item.name !== dataNameObj.name)
        sourceItems = [...sourceItems, ...unchecked]
        self.$store.commit('metamineNU/setActiveData', destItems)
        self.$store.commit('metamineNU/setDataLibrary', sourceItems)
      })
    }
  }
}
</script>
