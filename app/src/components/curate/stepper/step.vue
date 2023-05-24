<template>
  <div>
    <div v-for="(entry, index) in entries" :key="index">
      <div v-if="entry?.type=='multiple'" class="u_margin-bottom-small u_margin-top-small">
        <expandable
            :startOpen="false"
            :title="entry.label"
        >
            <button @click="emitAddEntry({indexArr: [...indices, index], vmodelArr: entry.vmodel})" class="btn btn--primary" style="margin-left:3rem">Add Another {{entry.label}}</button>
            <Step @addEntry="emitAddEntry"
              :indices="[...indices, index]"
              :entries="entry.entries ?? []"
              :stepnum="stepnum"
              style="margin-left:3rem"></Step>
        </expandable>
      </div>
      <div v-else-if="entry?.type?.includes('header')" class="u_margin-bottom-small u_margin-top-small">
        <expandable
            :startOpen="entry?.type?.includes('0') ? false : false"
            :title="entry.label"
        >
          <Step @addEntry="emitAddEntry" v-if='entry.entries'
          :indices="[...indices, index]"
          :entries="entry.entries ?? []"
          :stepnum="stepnum"
          style="margin-left:3rem"
          ></Step>
        </expandable>
      </div>
      <StepperDropdown v-else-if="entry.type=='List'"
        :label="entry.label"
        :validList="entry.validList"
        :vmodel="entry.vmodel"
        :stepnum="stepnum"
        :index="index"/>
      <StepperField v-else
        :label="entry.label"
        :stepnum="stepnum"
        :vmodel="entry.vmodel" :type="entry.type" :index="index"/>
    </div>
  </div>
</template>

<script>
import StepperField from './StepperField.vue'
import StepperDropdown from './StepperDropdown.vue'
import expandable from '@/components/expandable.vue'

export default {
  name: 'Step',
  props: {
    entries: [],
    indices: [],
    stepnum: {
      type: Number
    }
  },
  components: {
    StepperField,
    StepperDropdown,
    expandable
  },
  methods: {
    emitAddEntry (e) {
      this.$emit('addEntry', e)
    }
  }
}
</script>
