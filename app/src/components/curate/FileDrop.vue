<template>
  <div
    :data-active="active"
    @dragenter.prevent="setActive"
    @dragover.prevent="setActive"
    @dragleave.prevent="setInactive"
    @drop.prevent="onDrop"
  >
    <slot :dropZoneActive="active"></slot>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

// Component name for debugging
defineOptions({
  name: 'FileDrop',
});

// Emits
const emit = defineEmits<{
  'files-dropped': [files: File[]];
}>();

// Reactive data
const active = ref(false);
const inActiveTimeout = ref<ReturnType<typeof setTimeout> | null>(null);

// Constants
const events = ['dragenter', 'dragover', 'dragleave', 'drop'];

// Methods
const setActive = () => {
  active.value = true;
  if (inActiveTimeout.value) {
    clearTimeout(inActiveTimeout.value);
  }
};

// Timeout avoids style flickering
const setInactive = () => {
  inActiveTimeout.value = setTimeout(() => {
    active.value = false;
  }, 50);
};

const onDrop = (e: DragEvent) => {
  setInactive();
  if (e.dataTransfer?.files) {
    emit('files-dropped', [...e.dataTransfer.files]);
  }
};

const preventDefaults = (e: Event) => {
  e.preventDefault();
};

// Lifecycle hooks
onMounted(() => {
  events.forEach((eventName) => {
    document.body.addEventListener(eventName, preventDefaults);
  });
});

onUnmounted(() => {
  events.forEach((eventName) => {
    document.body.removeEventListener(eventName, preventDefaults);
  });
});
</script>
