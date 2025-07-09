<template>
  <article class="u_width--max">
    <header aria-label="dynamfit-header" class="explorer_page_header">
      <h1 class="visualize_header-h1 u_margin-top-med u_centralize_text">
        DynamFit
      </h1>
    </header>
    <main
      aria-label="dynamfit-main"
      class="u--margin-posmd md-layout md-alignment-top-space-around u_relative"
    >
      <div
        class="viz-u-postion__abs header_404_nav"
        style="top: -3rem; right: 2rem; z-index: 1000"
      >
        <a class="btn-text" href="#" v-on:click="toggleDialogBox"
          >Toggle C1/C2</a
        >
      </div>
      <!-- aside  -->
      <aside
        aria-label="dynamfit-setting"
        class="md-layout-item md-size-25 md-medium-size-35 md-small-size-100 md-xsmall-size-100 u_height--auto"
      >
        <ChartSetting />
      </aside>
      <!-- main  -->
      <section
        aria-label="dynamfit-data"
        class="md-layout-item md-size-70 md-medium-size-60 md-small-size-100 md-xsmall-size-100 u_height--auto"
      >
        <ChartVisualizer />
      </section>
    </main>
    <dialogbox :active="dialogBoxActive" :minWidth="40">
      <template v-slot:title>{{ dialog.title }}</template>
      <template v-slot:content>
        <div>
          <select
            class="form__input form__input--adjust utility-padding-sm"
            v-model="selectedProp"
          >
            <option value="select">Select Domain</option>
            <option value="c1">C1</option>
            <option value="c2">C2</option>
          </select>
        </div>
      </template>
      <template v-slot:actions>
        <md-button @click.native.prevent="toggleDialogBox"> Submit </md-button>
        <md-button @click.native.prevent="toggleDialogBox">Close</md-button>
      </template>
      <!-- <template v-slot:actions>
        <button
          class="md-button btn btn--primary u--b-rad"
          @click="dialogBoxActive = false"
        >
          Close
        </button>
      </template> -->
    </dialogbox>
  </article>
</template>

<script>
import ChartSetting from '@/components/explorer/dynamfit/ChartSetting.vue';
import ChartVisualizer from '@/components/explorer/dynamfit/ChartVisualizer.vue';
import Dialog from '@/components/Dialog.vue';
import { mapMutations, mapGetters } from 'vuex';

export default {
  name: 'DynamFit',
  components: {
    ChartSetting,
    ChartVisualizer,
    dialogbox: Dialog
  },
  data() {
    return {
      selectedProp: 'select',
      dialog: {
        title: 'Select'
      }
    };
  },
  computed: {
    ...mapGetters({
      dialogBoxActive: 'dialogBox'
    })
  },
  methods: {
    ...mapMutations({
      toggleDialogBox: 'setDialogBox'
    })
  }
};
</script>
