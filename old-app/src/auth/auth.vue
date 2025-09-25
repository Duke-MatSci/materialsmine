<template><div></div></template>
<script>
export default {
  name: 'Auth',
  async created () {
    return await this.$store.dispatch(
      'auth/authProcessor',
      this.$route.params.auth
    )
  }
}
</script>
