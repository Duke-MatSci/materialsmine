<template>
    <div class="data-selector-wrapper">
        <div class="data-row">
            <div class="article_metadata_strong md-title">Data</div>
            <md-table
                class="u_width--max u_divider-fullspan utility-transparentbg viz-u-postion__rel viz-u-zIndex__min"
                v-model="fetchedNames"
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
                <div>
                    <div class="query-xaxis-label">X-axis</div>
                    <select
                        class="u_width--max form__select"
                        v-model="query1Value"
                        name="xAxis"
                        @change="handleQuery1Change"
                    >
                        <option
                            v-for="item in columns"
                            :value="item"
                            v-bind:key="item"
                        >
                            {{ item }}
                        </option>
                    </select>
                </div>
            </div>
            <div
                class="u--layout-flex u--layout-flex-column"
                style="margin: 5px 0px"
            >
                <div>
                    <div class="query-yaxis-label">Y-axis</div>
                    <select
                        class="u_width--max form__select"
                        v-model="query2Value"
                        name="yAxis"
                        @change="handleQuery2Change"
                    >
                        <option
                            v-for="item in columns"
                            :value="item"
                            v-bind:key="item"
                        >
                            {{ item }}
                        </option>
                    </select>
                </div>
            </div>
        </div>
        <div v-if="page === 'hist'">
            <div
                class="u--layout-flex u--layout-flex-column"
                style="margin: 5px 0px"
            >
                <div>
                    <div class="query-xaxis-label">X-axis</div>
                    <select
                        class="u_width--max form__select"
                        v-model="query1Value"
                        name="xAxis"
                        @change="handleQuery1Change"
                    >
                        <option
                            v-for="item in columns"
                            :value="item"
                            v-bind:key="item"
                        >
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
    this.$store.dispatch(
      'metamineNU/setQuery1',
      this.$route.query.pairwise_query1,
      {
        root: true
      }
    )
    this.$store.dispatch(
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
    handleQuery1Change () {
      this.$store.dispatch('metamineNU/setQuery1', this.query1Value, {
        root: true
      })
    },
    handleQuery2Change () {
      this.$store.dispatch('metamineNU/setQuery2', this.query2Value, {
        root: true
      })
    },
    onSelectInfo (items) {
      console.log(this.showDropDown)
      console.log(
        this.showDropDown.map(
          (entry, index) =>
            !!items.map((item) => item.key).includes(index)
        )
      )
      this.showDropDown.map(
        (entry, index) =>
          !!items.map((item) => item.key).includes(index)
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
      console.log(this.fetchedNamesWithInfo)
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
