<template>
  <md-card v-if="displayCard" class="results_card" :key="doi">
    <md-card-header>
      <div class="md-title results_card-title"><a :href="doiLink" target="_blank">{{ articleTitle }}</a></div>
      <div class="md-subhead results_card-type">{{ articleType }}</div>
    </md-card-header>
    <md-card-content>
      <div class="results_card-description"> {{ articleDescription }}</div>
    </md-card-content>
  </md-card>
</template>

<script>
import articleMetadata from '@/modules/explorer/article/services/articleMetadata'

export default {
  name: 'ArticleCard',
  data () {
    return {
      article: {},
      loading: false,
      error: false
    }
  },
  props: {
    doi: {
      type: String,
      required: true
    }
  },
  computed: {
    doiLink: function () {
      if (this.doi) {
        return new URL(this.doi, 'https://www.doi.org')
      } else {
        return ''
      }
    },
    displayCard: function () {
      return !this.loading && !this.error
    },
    articleTitle: function () {
      return this.article.title
    },
    articleType: function () {
      return 'Academic article'
    },
    articleDescription: function () {
      const subStrings = [
        this.article.authorNames,
        this.article.year && `(${this.article.year})`,
        this.article.title,
        this.article.venue
      ].filter(item => item)
      return subStrings.join('. ') + '.'
    }
  },
  watch: {
    doi: 'fetchData'
  },
  created () {
    this.fetchData()
  },
  methods: {
    async fetchData () {
      this.loading = true
      this.error = false
      this.article = {}

      if (this.doi) {
        try {
          this.article = await articleMetadata.get({ doi: this.doi })
          if (this.article.error) {
            this.error = this.article.error
          }
          this.loading = false
        } catch (error) {
          this.error = error.message
          this.loading = false
        }
      }
    }
  }
}
</script>
