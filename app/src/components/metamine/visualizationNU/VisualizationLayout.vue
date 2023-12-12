<template>
    <div class="main tool_page">
        <div class="adjust-padding" style="margin: 5px 0 0 5px">
            <div class="">
                <button v-if="validateLinkProp" class="nuplot-button-link">
                    <router-link
                        :to="link.to"
                        class="u--bg utility-transparentbg u--font-emph-700"
                    >
                        {{ link.text }}
                    </router-link>
                </button>
            </div>
            <div
                class="main-content u_display-flex md-layout"
                :class="[dense ? 'vega-view' : 'u--margin-pos']"
            >
                <div
                    class="histogram-chart md-layout-item md-size-50 md-small-size-65 md-xsmall-size-100"
                >
                    <slot name="main_chart"></slot>
                </div>
                <div
                    class="md-layout-item md-size-20 md-small-size-35 md-xsmall-size-100 u--layout-flex u--layout-flex-column u--layout-flex-justify-fs u_centralize_items utility-roverflow"
                >
                    <slot name="subcharts"></slot>
                </div>
                <div
                    class="side-tools md-size-30 md-small-size-100 md-layout-item"
                >
                    <slot name="side_tools"></slot>
                </div>
                <div class="footer md-size-100 md-layout-item">
                    <slot name="footer"></slot>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'VisualizationLayout',
    props: {
        link: {
            type: Object,
            validator: (val) =>
                Object.hasOwnProperty.call(val, 'to') &&
                Object.hasOwnProperty.call(val, 'text'),
            default: null
        },
        dense: {
            type: Boolean,
            default: false
        }
    },
    computed: {
        validateLinkProp() {
            if (!this.link || typeof this.link !== 'object') return false;
            return (
                Object.hasOwnProperty.call(this.link, 'to') &&
                Object.hasOwnProperty.call(this.link, 'text')
            );
        }
    }
};
</script>
