<template>
  <summary
    @click="showDetails"
    class="u_pointer u--layout-flex"
    :id="id"
    v-if="hasNoChild"
  >
    <template v-if="hasParent">
      <span>&nbsp; &nbsp;</span>
      <span class="material-icons md-caption">subdirectory_arrow_right </span>
    </template>
    {{ summary }}
  </summary>
  <details class="list-ancestor" v-else>
    <summary @click="showDetails" class="u_pointer hh" :id="id">
      {{ summary }}
    </summary>
    <p class="u--margin-leftxs">
      <span v-if="hasChildren">
        <NamespaceAccordion
          class=""
          v-for="obj in child"
          :key="obj['ID']"
          :id="obj['ID']"
          :summary="obj['Preferred Name']"
          :child="obj['subClasses']"
          :class-info="obj"
          :has-parent="true"
        />
      </span>
      <template v-else>
        <NamespaceAccordion
          class="u--margin-leftxs"
          :id="child[0]['ID']"
          :summary="child[0]['Preferred Name']"
          :child="child[0]['subClasses']"
          :has-parent="true"
          :class-info="child[0]"
        />
      </template>
    </p>
  </details>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'NamespaceAccordion',
  data () {
    return {
      loading: false
      // selectedId: ''
    }
  },
  props: {
    id: {
      type: String,
      required: true
    },
    summary: {
      type: String,
      required: true
    },
    child: {
      type: Array || String,
      required: false
    },
    hasParent: {
      type: Boolean,
      default: false
    },
    classInfo: {
      type: Object,
      required: false
    }
  },
  computed: {
    ...mapGetters({
      selectedId: 'ns/getSelectedId'
    }),
    hasNoChild () {
      return !this.child || this.child.length === 0
    },
    hasChildren () {
      return this.child.length > 1
    },
    namespace () {
      return this.$route.params?.namespace
    }
  },
  methods: {
    async showDetails () {
      const id = this.id

      if (this.namespace) {
        const url = `/ns/${this.classInfo.ID.split('/').pop()}`
        this.$router.push(url)
      }
      if (this.selectedId) {
        this.toggleClass(this.selectedId)
      }
      // 2 Display selected value
      this.$store.commit('ns/clearCurrentClass')
      this.$store.commit('ns/setCurrentClass', this.classInfo)
      // 3 Update the selected value
      this.$store.commit('ns/setSelectedId', id) // id
      // 4 Add the Class to the new selected value
      this.toggleClass(id)
    },
    toggleClass (id) {
      const element = document.getElementById(id)
      if (!element) return
      element.classList.toggle('u--alt-bg')
    }
  }
}
</script>
