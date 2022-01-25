<template>
  <div :id="id"/>
</template>

<script>
import Yasqe from '@triply/yasqe'

export default {
  name: 'yasqe',
  props: {
    id: {
      type: String,
      default: () => 'YASQE'
    },
    value: {
      type: String,
      default: () => ''
    },
    endpoint: {
      type: String,
      default: () => '/sparql'
    },
    showBtns: {
      type: Boolean,
      default: true
    },
    readOnly: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      editorValue: this.value
    }
  },
  mounted () {
    const yasqeContext = this
    this.yasqe = new Yasqe(this.$el, {
      sparql: {
        showQueryButton: !this.showBtns,
        endpoint: this.endpoint,
        method: 'POST',
        args: [{ name: 'infer', value: false }], // do not infer triples
        callbacks: {
          error () {
            console.error('YASQE query error', arguments)
            yasqeContext.$emit('query-error', arguments)
          },
          success (resp) {
            yasqeContext.$emit('query-success', resp)
          }
        }
      }
    })
    this.yasqe.setValue(this.value)
    setTimeout(() => this.yasqe.refresh(), 1)
    this.yasqe.on('error', function () {
      console.error('YASQE query error', arguments)
      yasqeContext.$emit('query-error', arguments)
    })
    this.yasqe.on('queryResults', function (yasqe, response, duration) {
      yasqeContext.$emit('query-success', response)
    })
  },
  watch: {
    value (value) {
      if (value !== this.editorValue) {
        this.yasqe.setValue(value)
      }
    }
  }
}
</script>

<style css src='@triply/yasqe/build/yasqe.min.css'>
</style>
