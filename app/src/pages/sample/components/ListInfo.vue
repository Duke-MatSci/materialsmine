<template>
  <div>
    <h2>{{ item.name }}</h2>
    <div v-for="property in item.properties" :key="property.value">
      <span>{{ property.slug }}: </span>
      <span>{{ property.value }} {{ property.unit }}</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ListInfo',
  props: {
    item: {
      type: Object,
      default: () => {}
    }
  }
}
</script>

<style></style>
