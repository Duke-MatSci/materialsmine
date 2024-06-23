<template>
  <chart-gallery sender="Favourite Chart" :isFavourite="isAuth" />
</template>
<script>
import { mapGetters } from 'vuex';
import ChartGallery from '@/components/ChartGallery.vue';
export default {
  name: 'FavouriteChart',
  components: {
    ChartGallery
  },
  computed: {
    ...mapGetters({
      isAuth: 'auth/isAuthenticated'
    })
  }
};
</script>
