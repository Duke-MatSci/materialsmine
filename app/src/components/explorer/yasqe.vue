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
      default: () => '/api/knowledge/sparql'
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
    const token = this.$store.getters['auth/token']
    const yasqeContext = this
    this.yasqe = new Yasqe(this.$el, {
      readOnly: this.readOnly,
      showQueryButton: this.showBtns,
      requestConfig: {
        endpoint: this.endpoint,
        method: 'POST',
        headers: () => ({
          authorization: 'Bearer ' + token
        })
      }
      // sparql: {
      //   showQueryButton: !this.showBtns,
      //   endpoint: this.endpoint,
      //   method: 'POST',
      //   args: [{ name: 'infer', value: false }], // do not infer triples
      //   callbacks: { // NOTE: these callbacks aren't triggered with current version (Mar. 2023)
      //     error () {
      //       console.error('YASQE query error', arguments)
      //       yasqeContext.$emit('query-error', arguments)
      //     },
      //     success (resp) {
      //       console.log('success in sparql!')
      //       yasqeContext.$emit('query-success', resp)
      //     }
      //   }
      // }
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
    this.yasqe.on('changes', () => {
      yasqeContext.$emit('input', yasqeContext.yasqe.getValue())
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
