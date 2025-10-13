<template>
  <div :id="id"/>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, getCurrentInstance } from 'vue';
import { useStore } from 'vuex';
import Yasqe from '@triply/yasqe';

interface Props {
  id?: string;
  value?: string;
  endpoint?: string;
  showBtns?: boolean;
  readOnly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  id: 'YASQE',
  value: '',
  endpoint: '/api/knowledge/sparql',
  showBtns: true,
  readOnly: false
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'input', value: string): void;
  (e: 'query-error', args: any): void;
  (e: 'query-success', response: any): void;
}>();

const store = useStore();
const instance = getCurrentInstance();
const yasqe = ref<any>(null);

onMounted(() => {
  const token = store.getters['auth/token'];
  const el = instance?.proxy?.$el;

  yasqe.value = new Yasqe(el, {
    readOnly: props.readOnly,
    showQueryButton: props.showBtns,
    requestConfig: {
      endpoint: props.endpoint,
      method: 'POST',
      headers: () => ({
        authorization: 'Bearer ' + token
      })
    }
  });

  yasqe.value.setValue(props.value);
  setTimeout(() => yasqe.value.refresh(), 1);

  yasqe.value.on('error', function (...args: any[]) {
    console.error('YASQE query error', args);
    emit('query-error', args);
  });

  yasqe.value.on('queryResults', function (yasqeInstance: any, response: any, duration: number) {
    emit('input', yasqe.value.getValue());
    emit('query-success', response);
  });
});

watch(() => props.value, (newValue) => {
  if (yasqe.value && newValue !== yasqe.value.getValue()) {
    yasqe.value.setValue(newValue);
  }
});
</script>

<style css src='@triply/yasqe/build/yasqe.min.css'>
</style>
