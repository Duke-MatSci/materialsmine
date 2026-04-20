<template>
  <div>
    <md-dialog
      :class="['dialog-box', dialogSizeClass]"
      v-model:md-active="isActive"
      :md-click-outside-to-close="false"
    >
      <div class="dialog-box_header">
        <md-dialog-title>
          <slot name="title"> </slot>
        </md-dialog-title>
        <md-button
          v-if="!disableClose"
          class="md-icon-button dialog-box_close facet-content_container u_margin-right-small"
          @click="toggleDialogBox()"
        >
          <md-icon class="utility-navfonticon u--font-emph-xl">close</md-icon>
        </md-button>
      </div>
      <div class="dialog-box_content">
        <md-dialog-content>
          <slot name="content"> </slot>
        </md-dialog-content>
      </div>
      <div class="dialog-box_actions md-button-lightbg">
        <md-dialog-actions>
          <slot name="actions"> </slot>
        </md-dialog-actions>
      </div>
    </md-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';

// Component name for debugging
defineOptions({
  name: 'DialogBox',
});

// Props
interface Props {
  active?: boolean;
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
  (e: 'update:active', value: boolean): void;
}>();

// Store
const store = useStore();

// Computed properties
const isActive = computed({
  get: () => props.active,
  set: (value: boolean) => emit('update:active', value),
});

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
