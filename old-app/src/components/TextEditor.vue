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

<script>
export default {
  name: 'TextEditor',
  props: {
    value: {
      type: String
    },
    contentEditable: {
      type: Boolean,
      default: () => true
    }
  },
  data () {
    return {
      innerValue: this.value
    }
  },
  methods: {
    onInput (event) {
      this.$store.commit('contact/setMessage', event.target.innerHTML)
    },
    applyBold () {
      document.execCommand('bold')
    },
    applyItalic () {
      document.execCommand('italic')
    },
    applyHeading () {
      if (document.queryCommandValue('formatBlock') === 'h1') { return document.execCommand('formatBlock', false, 'div') }
      document.execCommand('formatBlock', false, '<h1>')
    },
    applyUl () {
      document.execCommand('insertUnorderedList')
    },
    applyOl () {
      document.execCommand('insertOrderedList')
    },
    undo () {
      document.execCommand('undo')
    },
    redo () {
      document.execCommand('redo')
    }
  }
}
</script>
