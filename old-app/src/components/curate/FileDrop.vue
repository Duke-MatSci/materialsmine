<template>
	<div :data-active="active" @dragenter.prevent="setActive" @dragover.prevent="setActive" @dragleave.prevent="setInactive" @drop.prevent="onDrop">
		<slot :dropZoneActive="active"></slot>
	</div>
</template>

<script>
const events = ['dragenter', 'dragover', 'dragleave', 'drop']
export default {
  name: 'FileDrop',
  emits: ['files-dropped'],
  data () {
    return {
      active: false,
      inActiveTimeout: null
    }
  },
  methods: {
    setActive () {
      this.active = true
      clearTimeout(this.inActiveTimeout)
    },
    // Timeout avoids style flickering
    setInactive () {
      this.inActiveTimeout = setTimeout(() => {
        this.active = false
      }, 50)
    },
    onDrop (e) {
      this.setInactive()
      this.$emit('files-dropped', [...e.dataTransfer.files])
    },
    preventDefaults (e) {
      e.preventDefault()
    }
  },
  mounted () {
    events.forEach((eventName) => {
      document.body.addEventListener(eventName, this.preventDefaults)
    })
  },
  unmounted () {
    events.forEach((eventName) => {
      document.body.removeEventListener(eventName, this.preventDefaults)
    })
  }
}
</script>
