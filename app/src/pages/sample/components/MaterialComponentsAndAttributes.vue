<template>
  <div>
    <h1>Material Components and Attributes</h1>
    <div v-for="item in data" :key="item.name">
      <ListInfo :item="item" />
    </div>
  </div>
</template>

<script>
import { querySparqlEndpoint } from '../queries/settings'
import cardQuery from '../queries/cardQuery'
import getCardsData from '../services/getCardsData'
import ListInfo from './ListInfo.vue'
export default {
  props: {
    route: {
      type: String,
      default: 'no route'
    }
  },
  components: {
    ListInfo
  },
  data () {
    return {
      data: null
    }
  },
  mounted () {
    const urlEncodedQuery = querySparqlEndpoint({
      query: cardQuery,
      route: this.route
    })
    getCardsData(urlEncodedQuery).then((cardData) => (this.data = cardData))
  }
}
</script>

<style></style>
