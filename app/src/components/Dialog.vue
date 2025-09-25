<template>
  <div>
    <MdDialog
      :class="['dialog-box', dialogSizeClass]"
      :md-active="active"
      :md-click-outside-to-close="false"
      @update:md-active="$emit('update:active', $event)"
    >
      <div class="dialog-box_header">
        <MdDialogTitle>
          <slot name="title"></slot>
        </MdDialogTitle>
        <MdButton
          v-if="!disableClose"
          class="md-icon-button dialog-box_close facet-content_container u_margin-right-small"
          @click="toggleDialogBox()"
        >
          <MdIcon class="utility-navfonticon u--font-emph-xl">close</MdIcon>
        </MdButton>
      </div>
      <div class="dialog-box_content">
        <MdDialogContent>
          <slot name="content"></slot>
        </MdDialogContent>
      </div>
      <div class="dialog-box_actions md-button-lightbg">
        <MdDialogActions>
          <slot name="actions"></slot>
        </MdDialogActions>
      </div>
    </MdDialog>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';

// Component name for debugging
defineOptions({
  name: 'AppDialog',
});

// Props
interface Props {
  active: boolean;
  minWidth?: number;
  disableClose?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  active: false,
  minWidth: 60,
  disableClose: false,
});

// Emits
const emit = defineEmits<{
  'update:active': [value: boolean];
}>();

// Store
const store = useStore();

// Computed properties
const dialogSizeClass = computed(() => {
  const sizeMap: Record<number, string> = {
    40: 'dialog-box_size-sm',
    60: 'dialog-box_size-md',
    80: 'dialog-box_size-lg',
  };
  return sizeMap[props.minWidth] || 'dialog-box_size-md';
});

// Methods
const toggleDialogBox = () => {
  store.commit('setDialogBox');
};
</script>
