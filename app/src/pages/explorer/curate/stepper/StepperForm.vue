<template>
<div>
<div class="section_teams">
  <div
      v-if="!loading"
  >
    <div>
      <md-button
        class="md-icon-button"
        @click.native.prevent="navBack"
      >
        <md-tooltip md-direction="bottom">
          Go Back
        </md-tooltip>
        <md-icon>arrow_back</md-icon>
      </md-button>
      <router-link to="/explorer/curate" v-slot="{navigate, href}" custom>
        <a :href="href" @click="navigate">
          <md-tooltip md-direction="bottom">
          Curate Home
          </md-tooltip>
          Curate
        </a>
      </router-link>
      <span class="md-icon-button"> > </span>
      <span class="md-icon-button"> Stepper form </span>
    </div>
  </div>
  <div class="curate">
    <div>
      <LoginReq v-if="!auth"/>
      <div v-else>
        <h2 class="visualize_header-h1">Curate polymer nanocomposite data</h2>
        <StepperHeader :cstep="stepNumber" :tsteps="steps" @go-to-step="loadNextStep($event)" />
        <div v-for="(step, index) in steps" :key='`step_${index}`' style="padding-top:1rem">
          <Step @addEntry="addEntryListener"
            v-show="stepNumber==index+1"
            :indices="[index]"
            :entries="steps[index].entries ?? []"
            :stepnum="index+1"/>
        </div>
      </div>
    </div>
  </div>
</div>
</div>
</template>

<script>
import LoginRequired from '@/components/LoginRequired.vue'
import StepperHeader from '@/components/curate/stepper/StepperHeader.vue'
import Step from '@/components/curate/stepper/step'
import { mapActions } from 'vuex'
import curateFormMixin from '@/mixins/curateForm'

export default {
  name: 'StepperForm',
  components: {
    LoginReq: LoginRequired,
    StepperHeader,
    Step
  },
  data () {
    return {
      auth: true,
      loading: false,
      stepNumber: 1,
      active: 'first',
      steps: [
        { label: 'Data Origin', entries: [] },
        { label: 'Material Types', entries: [] },
        { label: 'Synthesis and Processing', entries: [] },
        { label: 'Characterization Methods', entries: [] },
        { label: 'Properties: Mechanical', entries: [] },
        { label: 'Properties: Viscoelastic', entries: [] },
        { label: 'Properties: Electrical', entries: [] },
        { label: 'Properties: Rheological', entries: [] },
        { label: 'Microstructure', entries: [] },
        { label: 'Confirm and Submit', entries: [] }
      ]
    }
  },
  mixins: [curateFormMixin],
  methods: {
    ...mapActions('explorer/curation', ['createXlsxFormStep', 'fetchXlsxJsonStep', 'addXlsxMultiple']),
    navBack () {
      this.$router.back()
    },
    loadNextStep (event) {
      this.stepNumber = event
    },
    addEntryListener (e) {
      this.addXlsxMultiple({ stepNumber: this.stepNumber, stepDict: e.vmodelArr })
      this.addEntryUI(e.indexArr)
    }
  },
  created () {
    const len = this.steps.length
    for (let i = 0; i < len - 1; i++) { // Last step is confirmation
      const stepName = this.steps[i].label.toLowerCase().replace(/[^\w\s]/gi, '')
      this.fetchXlsxJsonStep({ stepNumber: i + 1, stepName })
        .then((response) => {
          this.steps[i].entries = this.parseEntries(Object.entries(response))
        })
    }
  }
}
</script>
