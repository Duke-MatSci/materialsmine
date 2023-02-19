<template></template>
<script>
export default {
  name: 'Auth',
  created() {
	return this.$store.dispatch('auth/authProcessor', this.$route.params.auth)
  }
}
</script>
