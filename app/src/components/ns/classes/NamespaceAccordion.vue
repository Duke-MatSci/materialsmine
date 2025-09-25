<template>
  <summary @click="showDetails" class="u_pointer u--layout-flex" :id="id" v-if="hasNoChild">
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

<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';

// Component name for debugging
defineOptions({
  name: 'NamespaceAccordion',
});

// Props
interface Props {
  id: string;
  summary: string;
  child?: any[] | string;
  hasParent?: boolean;
  classInfo?: any;
}

const props = withDefaults(defineProps<Props>(), {
  hasParent: false,
  child: () => [],
  classInfo: () => ({}),
});

const store = useStore();
const route = useRoute();
const router = useRouter();

// Computed properties
const selectedId = computed(() => store.getters['ns/getSelectedId']);

const hasNoChild = computed(() => {
  return !props.child || (Array.isArray(props.child) && props.child.length === 0);
});

const hasChildren = computed(() => {
  return Array.isArray(props.child) && props.child.length > 1;
});

const namespace = computed(() => route.params?.namespace as string);

// Methods
const showDetails = async () => {
  const id = props.id;

  if (namespace.value) {
    const url = `/ns/${props.classInfo.ID.split('/').pop()?.split('#').pop()}`;
    router.push(url);
  }
  if (selectedId.value) {
    toggleClass(selectedId.value);
  }
  // 2 Display selected value
  store.commit('ns/clearCurrentClass');
  store.commit('ns/setCurrentClass', props.classInfo);
  // 3 Update the selected value
  store.commit('ns/setSelectedId', id); // id
  // 4 Add the Class to the new selected value
  toggleClass(id);
};

const toggleClass = (id: string) => {
  const element = document.getElementById(id);
  if (!element) return;
  element.classList.toggle('u--alt-bg');
};
</script>
