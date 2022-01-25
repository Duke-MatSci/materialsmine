<template>
  <div>
    <md-dialog-confirm
      :md-active.sync="active"
      :md-title="dialogTitle"
      :md-content="textContent"
      :md-confirm-text="confirmTextBtn"
      :md-cancel-text="cancelTextBtn"
      @md-cancel="onCancel"
      @md-confirm="onConfirm" />
  </div>
</template>

<script>
export default {
  name: 'Dialog',
  props: {
    active: {
      type: Boolean,
      default: false
    },
    cancelTextBtn: {
      type: String,
      default: 'Disagree'
    },
    confirmTextBtn: {
      type: String,
      default: 'Agree'
    },
    textContent: {
      type: String,
      default: 'Welcome to <strong>Materialsmine</strong>.<br /> Here is a reusable dialog box in test mode'
    },
    dialogTitle: {
      type: String,
      default: 'Dialog Box'
    }
  },
  methods: {
    onConfirm () {
      this.value = 'Agreed'
    },
    onCancel () {
      this.value = 'Disagreed'
    }
  }
}
</script>
