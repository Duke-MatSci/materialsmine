<template>
  <div class="gallery">
    <spinner
      :loading="loading"
      text='Loading...'
      v-if="loading"
    />
    <div
      class="utility-roverflow"
      v-else
    >
      <div class="u_content__result">
        <!-- TODO TIME TO RESULT -->
        <span v-if="otherArgs == null && total <= 1">{{total}} result (0.59 seconds)</span>
        <span v-else-if="otherArgs == null && total >= 2">About {{total}} results (0.59 seconds)</span>
        <span
          class="u_color"
          v-else-if="otherArgs != null"
        >
          Home > <strong> {{ otherArgs }}</strong> > About {{total}} results (0.59 seconds)
        </span>
        <span v-else>No result (0.59 seconds)</span>
      </div>
      <div class="viz-content">
        <md-card
          v-for="(result, index) in items"
          :key="index"
          class="btn--animated gallery-item"
        >
          <div class="u_gridicon">
            <div
              @click.prevent="bookmark(result.name, true)"
              v-if="result.bookmark"
            >
              <md-icon>bookmark</md-icon>
            </div>
            <div
              @click.prevent="bookmark(result.name, false)"
              v-else
            >
              <md-icon>bookmark_border</md-icon>
            </div>
            <!-- TODO show only for admin -->
            <div @click.prevent="deleteChart(result)">
              <md-icon>delete_outline</md-icon>
            </div>
          </div>
          <router-link :to="`/explorer/chart/view/${result.id}`">
            <md-card-media-cover
              md-solid
            >
              <md-card-media md-ratio="4:3">
                <img
                  :src="getViewUrl(result.thumbnail)"
                  :alt="result.label"
                  v-if="result.thumbnail"
                >
                <img
                  :src="defaultImg"
                  :alt="result.label"
                  v-else
                >
              </md-card-media>
              <md-card-area class="u_gridbg">
                <md-card-header class="u_show_hide">
                  <span class="md-subheading">
                    <strong>{{ result.label }}</strong>
                  </span>
                  <span class="md-body-1">{{ reduceDescription(result.description) }}</span>
                </md-card-header>
              </md-card-area>
            </md-card-media-cover>
          </router-link>
        </md-card>
      </div>
      <pagination
        :cpage="page"
        :tpages="totalPages"
        @go-to-page="loadItems($event)"
      />
    </div>
  </div>
</template>
<script>
import spinner from '@/components/spinner'
import pagination from '@/components/explorer/Pagination'
import defaultImg from '@/assets/img/rdf_flyer.svg'
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'viz-grid',
  props: {
    authenticated: {
      type: Boolean,
      require: true
    },
    instancetype: {
      type: String,
      require: true
    }
  },
  data () {
    return {
      loading: true,
      loadError: false,
      otherArgs: null,
      defaultImg
    }
  },
  components: {
    pagination,
    spinner
  },
  computed: {
    ...mapGetters('explorer/gallery', ['items', 'page', 'total', 'totalPages'])
  },
  methods: {
    ...mapActions('explorer/gallery', ['loadItems']),
    reduceDescription (args) {
      let arr, arrSplice, res
      arr = args.split(' ')
      arr.splice(15)
      arrSplice = arr.reduce((a, b) => `${a} ${b}`, '')
      res = arrSplice.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      return `${res}...`
    },
    deleteChart (chart) {
      console.log('delete chart', chart)
    },
    async loadItems (page = 1) {
      this.loading = true
      await this.$store.dispatch('explorer/gallery/loadItems', { page })
      this.loading = false
    }
  },
  async mounted () {
    await this.loadItems()
  },
}
</script>
<style lang="scss" scoped>
@import "@/assets/css/base/_grid.scss";
@import "@/assets/css/abstract/_mixins.scss";
@import "@/assets/css/modules/_utility.scss";
.viz-content {
  display: grid;
  grid-template-rows: repeat(10);
  grid-template-columns: repeat(1, 1fr);
  grid-gap: 0.4rem;
  cursor: pointer;

  // TODO figure out why respond fn isn't working
  grid-template-rows: repeat(2, 1fr);
  grid-template-columns: repeat(5, 1fr);
  grid-gap: 1rem;
  grid-row-gap: 5rem;

  @include respond(tab-port) {
    grid-template-rows: repeat(3, 1fr);
    grid-template-columns: repeat(2, 1fr);
    grid-gap: 1rem;
  }

  @include respond(tab-land) {
    grid-template-rows: repeat(1, 1fr);
    grid-template-columns: repeat(3, 1fr);
    grid-gap: 1rem;
  }

  @include respond(desktop) {
    grid-template-rows: repeat(2, 1fr);
    grid-template-columns: repeat(4, 1fr);
    grid-gap: 1rem;
  }

  @include respond(big-desktop) {
    grid-template-rows: repeat(2, 1fr);
    grid-template-columns: repeat(5, 1fr);
    grid-gap: 1rem;
    grid-row-gap: 5rem;
  }
}
</style>
