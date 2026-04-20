<template>
  <div class="section_contact_text-editor">
    <div class="md-layout md-alignment-center-right">
        <button @click="applyHeading" class="md-button md-dense md-icon-button"><b style="font-size:15px">H</b></button>
        <button @click="applyBold" class="md-button md-dense md-icon-button"><md-icon class="utility-navfonticon">format_bold</md-icon></button>
        <button @click="applyItalic" class="md-button md-dense md-icon-button"><md-icon class="utility-navfonticon">format_italic</md-icon></button>

        <button @click="applyUl" class="md-button md-dense md-icon-button"><md-icon class="utility-navfonticon">format_list_bulleted</md-icon></button>
        <button @click="applyOl" class="md-button md-dense md-icon-button"><md-icon class="utility-navfonticon">format_list_numbered</md-icon></button>

      <button @click="undo" class="md-button md-dense md-icon-button"><md-icon class="utility-navfonticon">undo</md-icon></button>
      <button @click="redo" class="md-button md-dense md-icon-button"><md-icon class="utility-navfonticon">redo</md-icon></button>
    </div>
    <div @input="onInput" v-html="innerValue" :contenteditable=contentEditable class="editor" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useStore } from 'vuex';

defineOptions({
  name: 'TextEditor',
});

interface Props {
  value?: string;
  contentEditable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  value: '',
  contentEditable: true,
});

const store = useStore();

// Data
const innerValue = ref<string>(props.value || '');

// Methods
const onInput = (event: Event): void => {
  const target = event.target as HTMLElement;
  store.commit('contact/setMessage', target.innerHTML);
};

const applyBold = (): void => {
  document.execCommand('bold');
};

const applyItalic = (): void => {
  document.execCommand('italic');
};

const applyHeading = (): void => {
  if (document.queryCommandValue('formatBlock') === 'h1') {
    return document.execCommand('formatBlock', false, 'div');
  }
  document.execCommand('formatBlock', false, '<h1>');
};

const applyUl = (): void => {
  document.execCommand('insertUnorderedList');
};

const applyOl = (): void => {
  document.execCommand('insertOrderedList');
};

const undo = (): void => {
  document.execCommand('undo');
};

const redo = (): void => {
  document.execCommand('redo');
};
</script>
