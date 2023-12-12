<template>
    <VisualizationLayout
        :link="{
            to: '/mm/metamaterial_visualization_nu',
            text: 'Visualize In Pairwise Plot'
        }"
    >
        <template #main_chart> <Histogram /> </template>

        <template #side_tools>
            <DataSelector />
            <RangeSelector />
            <MaterialInformation />
        </template>
        <template #footer>
            <DataInfo />
        </template>
    </VisualizationLayout>
</template>

<script>
import Histogram from '@/components/metamine/visualizationNU/histogram.vue';
import DataSelector from '@/components/metamine/visualizationNU/DataSelector.vue';
import RangeSelector from '@/components/metamine/visualizationNU/RangeSelector.vue';
import MaterialInformation from '@/components/metamine/visualizationNU/MaterialInformation.vue';
import VisualizationLayout from '@/components/metamine/visualizationNU/VisualizationLayout.vue';
import DataInfo from '../../../components/metamine/visualizationNU/DataInfo.vue';

export default {
    name: 'HistogramPage',
    components: {
        Histogram,
        DataSelector,
        RangeSelector,
        MaterialInformation,
        DataInfo,
        VisualizationLayout
    }
};
</script>
