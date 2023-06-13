<template>
  <div class="">
    <div class="btn--animated u_myprofile md-elevation-2 gallery-item results_card" v-if="contact && !!Object.keys(contact).length">
      <div class="md-card-actions viz-u-display__show">
        <div class="contact__box-email results_card-title md-body-2 u--color-black utility-roverflow">{{ contact.email }}</div>
        <div class="md-layout">
          <div class="utility-line-height-sm teams_header">
            <p class="md-body-1 u--color-secondary">{{ shortMessage }}</p>
          </div>
        </div>

        <md-dialog-actions class="u--padding-zero" >
          <button class="btn btn--white md-body-1 u--shadow-none btn--noradius" @click.prevent="displayInquiry">Read</button>
        </md-dialog-actions>
      </div>
    </div>
  </div>
</template>

<script>
import reduce from '@/mixins/reduce'
import { mapMutations } from 'vuex'
export default {
  name: 'ContactBox',
  mixins: [reduce],
  props: {
    contact: {
      type: Object,
      required: true
    }
  },
  data () {
    return {
      show: false
    }
  },
  computed: {
    shortMessage () {
      return this.reduceDescription(this.contact.message, 3)
    }
  },
  methods: {
    ...mapMutations({
      setDisplayedInquiry: 'contact/setDisplayedInquiry'
    }),
    displayInquiry () {
      this.setDisplayedInquiry(this.contact)
    }
  }
}
</script>