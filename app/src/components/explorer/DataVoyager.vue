<template>
  <div>
    <div :id="containerId" :ref="containerId"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { CreateVoyager } from 'datavoyager';

interface Props {
  data?: Record<string, any> | null;
  spec?: Record<string, any> | null;
}

const props = withDefaults(defineProps<Props>(), {
  data: null,
  spec: null
});

const emit = defineEmits<{
  (e: 'update:spec', spec: any): void;
}>();

const voyagerConf = {
  showDataSourceSelector: false,
  hideHeader: true,
  hideFooter: true
};

const containerId = ref<string>('voyager-embed');
const voyagerInstance = ref<any>(null);

const updateSpec = (): void => {
  if (voyagerInstance.value) {
    emit('update:spec', voyagerInstance.value.getSpec());
  }
};

const createVoyager = (): void => {
  const container = document.getElementById(containerId.value);
  if (container) {
    voyagerInstance.value = CreateVoyager(container, voyagerConf, undefined);
    voyagerInstance.value.onStateChange(() => updateSpec());
    if (props.data) {
      voyagerInstance.value.updateData(props.data);
    }
  }
};

watch(() => props.data, () => {
  createVoyager();
});

onMounted(() => {
  createVoyager();
});
</script>

<style css src='datavoyager/build/style.css'>
</style>
