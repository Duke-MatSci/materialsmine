<template>
  <div ref="editorRef" class="json-editor"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import JSONEditor from 'jsoneditor';
import 'jsoneditor/dist/jsoneditor.css';

interface Props {
  modelValue?: any;
  options?: Record<string, any>;
}

interface Emits {
  (e: 'update:modelValue', value: any): void;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({}),
  options: () => ({})
});

const emit = defineEmits<Emits>();

const editorRef = ref<HTMLElement | null>(null);
let editor: JSONEditor | null = null;

onMounted(() => {
  if (editorRef.value) {
    const options = {
      ...props.options,
      onChange: () => {
        try {
          const json = editor?.get();
          emit('update:modelValue', json);
        } catch (err) {
          // Invalid JSON, don't emit
        }
      }
    };

    editor = new JSONEditor(editorRef.value, options);

    if (props.modelValue) {
      editor.set(props.modelValue);
    }
  }
});

watch(() => props.modelValue, (newValue) => {
  if (editor && newValue) {
    try {
      const currentValue = editor.get();
      if (JSON.stringify(currentValue) !== JSON.stringify(newValue)) {
        editor.set(newValue);
      }
    } catch (err) {
      editor.set(newValue);
    }
  }
}, { deep: true });

watch(() => props.options, (newOptions) => {
  if (editor && newOptions) {
    editor.setOptions(newOptions);
  }
}, { deep: true });

onBeforeUnmount(() => {
  if (editor) {
    editor.destroy();
    editor = null;
  }
});
</script>

<style scoped>
.json-editor {
  width: 100%;
  height: 100%;
  min-height: 400px;
}
</style>
