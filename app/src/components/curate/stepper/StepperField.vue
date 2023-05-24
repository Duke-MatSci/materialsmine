<template>
<div>
  <md-field>
    <label>{{label}}</label>
    <md-input v-if="type=='Number'" v-model="value" type="number"></md-input>
    <md-input v-else-if="type=='Date'" v-model="value" type="date" style="color:white"></md-input>
    <md-input v-else v-model="value"></md-input>
  </md-field>
</div>
</template>

<script>
import { mapMutations } from 'vuex'

export default {
  name: 'StepperField',
  props: {
    label: {
      type: String
    },
    type: {
      type: String
    },
    vmodel: {
      type: Array
    },
    stepnum: {
      type: Number
    },
    index: {
      type: Number
    }
  },
  computed: {
    idLabel () {
      return this.label.trim().split(' ').join('_')
    },
    value: {
      get () {
        return this.$store.getters['explorer/curation/getXlsxCurationField'](this.stepnum, this.vmodel)
      },
      set (value) {
        this.setNestedObject({ stepNumber: this.stepnum, pathArr: this.vmodel, value })
      }

    }
  },
  methods: {
    ...mapMutations('explorer/curation', ['setNestedObject'])
  }
}
</script>
