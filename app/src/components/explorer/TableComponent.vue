<template>
  <section class="u_width--max">
    <md-table
      v-model="paginatedData"
      :md-sort.sync="currentSort"
      :md-sort-order.sync="currentSortOrder"
      :md-sort-fn="customSort"
    >
      <md-table-empty-state md-label="No Data" :md-description="emptyState">
      </md-table-empty-state>
      <md-table-row slot="md-table-row" slot-scope="{ item }">
        <md-table-cell
          v-for="(val, k, i) in item"
          :md-label="k"
          :key="`${k}/${i}`"
          :md-sort-by="k"
        >
          {{ val }}</md-table-cell
        >
      </md-table-row>
    </md-table>
    <Pagination
      v-if="paginate && totalPages > 1"
      :cpage="currentPage"
      :tpages="totalPages || 1"
      @go-to-page="paginateTable($event)"
    />
  </section>
</template>

<script>
import Pagination from '@/components/explorer/Pagination'

export default {
  name: 'TableComponent',
  props: {
    tableData: {
      type: Array,
      default: () => []
    },
    paginate: {
      type: Boolean,
      default: true
    },
    pageSize: {
      type: Number,
      default: 7
    },
    emptyState: {
      type: String,
      default: 'No Viscoelastic Data Uploaded'
    },
    sortBy: {
      type: String
    }
  },
  components: {
    Pagination
  },
  data () {
    return {
      paginatedData: [],
      currentPage: 1,
      currentSort: '',
      currentSortOrder: 'asc'
    }
  },
  mounted () {
    this.setTable()
    this.currentSort = this.sortBy
  },
  methods: {
    paginateTable (page = this.currentPage) {
      const data = this.tableData ?? []
      if (data.length <= this.pageSize) return (this.paginatedData = data)
      const end = this.pageSize * page
      const start = this.pageSize * (page - 1)
      this.paginatedData = data.slice(start, end)
      this.currentPage = page
    },
    customSort () {
      this.tableData.sort((a, b) => a[this.currentSort] - b[this.currentSort])
      if (this.currentSortOrder !== 'asc') this.tableData.reverse()
    },
    setTable () {
      if (!this.paginate) return (this.paginatedData = this.tableData ?? [])
      this.paginateTable()
    }
  },
  watch: {
    tableData: {
      handler: function () {
        this.setTable()
      },
      deep: true
    }
  },
  computed: {
    totalPages () {
      const total = this.tableData?.length ?? 0
      return Math.ceil(total / this.pageSize)
    }
  }
}
</script>
