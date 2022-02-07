<template>
    <div :class="{facet: true, facet_active: searchEnabled}">
        <div class="facet_viewport">
            <md-list>
                <md-subheader class="md-primary facet-header">Filter Panel</md-subheader>
                <md-divider></md-divider>
                <slot >Default Test</slot>
            </md-list>
        </div>
    </div>
</template>
<script>
import Facet from '@/modules/facet.js'
export default {
    name: 'FacetPanel',
    props: ['searchEnabled'],
    mounted() {
        Facet()
    }
}
</script>