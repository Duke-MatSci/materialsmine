<template>
    <div class="sava-data-panel-wrapper" style="width: fit-content">
        <div
            class="table-header"
            style="
                display: flex;
                justify-content: space-between;
                align-items: center;
            "
        >
            <div class="nuplot-table-title">Save Data Panel</div>
            <md-button>
                <download-csv :data="selectedData" name="selected_data.csv">
                    Download Data
                    <md-icon>download</md-icon>
                </download-csv>
            </md-button>
        </div>
        <md-table>
            <md-table-row>
                <md-table-cell v-for="column in columns" :key="column">
                    {{ column }}
                </md-table-cell>
            </md-table-row>
            <md-table-row
                v-for="data in selectedData"
                :key="`${data.index}-${data.name}`"
            >
                <md-table-cell v-for="column in columns" :key="column">
                    {{ data[column] }}
                </md-table-cell>
            </md-table-row>
        </md-table>
    </div>
</template>

<script>
import { mapState } from 'vuex'
import JsonCSV from 'vue-json-csv'

const columns = ['C11', 'C12', 'C22', 'C16', 'C26', 'C66']

export default {
  name: 'SaveDataPanel',
  components: {
    downloadCsv: JsonCSV
  },
  computed: {
    ...mapState('metamineNU', {
      selectedData: (state) => state.selectedData
    })
  },
  data () {
    return {
      columns: columns
    }
  },
  watch: {
    selectedData: {
      deep: true
    }
  }
}
</script>
