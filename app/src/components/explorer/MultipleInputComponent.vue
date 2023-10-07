<template>
<div v-if="inputObj.type === 'multiples'">
  <div>
    <p class="md-subheading" >{{ name }}</p>
    <p v-if="!listItems.length" class="md-caption u--color-error">Click the button in the box to create more of this section</p>
    <div v-else class="md-size-50 md-layout-item md-xsmall-size-95 u_height--auto">
      <md-field>
        <label for="movies">{{uniqueKey[uniqueKey.length - 1]}}</label>
        <md-select v-model="selectedItems" name="ChooseParameter" id="ChooseParameter" multiple>
          <md-option v-for="list in listItems" :key="list" :value="list">{{ list }}</md-option>
        </md-select>
      </md-field>
    </div>
  </div>

  <template v-for="(value, key) in tempInputObj" >

    <div v-if="selectedItems.includes(key)" :key="key" :class="[fullWidthClass,'u_margin-bottom-small']">
      <div :class="[fullWidthClass, 'md-layout md-gutter utility-gridborder']" >
        <div :class="[fullWidthClass, 'viz-u-mgbottom-sm']">
          <p class="md-subheading" >{{ key }}</p>
        </div>
        <div v-for="(item, id) in value" :key="`${key}_${id}`"
        :class="[item.detail.type === 'multiples' ? 'md-size-100' : 'md-size-50', 'md-layout-item md-xsmall-size-95 u_height--auto']">
          <template v-if="item.detail.type !== 'multiples' && item.detail.type !== 'varied_multiples'">
            <p class="md-body-2" >{{ item.ref[item.ref.length - 2] === name ? item.ref[item.ref.length - 1] : item.ref[item.ref.length - 2]}}</p>
            <InputComponent @data-file-deleted="(e) => clearSpecificMultiple(e)" :title="title" :name="item.name" :uniqueKey="item.ref" :inputObj="item.detail" />
          </template>
          <template v-if="item.detail.type === 'multiples' && item.name !== 'ChooseParameter'">
            <MultipleInputComponent @update-step-error="$emit('update-step-error')" :title="title" :name="item.name" :uniqueKey="item.ref" :inputObj="item.detail" />
          </template>
          <template v-if="item.detail.type === 'multiples' && item.name === 'ChooseParameter'">
            <MultipleInputComponent @update-step-error="$emit('update-step-error')" :title="title" :name="item.ref[item.ref.length - 2]" :uniqueKey="item.ref" :inputObj="item.detail"></MultipleInputComponent>
          </template>
        </div>
      </div>

    </div>
  </template>

  <template v-if="!!inputArr.length">
    <div :class="showGridLine" v-for="num in noOfValueObj" :key="`mul_${num}`">

      <div v-for="(item, id) in inputArr.slice((num - 1) * noOfInputSheet, num * noOfInputSheet)" :key="`${num}_${id}`"
      :class="[item.detail.type === 'multiples' ? 'md-size-100' : 'md-size-50', 'md-layout-item md-xsmall-size-95 u_height--auto']">
        <!-- Field name  -->
        <div class="md-layout md-alignment-center-left">
        </div>
        <template v-if="item.detail.type !== 'multiples' && item.detail.type !== 'varied_multiples'">
          <p class="md-body-2" >{{ item.ref[item.ref.length - 2] === name ? item.ref[item.ref.length - 1] : item.ref[item.ref.length - 2]}}</p>
          <InputComponent @data-file-deleted="(e) => clearSpecificMultiple(e)" :title="title" :name="item.name" :uniqueKey="item.ref" :inputObj="item.detail" />
        </template>
        <template v-if="item.detail.type === 'multiples'">
          <MultipleInputComponent @update-step-error="$emit('update-step-error')" :title="title"
          :name="item.name !== 'ChooseParameter' ? item.name : item.ref[item.ref.length - 2]" :uniqueKey="item.ref" :inputObj="item.detail" />
        </template>
      </div>

    </div>
  </template>

  <template v-if="!listItems.length">
    <div class="md-layout md-alignment-center-right md-layout-item md-size-100 u_height--auto">
      <md-dialog-actions class="u--padding-zero" >
        <button class="md-button btn btn--tertiary btn--noradius" @click.prevent="addExtra">
          Click to add {{ name }}
        </button>
      </md-dialog-actions>
    </div>
    <div class=" u--margin-centered viz-u-mgbottom-big md-layout-item md-size-100 u_height--auto">
      <hr class="md-divider u--bg">
    </div>
  </template>
</div>
<div :class="showGridLine" v-else>
  <div class="md-size-50 md-layout-item md-xsmall-size-95 u_height--auto">
      <p class="md-body-2" >{{uniqueKey[uniqueKey.length - 2] || uniqueKey[uniqueKey.length - 1 ]}}</p>
      <InputComponent @update-step-error="$emit('update-step-error')" :title="title" :name="name" :uniqueKey="uniqueKey" :inputObj="inputObj" />
  </div>
</div>
</template>

<script>
import InputComponent from './InputComponent.vue'

export default {
  name: 'MultipleInputComponent',
  props: {
    inputObj: {
      type: Object,
      required: true
    },
    uniqueKey: {
      required: true
    },
    name: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: false
    }
  },
  components: {
    InputComponent
  },
  data () {
    return {
      inputArr: [],
      tempInputObj: {},
      selectedItems: [],
      listItems: [],
      loading: false,
      noOfMultiplesAdded: 0
    }
  },
  computed: {
    showGridLine () {
      if (this.listItems.length) return 'md-layout md-gutter'
      return 'md-layout md-gutter utility-gridborder u--margin-header'
    },
    fullWidthClass () {
      return 'md-layout-item md-size-100 u_height--auto'
    },
    noOfValueObj () {
      return this.inputObj.values.length
    },
    noOfInputSheet () {
      return this.inputArr.length / this.noOfValueObj
    }
  },
  mounted () {
    if (this.inputObj?.type === 'multiples') { return this.sortMultiple(this.inputObj?.values, this.uniqueKey) }
  },
  methods: {
    async addExtra () {
      if (!this.validateFields()) {
        return this.$store.commit('setSnackbar', {
          message: 'Fields are Empty',
          duration: 3000
        })
      }
      const data = JSON.stringify(this.inputObj?.values)
      const arr = JSON.parse(data)
      this.clearFields(this.inputObj)
      this.inputObj.values = [...arr, ...this.inputObj.values]
      this.sortMultiple(this.inputObj?.values, this.uniqueKey)
    },
    validateFields () {
      const array = this.inputArr || []
      let noFieldValue = 0
      for (let index = 0; index < array.length; index++) {
        const obj = array[index].detail
        if (Object.hasOwnProperty.call(obj, 'type')) {
          if (obj.type === 'String' || obj.type === 'List' || obj.type === 'File') {
            if (!!array[index].detail.cellValue && !!array[index].detail.cellValue.length) noFieldValue++
          } else if (obj.type === 'replace_nested') {
            if (array[index].detail.values.length) noFieldValue++
          }
        }
      }
      return !!noFieldValue
    },
    fetchParameterValues (arr = []) {
      this.listItems = []
      const data = arr.reduce((acc, val) => acc.concat(Object.keys(val)), [])
      this.listItems = [...new Set(data)]
      const objArr = {}
      for (let i = 0; i < data.length; i++) {
        objArr[data[i]] = !objArr[data[i]] ? [] : [...objArr[data[i]]]
        this.tempInputObj = Object.assign({}, this.tempInputObj, objArr)
        this.filterData(this.inputObj.values[i], this.uniqueKey, data[i])
      }
      if (Object.keys(this.$route.query).length) this.selectedItems = [...this.listItems]
    },
    sortMultiple (arr, parent = []) {
      this.inputArr = []
      if (arr.length === 1) {
        return this.filterData(arr[0], parent)
      }
      const tempArr = []
      for (let i = 0; i < arr.length; i++) {
        tempArr.push(JSON.stringify(arr[i]))
      }
      const uniqueArr = [...new Set(tempArr)]
      if (uniqueArr.length === 1 || this.uniqueKey[this.uniqueKey.length - 1] !== 'ChooseParameter') {
        for (let index = 0; index < uniqueArr.length; index++) {
          uniqueArr[index] = JSON.parse(uniqueArr[index])
          this.filterData(uniqueArr[index], parent)
        }
        this.inputObj.values = [...uniqueArr]
        return
      }

      return this.fetchParameterValues(this.inputObj.values)
    },
    filterData (obj, parent = [], title = null) {
      for (const prop in obj) {
        const ref = parent
        if (!obj[prop]?.type && typeof (obj[prop] === 'object')) {
          this.filterData(obj[prop], [...parent, prop], title)
        } else {
          if (!title) {
            this.inputArr.push({ detail: obj[prop], name: prop, ref: [...ref, prop] })
          } else {
            this.tempInputObj[title].push({ detail: obj[prop], name: prop, ref: [...ref, prop] })
          }
        }
      }
    },
    clearFields (obj) {
      if (Object.hasOwnProperty.call(obj, 'type')) {
        if (obj.type === 'multiples' || obj.type === 'varied_multiples') {
          const arr = obj.values
          for (let i = 0; i < arr.length; i++) {
            if (typeof arr[i] === 'string') {
              arr.splice(i, 1)
              i--
            } else {
              this.clearFields(arr[i])
            }
          }
        } else if (obj.type === 'replace_nested') {
          obj.values = []
        } else {
          obj.cellValue = null
        }
      } else {
        for (const key in obj) {
          this.clearFields(obj[key])
        }
      }
    },
    clearSpecificMultiple (str) {
      const matchIndex = this.inputObj.values.findIndex((currVal) => {
        return JSON.stringify(currVal).includes(str)
      })
      this.clearFields(this.inputObj.values[matchIndex])
      this.sortMultiple(this.inputObj?.values, this.uniqueKey)
    }
  }
}
</script>