<template>
<div class="md-steppers form__stepper md-alternative md-horizontal md-theme-default">
    <div class="md-steppers-navigation u--shadow-none">
      <button @click.prevent="goToBeginning"
        v-if="rowNumber > 1" :disabled="rowNumber < 1"
        class="md-button md-stepper-header md-theme-default"
        :class="isActiveClass(1)">
        <div class="md-ripple md-button-content">
          <div class="md-stepper-number">1</div>
          <div class="md-stepper-text">
            <span class="md-stepper-label"> {{ tsteps[0].label }} </span>
          </div>
        </div>
      </button>
      <button
        @click.prevent="prevRow" v-if="rowNumber > 1"
        style="max-width:0rem"
        class="md-button md-stepper-header md-theme-default">
        <div class="md-ripple md-button-content">
          <div class="md-stepper-number utility-transparentbg">
            <md-icon>more_horiz</md-icon>
          </div>
          <div class="md-stepper-text">
            <span class="md-stepper-label"> </span>
          </div>
        </div>
        <md-icon class="u--default-size">more_horiz</md-icon>
      </button>
      <button
        @click.prevent="goToItem(n + offset)" v-for="(n, i) in lengths" :key="i"
        class="md-button md-stepper-header md-theme-default"
        :class="isActiveClass(n + offset)">
        <div class="md-ripple md-button-content">
          <div class="md-stepper-number"> {{ n + offset }} </div>
          <div class="md-stepper-text">
            <span class="md-stepper-label"> {{ tsteps[n + offset - 1].label }} </span>
          </div>
        </div>
      </button>
      <button @click.prevent="nextRow"
        class="md-button md-stepper-header md-theme-default"
        style="max-width: 0rem"
        v-if="rowNumber < factor">
        <div class="md-ripple md-button-content">
          <div class="md-stepper-number utility-transparentbg">
            <md-icon>more_horiz</md-icon>
          </div>
          <div class="md-stepper-text">
            <span class="md-stepper-label"> </span>
          </div>
        </div>
        <md-icon class="u--default-size">more_horiz</md-icon>
      </button>
      <button @click.prevent="goToEnd" v-if="rowNumber < factor"
        class="md-button md-stepper-header md-theme-default"
        :class="isActiveClass(tsteps.length)">
        <div class="md-ripple md-button-content">
          <div class="md-stepper-number"> {{tsteps.length}} </div>
          <div class="md-stepper-text">
            <span class="md-stepper-label"> {{ tsteps[tsteps.length - 1].label }} </span>
          </div>
        </div>
      </button>

    </div>
</div>
</template>

<script>
import reduceObjList from '@/mixins/reduceObjectList'
export default {
  name: 'StepperHeader',
  mixins: [reduceObjList],
  props: {
    cstep: Number,
    tsteps: []
  },
  data () {
    return {
      itemInput: this.cstep,
      emitMessage: 'go-to-step',
      minLength: 2,
      maxLength: 3
    }
  },
  mounted () {
    if (this.itemExists(this.cstep)) {
      this.verifyRow()
    } else {
      this.goToEnd()
    }
  },
  computed: {
    citem () { return this.cstep },
    titems () { return this.tsteps.length }
  },
  methods: {
    // TODO: Change this to handle errors and complete
    isActiveClass (e) {
      return e === this.itemInput ? 'md-active' : ''
    }
  }

}
</script>
