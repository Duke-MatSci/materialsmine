<template>
<div>
    <div class="form__field md-field md-theme-default" :class="value ? 'md-has-value':''" >
      <label :for='`${idLabel}`'>{{label}}</label>
      <select class="form__select md-menu md-select"
        v-model="value"
        style="border-width: 0; font-size: 16px;"
        :name="`${idLabel}`" :id="`${idLabel}`">
        <option v-for="(option, index) in validListValues" :key="`${idLabel}_option_${index}`" style="min-width:100%">
            {{option}}
        </option>
      </select>
    </div>
</div>
</template>

<script>
import { SEARCH_SPREADSHEETLIST_QUERY } from '@/modules/gql/material-gql.js'
import { mapMutations } from 'vuex'

export default {
  name: 'StepperDropdown',
  data () {
    return {
      hasValue: false
    }
  },
  props: {
    label: {
      type: String
    },
    validList: {
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
    validListValues () {
      const searchValue = this.validList
      let spreadsheetList = this.getXlsxCurationList?.columns || []
      if (spreadsheetList.length > 1) {
        spreadsheetList = spreadsheetList.filter(function (entry) { return entry.field === searchValue })
      }
      return spreadsheetList[0]?.values
    },
    // hasValueClass() {
    //   let checkValueExists = this.$store.getters['explorer/curation/getXlsxCurationField'](this.stepnum, this.vmodel)
    //   console.log('hasValueClass', checkValueExists)
    //   if (checkValueExists == '') return false
    //   else return true
    // },
    value: {
      get () {
        return this.$store.getters['explorer/curation/getXlsxCurationField'](this.stepnum, this.vmodel)
      },
      set: function (value) {
        this.testMethod(value)
        // this.setNestedObject({ stepNumber: this.stepnum, pathArr: this.vmodel, value })
      }
    }
  },
  methods: {
    ...mapMutations('explorer/curation', ['setNestedObject']),
    testMethod (value) {
      this.hasValue = true
      this.setNestedObject({ stepNumber: this.stepnum, pathArr: this.vmodel, value })
    //   console.log('testing', value)
    }
  },
  watch: {
    value (newValue, oldValue) {
    //   console.log(this.value)
    //   this.hasValue = true
    }
  },
  apollo: {
    getXlsxCurationList: {
      query: SEARCH_SPREADSHEETLIST_QUERY,
      variables () {
        return {
          input: {
            field: this.validList,
            pageNumber: 1
          }
        }
      },
      fetchPolicy: 'cache-and-network',
      error (error) {
        this.$store.commit('setSnackbar', {
          message: error
        })
      }
    }
  }
}
</script>
