<template>
    <div class="neighbor-panel-wrapper">
        <div
            class="table-header"
            style="
                display: flex;
                justify-content: space-between;
                align-items: center;
            "
        >
            <div class="nuplot-table-title">Nearest Neighbors Panel</div>
            <md-button>
                <download-csv
                    :data="neighbors"
                    name="five_nearest_neighbors.csv"
                >
                    Download Data
                    <md-icon>download</md-icon>
                </download-csv>
            </md-button>
        </div>
        <md-table>
            <md-table-row>
                <md-table-cell
                    v-for="neighbor in neighbors"
                    :key="neighbor.index"
                >
                    <StructureKnnVue :dataPoint="neighbor" />
                </md-table-cell>
            </md-table-row>
            <md-table-row v-for="column in columns" :key="column">
                <md-table-cell
                    v-for="neighbor in neighbors"
                    :key="`${column}-${neighbor.index}`"
                    style="font-size: 8px"
                >
                    {{ column }}: {{ neighbor[column] }}
                </md-table-cell>
            </md-table-row>
        </md-table>
    </div>
</template>

<style scoped>
.neighbor-panel-wrapper {
    width: fit-content;
}
.table-title {
    font-size: 20px;
    font-weight: bold;
    margin: 0px 10px;
    padding: 0px;
}
</style>

<script>
import { mapState } from 'vuex'
import StructureKnnVue from './StructureKnn.vue'
import JsonCSV from 'vue-json-csv'

const columns = ['C11', 'C12', 'C22', 'C16', 'C26', 'C66', 'distance']

export default {
  name: 'NeighborPanel',
  components: {
    StructureKnnVue,
    downloadCsv: JsonCSV
  },
  computed: {
    ...mapState('metamineNU', {
      neighbors: (state) => state.neighbors
    })
  },
  data () {
    return {
      columns: columns
    }
  }
}
</script>
