<template>
  <component :is="tag" :class="classname">
    <md-list-item>
      <div class="md-layout-item md-size-60 display-text" style="height: 2rem">{{ fileName }}</div>
      <div class="md-layout-item">
        <span v-if="customActions">
          <slot name="custom_actions"></slot>
        </span>
        <md-button
          v-if="showRemove"
          id="removeFile"
          class="md-icon-button"
          @click.prevent="$emit('remove', file)"
        >
          <md-tooltip>Remove file</md-tooltip>
          <md-icon>cancel</md-icon>
        </md-button>
      </div>
    </md-list-item>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';

// Component name for debugging
defineOptions({
  name: 'FilePreview',
});

// Props
interface FileObject {
  file?: {
    name: string;
  };
  name?: string;
}

interface Props {
  file: FileObject;
  tag?: string;
  classname?: string;
  showRemove?: boolean;
  customActions?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  tag: 'li',
  classname: '',
  showRemove: true,
  customActions: false,
});

// Emits
const emit = defineEmits<{
  remove: [file: FileObject];
}>();

// Computed properties
const fileName = computed(() => {
  return props.file?.file?.name ?? props.file?.name;
});
</script>





