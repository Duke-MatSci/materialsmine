<template>
    <div :class="{facet: true, active: searchEnabled}">
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
export default {
    name: 'FacetPanel',
    props: ['searchEnabled']
}
</script>
<style lang="scss" scoped>
    .active {
        opacity: .6;
    }
</style>