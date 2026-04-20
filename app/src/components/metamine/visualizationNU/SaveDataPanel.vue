<template>
    <div class="sava-data-panel-wrapper" style="width: fit-content">
        <div
            class="table-header u_display-flex u--layout-flex-justify-sb u_centralize_items">
            <div class="nuplot-table-title article_metadata_strong md-title u--padding-zero">Save Data Panel</div>
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

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useStore } from 'vuex'

const columns = ['C11', 'C12', 'C22', 'C16', 'C26', 'C66']

const store = useStore()

const selectedData = computed(() => store.state.metamineNU.selectedData)

watch(selectedData, () => {
  // Deep watch on selectedData
}, { deep: true })
</script>

<script lang="ts">
import { defineComponent } from 'vue'
import JsonCSV from 'vue-json-csv'

export default defineComponent({
  name: 'SaveDataPanel',
  components: {
    downloadCsv: JsonCSV
  }
})
</script>
