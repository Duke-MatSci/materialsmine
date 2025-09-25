<template>
  <div>
    <div :id="containerId" ref="containerEl"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue';
import { CreateVoyager } from 'datavoyager';

const voyagerConf = {
  showDataSourceSelector: false,
  hideHeader: true,
  hideFooter: true,
} as const;

interface Props {
  data?: Record<string, any> | null;
  spec?: Record<string, any> | null;
}

const props = withDefaults(defineProps<Props>(), {
  data: null,
  spec: null,
});

const emit = defineEmits<{ (e: 'update:spec', value: any): void }>();

const containerId = 'voyager-embed';
const containerEl = ref<HTMLElement | null>(null);
const voyagerInstance = ref<any>(null);

const updateSpec = () => {
  if (voyagerInstance.value?.getSpec) {
    emit('update:spec', voyagerInstance.value.getSpec());
  }
};

const createVoyager = () => {
  const container = containerEl.value as HTMLElement | null;
  if (!container) return;

  // Create a fresh instance (parity with legacy behavior)
  voyagerInstance.value = CreateVoyager(container, voyagerConf, undefined);
  if (voyagerInstance.value?.onStateChange) {
    voyagerInstance.value.onStateChange(() => updateSpec());
  }
  if (props.data && voyagerInstance.value?.updateData) {
    voyagerInstance.value.updateData(props.data);
  }
};

// Ensure container is in DOM before instantiating
onMounted(async () => {
  await nextTick();
  createVoyager();
});

// Recreate when data changes (matches legacy watch behavior)
watch(
  () => props.data,
  async () => {
    await nextTick();
    createVoyager();
  }
);

// Expose name for devtools clarity
defineOptions({ name: 'DataVoyager' });
</script>

<style scoped src="datavoyager/build/style.css"></style>
