<template>
  <div class="viz-u-postion__rel">
    <div class="section_loader u--margin-toplg" v-if="loading && !error">
      <spinner :loading="loading" :text="loadingText" />
    </div>

    <div
      v-else-if="error && !loading"
      class="utility-roverflow u_centralize_text u_margin-top-med"
    >
      <h1 class="visualize_header-h1 u--margin-topxl">Unable to load form</h1>
      <md-button
        class="md-fab md-fab-top-right md-dense btn--primary"
        @click.native.prevent="navBack"
      >
        <md-tooltip> Go Back </md-tooltip>
        <md-icon>arrow_back</md-icon>
      </md-button>
    </div>

    <div
      v-else
      class="curate u_margin-top-med u--padding-zero-mobile"
      @click="disableRender"
    >
      <form ref="curationForm" @submit.prevent="submit" class="modal-content">
        <md-steppers
          v-if="!!titles.length"
          :md-active-step.sync="active"
          @md-changed="(e) => sortCurate(e)"
          class="form__stepper form__stepper-curate"
        >
          <md-step
            v-for="(title, id) in titles"
            :md-error="hasProperty(errors, title) ? 'Missing field' : null"
            :id="`stepper_${id}`"
            :key="`stepper_${id}`"
            :md-label="title"
          >
            <template v-if="active === `stepper_${id}`">
              <!-- NavBar and Dropdown  -->
              <div
                v-if="active !== 'stepper_null'"
                class="md-layout md-gutter md-alignment-center-space-between"
                style="position: relative"
              >
                <div>
                  <CurateNavBar
                    :active="isEditMode ? 'Edit Curation' : 'Curation Form'"
                    :navRoutes="navRoutes"
                  />
                </div>

                <div
                  class="u--layout-flex section_md-header md-layout-item md-size-40 md-small-size-75 md-xsmall-size-75 u_height--auto u--margin-left-auto"
                >
                  <md-field>
                    <md-select
                      v-model="active"
                      name="sheet"
                      :id="`sNR_${id}`"
                      md-dense
                    >
                      <md-option
                        v-for="(title, title_id) in titles"
                        :key="`sRO_${title_id}`"
                        :value="`stepper_${title_id}`"
                        >{{ title }}</md-option
                      >
                    </md-select>
                  </md-field>

                  <md-field md-dense class="u--margin-leftsm u--margin-none">
                    <md-input
                      v-model="searchKeyword"
                      name="searchKeyword"
                      id="searchKeyword"
                      placeholder="Search Fields"
                    ></md-input>
                    <md-icon>search</md-icon>
                  </md-field>
                </div>
                <template v-if="!!searchResult.length && showDropdown">
                  <ul
                    class="search-dropdown-menu u_searchimage_form-group"
                    :style="setDropdownPosition"
                  >
                    <li
                      v-for="(item, index) in searchResult"
                      :key="index"
                      @click.prevent="showInputLocation(item)"
                      class=""
                    >
                      <a href="#" @click.prevent="showInputLocation(item)">
                        <template v-for="(level, l_id) in item">
                          <span v-if="item.length - 1 !== l_id" :key="l_id">
                            {{ level }} >>
                          </span>
                          <span v-else :key="level">
                            <strong>{{ level }}</strong></span
                          >
                        </template>
                      </a>
                    </li>
                  </ul>
                </template>
              </div>

              <!-- Vertical Steppers  -->
              <md-steppers
                v-if="!!tempInputObj[title].length"
                :md-active-step.sync="verticalActive"
                md-vertical
                md-dynamic-height
              >
                <md-step
                  v-for="step in Math.ceil(tempInputObj[title].length / 5)"
                  :md-error="
                    vStepError[title].includes(step) ? 'Field Error' : null
                  "
                  :id="`v_${step}`"
                  :key="`v_${step}`"
                  :md-label="`${title}`"
                >
                  <div
                    v-if="!!tempInputObj[title].length"
                    class="md-layout md-gutter md-alignment-center-center"
                  >
                    <template v-if="verticalActive === `v_${step}`">
                      <div
                        v-for="(item, id) in tempInputObj[title].slice(
                          (step - 1) * 5,
                          step * 5
                        )"
                        :key="`form_${id}`"
                        :class="[
                          item.detail.type === 'multiples'
                            ? 'md-size-80 md-medium-size-90'
                            : inputSizesm,
                          'md-layout-item md-xsmall-size-95 u_height--auto',
                        ]"
                      >
                        <!-- Form Input Field Name  -->
                        <div class="md-layout md-alignment-center-left">
                          <p
                            v-if="item.detail.type !== 'multiples'"
                            class="md-body-2"
                          >
                            {{
                              item.ref[item.ref.length - 2] ||
                              item.ref[item.ref.length - 1]
                            }}
                          </p>
                        </div>

                        <!-- For handling general case types i.e list, string, file -->
                        <template
                          v-if="
                            item.detail.type !== 'multiples' &&
                            item.detail.type !== 'varied_multiples'
                          "
                        >
                          <InputComponent
                            @update-step-error="updateStepError(title, step)"
                            :title="title"
                            :name="item.name"
                            :uniqueKey="item.ref"
                            :inputObj="item.detail"
                          />
                        </template>

                        <!-- For handling varied_multiples -->
                        <template
                          v-if="item.detail.type === 'varied_multiples'"
                        >
                          <div class="md-card-actions u--padding-zero">
                            <md-field md-dense :style="reduceSpacing">
                              <md-select
                                md-dense
                                v-model="item.detail.cellValue"
                                :name="`${item.ref}_${item.name}`"
                                :id="`${item.ref}_${item.name}`"
                                :placeholder="`Please Choose Parameter`"
                                @md-opened="
                                  fetchListValues(item.detail.validList)
                                "
                                @md-selected="
                                  sort_variedMultiple_alt(
                                    title,
                                    item.detail.values,
                                    item.ref
                                  )
                                "
                              >
                                <md-option disabled>Select Options</md-option>
                                <md-option
                                  v-if="
                                    !!item.detail.cellValue && !listItems.length
                                  "
                                  :value="item.detail.cellValue"
                                  >{{ item.detail.cellValue }}</md-option
                                >
                                <md-option
                                  v-for="(listItem, listId) in listItems"
                                  :key="listId"
                                  :value="listItem"
                                  >{{ listItem }}</md-option
                                >
                              </md-select>
                            </md-field>
                            <md-button
                              v-if="!!item.detail.cellValue && !isEditMode"
                              @click="
                                addVariedMultiple(
                                  title,
                                  item.detail.values,
                                  item.ref
                                )
                              "
                              class="md-icon-button u_margin-bottom-med"
                            >
                              <md-tooltip md-direction="top"
                                >Click to add {{ item.name }}</md-tooltip
                              >
                              <md-icon>add</md-icon>
                            </md-button>
                          </div>
                        </template>
                        <!-- For handling type multiples -->
                        <template>
                          <MultipleInputComponent
                            @update-step-error="updateStepError(title, step)"
                            :title="title"
                            v-if="item.detail.type === 'multiples'"
                            :name="item.name"
                            :uniqueKey="item.ref"
                            :inputObj="item.detail"
                          />
                        </template>
                      </div>
                    </template>
                  </div>

                  <div class="dialog-box_actions">
                    <md-dialog-actions>
                      <button
                        class="md-button btn btn--noradius"
                        v-if="step > 1"
                        @click.prevent="goToStep(`v_${step--}`, `v_${step++}`)"
                      >
                        Previous
                      </button>
                      <button
                        class="md-button btn btn--tertiary btn--noradius"
                        v-if="step < Math.ceil(tempInputObj[title].length / 5)"
                        @click.prevent="verticalActive = `v_${step + 1}`"
                      >
                        Next
                      </button>
                    </md-dialog-actions>
                  </div>
                </md-step>
              </md-steppers>

              <div class="md-dialog-actions">
                <button
                  v-if="id > 0"
                  class="md-button btn btn--noradius"
                  @click.prevent="active = `stepper_${id - 1}`"
                >
                  Previous Step
                </button>
                <button
                  v-if="id < titles.length - 1"
                  class="md-button btn btn--tertiary btn--noradius"
                  @click.prevent="active = `stepper_${id + 1}`"
                >
                  Next Step
                </button>
                <button
                  @click.prevent="(e) => openDialogBox()"
                  class="md-button btn btn--primary btn--noradius"
                >
                  Submit
                </button>
              </div>
            </template>
          </md-step>
        </md-steppers>
      </form>

      <!-- Center Stepper  -->
      <div
        v-if="active === 'stepper_null'"
        class="u--margin-toplg spinner md-layout md-gutter md-alignment-center-center"
      >
        <div
          class="md-layout-item md-size-40 md-medium-size-70 md-small-size-85 md-xsmall-size-95"
        >
          <md-field>
            <label for="sNC">Please choose a sheet name</label>
            <md-select v-model="active" name="sheet" id="sNC">
              <md-option
                v-for="(title, id) in titles"
                :key="`sCO${id}`"
                :value="`stepper_${id}`"
                >{{ title }}</md-option
              >
            </md-select>
          </md-field>
        </div>
      </div>

      <!-- Dialog Box -->
      <dialog-box :minWidth="40" :active="dialogBoxActive">
        <template v-slot:title>Alert</template>
        <template v-slot:content>{{ dialogBoxText }}</template>
        <template v-slot:actions>
          <md-button @click.native.prevent="closeDialogBox">No</md-button>
          <md-button @click.native.prevent="confirmAction">Yes</md-button>
        </template>
      </dialog-box>
    </div>
  </div>
</template>

<script>
import CurateNavBar from '@/components/curate/CurateNavBar.vue'
import InputComponent from '@/components/explorer/InputComponent.vue'
import dialogBox from '@/components/Dialog.vue'
import spinner from '@/components/Spinner'
import MultipleInputComponent from '@/components/explorer/MultipleInputComponent.vue'
import { mapActions, mapState, mapGetters, mapMutations } from 'vuex'
export default {
  name: 'CurationForm',
  components: {
    spinner,
    dialogBox,
    CurateNavBar,
    InputComponent,
    MultipleInputComponent
  },
  data () {
    return {
      editRouteParent: [
        {
          label: 'Curate',
          path: '/explorer/curate'
        },
        {
          label: 'Curation Form',
          path: '/explorer/curate/stepper'
        }
      ],
      tempInputObj: {},
      vStepError: {},
      titles: [],
      listItems: [], // for temporarily holding list items when open
      loadingList: false, // loading state for lists
      loading: true,
      loadingText: 'Loading Curation Form',
      error: false,
      active: 'stepper_null',
      verticalActive: 'v_1',
      dialogBoxText: '',
      dialogBoxAction: null,
      searchKeyword: '',
      searchResult: [],
      showDropdown: false,
      resetVStep: true
    }
  },
  methods: {
    ...mapActions({
      fetchData: 'explorer/curation/fetchCurationData',
      fetchXlsList: 'explorer/curation/fetchXlsList',
      submitCurationData: 'explorer/curation/submitCurationData'
    }),
    ...mapMutations({
      toggleDialogBox: 'setDialogBox'
    }),
    hasProperty (obj, prop) {
      return Object.hasOwnProperty.call(obj, prop)
    },
    navBack () {
      this.$router.back()
    },
    searchCurationForm () {
      this.searchResult = []
      if (this.searchKeyword.length < 3) return
      const searchResult = []
      const regex = new RegExp(this.searchKeyword, 'gi')
      for (const key in this.tempInputObj) {
        const arr = this.tempInputObj[key]
        for (let i = 0; i < arr.length; i++) {
          if (
            !!arr[i].ref.length &&
            !!arr[i].ref.find((e) => e.search(regex) !== -1)
          ) {
            searchResult.push([key, ...arr[i].ref])
          }
        }
      }
      this.searchResult = searchResult
      this.showDropdown = true
    },
    async showInputLocation (arr = [], title = null) {
      this.resetVStep = false
      await this.$nextTick()
      const ref = arr
      const formTitle = !title ? ref.shift() : title
      const formArr = this.tempInputObj[formTitle]
      const matchIndex = formArr.findIndex(
        (currVal) => JSON.stringify(currVal.ref) === JSON.stringify([...ref])
      )
      const hIndex = this.titles.findIndex((val) => val === formTitle)
      const vIndex = Math.floor(matchIndex / 5) + 1
      await this.$nextTick()
      this.active = `stepper_${hIndex}`
      this.verticalActive = `v_${vIndex}`
      this.searchKeyword = ''
    },
    async disableRender (e) {
      const selected = e.target.closest('.search_box')
      if (!selected) {
        this.showDropdown = false
      }
    },
    closeDialogBox () {
      if (this.dialogBoxActive) {
        this.toggleDialogBox()
      }
      this.dialogBoxText = ''
      this.dialogBoxAction = null
    },
    updateStepError (title, step) {
      if (!this.vStepError[title].includes(step)) {
        return this.vStepError[title].push(step)
      }
    },
    checkErrorsLocation () {
      for (let i = 0; i < this.titles.length; i++) {
        if (this.hasProperty(this.errors, this.titles[i])) {
          this.showErrorsLocation(
            this.titles[i],
            this.errors[this.titles[i]],
            []
          )
        }
      }
    },
    showErrorsLocation (title, obj, ref = []) {
      for (const key in obj) {
        if (Array.isArray(obj[key])) {
          for (let i = 0; i < obj[key].length; i++) {
            this.showErrorsLocation(title, obj[key][i], [...ref, key])
          }
        } else if (typeof obj[key] === 'object') {
          this.showErrorsLocation(title, obj[key], [...ref, key])
        } else {
          const arr = this.tempInputObj[title]
          let matchIndex = arr.findIndex(
            (currVal) =>
              JSON.stringify(currVal.ref) === JSON.stringify([...ref, key])
          )
          if (matchIndex === -1) {
            matchIndex = arr.findIndex(
              (currVal) =>
                JSON.stringify(currVal.ref) === JSON.stringify([...ref])
            )
          }
          if (matchIndex < 5 && matchIndex !== -1) { this.updateStepError(title, 1) } else if (matchIndex !== -1) { this.updateStepError(title, Math.floor(matchIndex / 5) + 1) }
        }
      }
    },
    submitForm () {
      this.submit()
      this.closeDialogBox()
    },
    async submit () {
      this.loading = true
      this.error = false
      this.loadingText = 'Uploading Data Entry'
      for (let i = 0; i < this.titles.length; i++) {
        this.vStepError[this.titles[i]] = []
      }
      try {
        await this.validateForm(this.tempInputObj)
        if (this.isEditMode) {
          const query = this.$route.query
          await this.submitCurationData({
            xlsxObjectId: query?.id,
            isNew: query?.isNew
          })
        } else {
          await this.submitCurationData()
        }
      } catch (error) {
        if (Object.keys(this.errors).length) this.checkErrorsLocation()
        this.$store.commit('setSnackbar', {
          message: error?.message ?? 'Something went wrong',
          action: () => this.submit()
        })
      } finally {
        this.loading = false
      }
    },
    async validateForm (obj) {
      this.$store.commit('explorer/curation/setCurationFormError', {})
      const errorObj = {}
      for (const key in obj) {
        const arr = obj[key]
        for (let i = 0; i < arr.length; i++) {
          const detail = obj[key][i]?.detail ?? {}
          if (detail.required) {
            if (this.hasProperty(detail, 'cellValue') && !detail?.cellValue) {
              errorObj[key] = this.hasProperty(errorObj, key)
                ? errorObj[key]
                : {}
              const refArr = obj[key][i]?.ref || []
              if (!refArr.length) {
                errorObj[key] = `${obj[key][i].name} is a required field`
              } else {
                refArr.reduce(function (o, x, index) {
                  return index === refArr.length - 1
                    ? (o[x] = `${obj[key][i].name} is a required field`)
                    : (o[x] = typeof o[x] === 'object' ? o[x] : {})
                }, errorObj[key])
              }
            }
          }
        }
      }

      this.$store.commit('explorer/curation/setCurationFormError', errorObj)
    },
    goToStep (id, index) {
      if (index) this.verticalActive = index
    },
    async fetchListValues (arg) {
      this.listItems = []
      this.loadingList = true
      try {
        const result = await this.fetchXlsList({ field: arg })
        this.listItems = result?.columns[0]?.values || []
      } catch (error) {
        this.$store.commit('setSnackbar', {
          message: 'Something went wrong',
          action: () => this.fetchListValues(arg)
        })
      } finally {
        this.loadingList = false
      }
    },
    fetchParameterValues (arr = []) {
      this.listItems = []
      const data = arr.reduce((acc, val) => acc.concat(Object.keys(val)), [])
      this.listItems = data
    },
    sortCurate (arg) {
      var id = arg.slice(-1)
      this.verticalActive = this.resetVStep ? 'v_1' : this.verticalActive
      this.resetVStep = true
      if (!this.tempInputObj[this.titles[id]].length) {
        return this.filterData(
          this.titles[id],
          this.curate[this.titles[id]],
          []
        )
      }
    },
    sort_variedMultiple_alt (title, arr, parent) {
      for (let i = 0; i < arr.length; i++) {
        if (this.hasProperty(arr[i], 'ChooseParameter')) {
          const ref = [...parent, 'ChooseParameter']
          this.tempInputObj[title].push({
            detail: arr[i].ChooseParameter,
            name: 'ChooseParameter',
            ref: ref
          })
        }
      }
    },
    addVariedMultiple (title, arr, parent) {
      const obj = JSON.parse(JSON.stringify(arr[0]))
      this.clearFields(obj)
      const refArr = parent || []
      const refData = refArr.reduce(function (o, x) {
        return typeof o === 'undefined' || o === null ? o : o[x]
      }, this.curate[title])

      if (
        this.hasProperty(refData, 'values') &&
        Array.isArray(refData?.values)
      ) {
        refData.values.push(obj)
        const length = refData.values.length
        this.sort_variedMultiple_alt(
          title,
          [refData.values[length - 1]],
          parent
        )
        console.log(title)
      }
    },
    filterData (title, obj, parent = []) {
      if (
        this.hasProperty(obj, 'type') &&
        this.hasProperty(obj, 'cellValue') &&
        !parent.length
      ) {
        obj.cellValue = this.$route?.query?.id ? obj.cellValue : null
        return this.tempInputObj[title].push({
          detail: obj,
          name: title,
          ref: [...parent, title]
        })
      }
      for (const prop in obj) {
        const ref = parent
        if (!obj[prop]?.type && typeof (obj[prop] === 'object')) {
          this.filterData(title, obj[prop], [...parent, prop])
        } else {
          if (
            obj[prop].type === 'replace_nested' &&
            !this.hasProperty(obj[prop], 'edited')
          ) {
            obj[prop].values = this.$route?.query?.id ? obj[prop].values : []
            this.$store.commit('explorer/curation/setReplaceNestedRef', [
              title,
              ...ref,
              prop
            ])
          } else if (
            obj[prop].type === 'multiples' &&
            !this.$route?.query?.id
          ) {
            this.clearFields(obj[prop])
          } else if (!this.$route?.query?.id) {
            obj[prop].cellValue = null
          }
          this.tempInputObj[title].push({
            detail: obj[prop],
            name: prop,
            ref: [...ref, prop]
          })
          if (
            obj[prop].type === 'varied_multiples' &&
            !this.$route?.query?.id
          ) {
            this.clearFields(obj[prop])
          }
          if (
            obj[prop].type === 'varied_multiples' &&
            !!this.$route?.query?.id &&
            !!obj[prop].cellValue
          ) {
            this.sort_variedMultiple_alt(title, obj[prop].values, [
              ...ref,
              prop
            ])
          }
        }
      }
    },
    clearFields (obj) {
      if (this.hasProperty(obj, 'type')) {
        if (obj.type === 'multiples' || obj.type === 'varied_multiples') {
          const arr = obj.values
          for (let i = 0; i < arr.length; i++) {
            this.clearFields(arr[i])
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
    filterCurationData () {
      this.titles = Object.keys(this.curate).filter((word) => word !== 'ID')
      this.clearFields(this.curate.ID)
      const objArr = {}
      const errArr = {}
      for (let i = 0; i < this.titles.length; i++) {
        objArr[this.titles[i]] = []
        errArr[this.titles[i]] = []
        this.vStepError = Object.assign({}, this.vStepError, errArr)
        this.tempInputObj = Object.assign({}, this.tempInputObj, objArr)
        this.filterData(this.titles[i], this.curate[this.titles[i]], [])
      }
    },
    async fetchCurationData () {
      this.loading = true
      this.error = false
      this.loadingText = 'Loading Curation Form'
      const query = this.$route.query
      this.$store.commit('explorer/curation/clearReplaceNestedRef')
      try {
        const arg = this.isEditMode
          ? { isNew: query.isNew, id: query.id }
          : null
        if (
          this.isEditMode &&
          (!this.hasProperty(query, 'isNew') || !this.hasProperty(query, 'id'))
        ) {
          throw new Error('Incorrect Route Parameters')
        }
        await this.fetchData(arg)
        this.filterCurationData()
      } catch (error) {
        this.$store.commit('setSnackbar', {
          message: error?.message || 'Something went wrong',
          action: () => this.fetchCurationData()
        })
        this.error = true
      } finally {
        this.loading = false
      }
    },
    resetState () {
      this.loading = true
      this.tempInputObj = {}
      this.vStepError = {}
      this.titles = []
      this.active = 'stepper_null'
      this.verticalActive = 'v_1'
      this.dialogBoxText = ''
      this.dialogBoxAction = null
      this.$store.commit('explorer/curation/setCurationFormData', {})
      this.$store.commit('explorer/curation/setCurationFormError', {})
      this.$store.commit('explorer/curation/clearReplaceNestedRef')
    },
    openDialogBox (msg = null, func = null) {
      this.dialogBoxText = !msg ? 'Are you sure you want to submit?' : msg
      this.dialogBoxAction = !func ? () => this.submitForm() : func
      if (!this.dialogBoxActive) {
        this.toggleDialogBox()
      }
    },
    confirmAction () {
      if (this.dialogBoxAction) {
        this.dialogBoxAction()
        this.closeDialogBox()
      }
    }
  },
  async created () {
    await this.fetchCurationData()
  },
  beforeRouteLeave (to, _, next) {
    let msg = ''
    if (to.name === 'XmlVisualizer') return next()
    if (this.error) return next()
    if (to.path === '/explorer/curate/stepper') {
      msg =
        'Do you want to create a new curation? You would lose any unsaved changes!'
      return this.openDialogBox(msg, () => {
        next()
        this.resetState()
        this.fetchCurationData()
      })
    }
    msg = 'Do you really want to leave? You would lose any unsaved changes!'
    return this.openDialogBox(msg, () => {
      next()
      this.resetState()
    })
  },
  computed: {
    ...mapState({
      curate: (state) => state.explorer.curation.curationFormData,
      errors: (state) => state.explorer.curation.curationFormError
    }),
    ...mapGetters({
      dialogBoxActive: 'dialogBox'
    }),
    reduceSpacing () {
      return { alignItems: 'baseline', minHeight: 'auto', paddingTop: 0 }
    },
    setDropdownPosition () {
      return { top: 100 + '%', zIndex: 10, right: 0, minHeight: 'auto' }
    },
    inputSizesm () {
      return 'md-size-40 md-medium-size-45 md-small-size-50 '
    },
    isEditMode () {
      return !!Object.keys(this.$route.query).length
    },
    navRoutes () {
      if (this.isEditMode) return [...this.editRouteParent]
      return [this.editRouteParent[0]]
    }
  },
  watch: {
    searchKeyword (newVal) {
      if (newVal) {
        this.searchCurationForm()
      }
    }
  }
}
</script>
