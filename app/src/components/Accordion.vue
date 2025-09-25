<template>
  <div class="accordion">
    <div @click="toggleOpen">
      <MdToolbar :class="dense ? 'md-dense' : 'md-toolbar_adjust u--padding-zero'">
        <div class="u_display-flex accordion-toolbar-row viz-sample__header">
          <div v-if="customTitle">
            <slot name="custom_title"></slot>
          </div>
          <h4 v-else-if="dense" class="md-subheader">{{ title }}</h4>
          <h3 v-else class="md-title">{{ title }}</h3>
          <div class="accordion-icons">
            <MdIcon v-show="!open">expand_more</MdIcon>
            <MdIcon v-show="open">expand_less</MdIcon>
          </div>
        </div>
      </MdToolbar>
    </div>
    <div class="accordion-content" v-if="open">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

// Component name for debugging
defineOptions({
  name: 'accordion',
});

// Props
interface Props {
  startOpen?: boolean;
  title?: string;
  dense?: boolean;
  customTitle?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  startOpen: false,
  title: '',
  dense: false,
  customTitle: false,
});

// Reactive data
const open = ref(props.startOpen);

// Methods
const toggleOpen = () => {
  open.value = !open.value;
};
</script>

<style scoped>
.accordion-content {
  overflow: auto;
}
.accordion-toolbar-row {
  width: 100%;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}
.accordion .viz-sample__header,
.accordion .md-dense {
  cursor: pointer;
}
</style>
