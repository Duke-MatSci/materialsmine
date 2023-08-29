<template>
  <div>
    <div class="wrapper u_margin-top-med md-layout">
      <div class="u_width--max">
        <h4 class="md-title">Comments</h4>
      </div>

      <div v-for="(item, i) in optionalChaining(() => loadComment.comments)" :key="i"
        :class="[isUserMessage(optionalChaining(() => item.user.displayName))
          ? 'md-alignment-bottom-right u--margin-left-auto'
          : 'md-alignment-top-left', 'md-layout-item md-size-85 md-layout u_margin-top-med']"
      >
        <div v-if="!isUserMessage(optionalChaining(() => item.user.displayName))" class="u--margin-right-1"><md-icon>account_circle</md-icon></div>

        <div style="padding: 1.6rem;border: 1px solid #A2A5A9;" :class="[isUserMessage(optionalChaining(() => item.user.displayName)) && 'u--margin-right-1', 'md-layout-item u--b-rad']" >
          <p class="u--color-primary u--default-size">{{ item.user.givenName }} {{ item.user.surName }}</p>
          <p class="md-body-1">{{ item.comment }}</p>
          <p class="utility-align--right md-caption">{{ formatDate(item.createdAt) }}</p>
        </div>

        <div v-if="isUserMessage(optionalChaining(() => item.user.displayName))"><md-icon>account_circle</md-icon></div>
      </div>
    </div>

    <div class="wrapper u_margin-top-med">
      <form>
        <md-field>
          <label>Message</label>
          <md-textarea v-model="commentInput"></md-textarea>
        </md-field>

        <button type="submit" @click.prevent="submitComment" class="btn btn--primary btn--noradius search_box_form_btn u--margin-bottommd u--margin-left-auto">Submit</button>
      </form>
    </div>
  </div>
</template>

<script >
import { mapGetters } from 'vuex'
import { LOAD_COMMENTS, POST_COMMENT } from '@/modules/gql/comment-gql'
import optionalChainingUtil from '@/mixins/optional-chaining-util'
export default {
  name: 'Comments',
  mixins: [optionalChainingUtil],
  props: {
    type: {
      type: String,
      required: true,
      default: undefined
    },
    identifier: {
      type: String,
      required: true,
      default: undefined
    }
  },
  data () {
    return {
      commentInput: '',
      comments: [],
      pageNumber: 1,
      pageSize: 20,
      loadComment: {
        comments: []
      }
    }
  },
  computed: {
    ...mapGetters({
      displayName: 'auth/displayName',
      isAuth: 'auth/isAuthenticated'
    })
  },
  watch: {
    identifier () {
      this.$apollo.queries.loadComment.refetch()
    }
  },
  methods: {
    isUserMessage (arg) {
      return arg === this.displayName
    },
    async submitComment () {
      if (this.commentInput.length > 0) {
        if (this.isAuth && this.identifier && this.type) {
          try {
            await this.$apollo.mutate({
              mutation: POST_COMMENT,
              variables: {
                input: {
                  identifier: this.identifier,
                  type: this.type,
                  comment: this.commentInput
                }
              },
              errorPolicy: 'ignore'
            })
          } catch (error) {
            return this.errorHandler(error)
          }
          this.commentInput = ''
          return this.$apollo.queries.loadComment.refetch()
        } else {
          this.errorHandler({ graphQLErrors: 'You must be logged in to post comments' })
        }
      }
    },
    errorHandler (error) {
      if (error.networkError) {
        const err = error.networkError
        this.error = `Network Error: ${err?.response?.status} ${err?.response?.statusText}`
      } else if (error.graphQLErrors) {
        this.error = error.graphQLErrors
      }
      this.$store.commit('setSnackbar', {
        message: this.error,
        duration: 10000
      })
    },
    isToday (date) {
      return new Date().toDateString() === date.toDateString()
    },
    isYesterday (date) {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      return yesterday.toDateString() === date.toDateString()
    },
    formatDate (date) {
      const givenDate = new Date(parseInt(date))
      if (this.isToday(givenDate)) { return `Today ${givenDate.toLocaleTimeString()}` }

      if (this.isYesterday(givenDate)) { return `Yesterday ${givenDate.toLocaleTimeString()}` }

      return `${givenDate.toLocaleDateString()} ${givenDate.toLocaleTimeString()}`
    }
  },
  apollo: {
    loadComment: {
      query: LOAD_COMMENTS,
      variables () {
        return {
          input: { pageNumber: this.pageNumber, pageSize: this.pageSize, type: this.type, identifier: this.identifier }
        }
      },
      fetchPolicy: 'cache-and-network',
      error (error) {
        return this.errorHandler(error)
      }
    }
  }
}
</script>
