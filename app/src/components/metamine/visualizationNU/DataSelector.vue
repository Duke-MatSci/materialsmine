<template>
    <div class="data-selector-wrapper">
        <div class="data-row">
            <div class="article_metadata_strong md-title">Data</div>
            <md-table
                class="u_width--max u_divider-fullspan utility-transparentbg viz-u-postion__rel viz-u-zIndex__min"
                v-model="fetchedNames"
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
                                md-clickable
                                :style="{
                                    'background-color': item.color,
                                    color: 'white'
                                }"
                                >{{ item.name }}</md-chip
                            >
                        </md-table-cell>
                    </md-table-row>
                </template>
            </md-table>
        </div>
        <div v-if="page === 'scatter'">
            <div
                class="u--layout-flex u--layout-flex-column"
                style="margin: 5px 0px"
            >
                <md-field>
                    <label for="xAxis">X-axis</label>
                    <md-select
                        class="u_width--max"
                        v-model="query1"
                        name="xAxis"
                        @change="handleQuery1Change"
                    >
                        <md-option value="C11">C11</md-option>
                        <md-option value="C12">C12</md-option>
                        <md-option value="C22">C22</md-option>
                        <md-option value="C16">C16</md-option>
                        <md-option value="C26">C26</md-option>
                        <md-option value="C66">C66</md-option>
                    </md-select>
                </md-field>
            </div>
            <div
                class="u--layout-flex u--layout-flex-column"
                style="margin: 5px 0px"
            >
                <md-field>
                    <label for="yAxis">Y-axis</label>
                    <md-select
                        class="u_width--max"
                        v-model="query2"
                        name="yAxis"
                        @change="handleQuery2Change"
                    >
                        <md-option value="C11">C11</md-option>
                        <md-option value="C12">C12</md-option>
                        <md-option value="C22">C22</md-option>
                        <md-option value="C16">C16</md-option>
                        <md-option value="C26">C26</md-option>
                        <md-option value="C66">C66</md-option>
                    </md-select>
                </md-field>
            </div>
        </div>
        <div v-if="page === 'hist'">
            <div
                class="u--layout-flex u--layout-flex-column"
                style="margin: 5px 0px"
            >
                <md-field>
                    <label for="xAxis">X-axis</label>
                    <md-select
                        v-model="query1"
                        class="u_width--max"
                        name="xAxis"
                        @change="handleQuery1Change"
                    >
                        <md-option value="C11">C11</md-option>
                        <md-option value="C12">C12</md-option>
                        <md-option value="C22">C22</md-option>
                        <md-option value="C16">C16</md-option>
                        <md-option value="C26">C26</md-option>
                        <md-option value="C66">C66</md-option>
                    </md-select>
                </md-field>
            </div>
        </div>
    </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'DataSelector',
  mounted () {
    if (!this.query1) {
      this.handleQuery1Change(this.$route.query.pairwise_query1)
    }
    if (!this.query2) {
      this.handleQuery2Change(this.$route.query.pairwise_query2)
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
    }
  },
  watch: {
    fetchedNames: {
      handler: function (val, oldVal) {
        this.data = val
        this.selectedRowKeys = val.map((item) => item.key)
      },
      deep: true
    },
    activeData: {
      handler: function (val, oldVal) {
        this.selectedRowKeys = this.fetchedNames
          .map((item) => {
            return val.map((d) => d.name).includes(item.name)
              ? item.key
              : null
          })
          .filter((item) => item !== null)
      },
      deep: true
    },
    dataLibrary: {
      handler: function (val, oldVal) {},
      deep: true
    }
  },
  methods: {
    handleQuery1Change (value) {
      this.$store.dispatch('metamineNU/setQuery1', value)
    },
    handleQuery2Change (value) {
      this.$store.dispatch('metamineNU/setQuery2', value)
    },
    onSelect (items) {
      const self = this
      const selected = items
      const unselected = this.fetchedNames.filter(
        (item) => !selected.includes(item)
      )
      selected.map((dataNameObj, index) => {
        let sourceItems = self.activeData
        let destItems = self.dataLibrary
        const checked = destItems.filter(
          (item) => item.name === dataNameObj.name
        )
        destItems = destItems.filter(
          (item) => item.name !== dataNameObj.name
        )
        sourceItems = [...sourceItems, ...checked]
        self.$store.dispatch('metamineNU/setActiveData', sourceItems)
        self.$store.dispatch('metamineNU/setDataLibrary', destItems)
      })
      unselected.map((dataNameObj, index) => {
        let sourceItems = self.dataLibrary
        let destItems = self.activeData
        const unchecked = destItems.filter(
          (item) => item.name === dataNameObj.name
        )
        destItems = destItems.filter(
          (item) => item.name !== dataNameObj.name
        )
        sourceItems = [...sourceItems, ...unchecked]
        self.$store.dispatch('metamineNU/setActiveData', destItems)
        self.$store.dispatch('metamineNU/setDataLibrary', sourceItems)
      })
    }
  }
}
</script>
