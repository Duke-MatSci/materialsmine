<template>
  <md-snackbar :md-position="position" :md-active.sync="active">
    <span>
      <slot name="content"></slot>
    </span>
    <md-button class="md-primary" @click.native="toggleSnackbar()">Close</md-button>
  </md-snackbar>
</template>

<script>
/*
NOTE: There are two snackbar implementations for review
This version ("Snackbar 1") passes the 'active' attribute as a prop, 
and uses a slot to fill the content. 
It uses almost exactly the same implementation as what we currently
do for dialog boxes.
- Pro: We're consistent on implementation for this kind of component,
  and allows for more customization
- Con: It doesn't work well with duration timeouts (i.e., the user
has to press close for it to close), and the toggle might be buggy
*/
import { mapMutations } from 'vuex'
export default {
  name: 'Snackbar',
  props: {
    active: {
      type: Boolean,
      default: false
    },
    position: {
      type: String,
      default: 'center'
    },
  },
  methods: {
    ...mapMutations({
      toggleSnackbar: 'setSnackbar'
    })
  }
}
</script>
