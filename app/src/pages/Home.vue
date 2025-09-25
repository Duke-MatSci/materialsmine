<template>
  <div class="home section_pages">
    <img alt="Vue logo" src="../assets/logo.png" />
    <MdSwitch v-model="boolean">Accent <small>(Default)</small></MdSwitch>
    <MdSwitch v-model="boolean" class="md-primary">Primary</MdSwitch>
    <HelloWorld msg="Welcome to MaterialsMine Project" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useStore } from 'vuex';
import HelloWorld from '@/components/HelloWorld.vue';

const store = useStore();
const boolean = ref(true);

onMounted(() => {
  store.commit('setAppHeaderInfo', {
    icon: '',
    pagetype: 'home',
    name: 'MaterialsMine',
    subtitle:
      'An open source repository for nanocomposite data (NanoMine), and mechanical metamaterials data (MetaMine)',
  });
});

defineOptions({
  name: 'Home',
});
</script>

<style lang="scss" scoped>
.md-switch {
  display: flex;
}
</style>
