<template>
  <div>
    <md-snackbar
      :md-position="position"
      :md-active.sync="show"
      :md-duration="!snackbar.duration ? Infinity : snackbar.duration"
      class="md-snackbar-adjust"
    >
      {{ snackbar.message }}
      <span>
        <md-button
          v-if="snackbar.action && !snackbar.duration"
          id="snackbarAction"
          class="md-primary"
          @click.native="snackBarAction"
          >{{ snackbar.callToActionText }}</md-button
        >
      </span>
    </md-snackbar>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
export default {
  name: 'Snackbar',
  props: {
    position: {
      type: String,
      required: false,
      default: 'left'
    }
  },
  data() {
    return {
      show: false
    };
  },
  computed: {
    ...mapGetters({
      snackbar: 'getSnackbar'
    })
  },
  methods: {
    resetSnackbar() {
      this.show = false;
    },
    async snackBarAction() {
      if (this.snackbar.action) {
        this.show = false;
        return await this.snackbar.action();
      }
      this.show = false;
    }
  },
  watch: {
    snackbar(val, oldVal) {
      if (val.message) {
        this.show = true;
      } else if (val.duration === 0) {
        this.resetSnackbar();
      }
    },
    $route(newValue, oldValue) {
      if (newValue !== oldValue) {
        this.resetSnackbar();
      }
    }
  }
};
</script>
