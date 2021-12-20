<template>
  <div class="home">
    <img alt="Vue logo" src="../assets/logo.png" />
    <md-switch v-model="boolean">Accent <small>(Default)</small></md-switch>
    <md-switch v-model="boolean" class="md-primary">Primary</md-switch>
    <HelloWorld msg="Welcome to MaterialsMine Project" />
  </div>
</template>

<script>
// @ is an alias to /src
import HelloWorld from "@/components/HelloWorld.vue";

export default {
  name: "Home",
  data: () => ({
    boolean: true,
  }),
  components: {
    HelloWorld,
  },
};
</script>

<style lang="scss" scoped>
  .md-switch {
    display: flex;
  }
</style>