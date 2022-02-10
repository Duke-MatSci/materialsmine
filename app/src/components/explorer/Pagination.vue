<template>
  <div class="pagination-container">
    <span>Page {{ cpage }} of {{ tpages }}</span>
    <div class="pagination">
      <button
        :disabled="cpage <= 1"
        @click.prevent="goToPage(1)"
        class="pagination-button pagination-button-home viz-u-display__desktop"
      >Home</button>
      <button
        :disabled="cpage <= 1"
        @click.prevent="goToPage(cpage - 1)"
        class="pagination-button pagination-button-prev viz-u-display__desktop"
      >Prev</button>
      <button
        :disabled="cpage >= tpages"
        @click.prevent="goToPage(cpage + 1)"
        class="pagination-button pagination-button-next viz-u-display__desktop"
      >Next</button>
      <button
        :disabled="cpage >= tpages"
        @click.prevent="goToPage(tpages)"
        class="pagination-button pagination-button-end viz-u-display__desktop"
      >End</button>
    </div>
  </div>
</template>
<script>
export default {
  name: 'pagination',
  props: {
    cpage: Number,
    tpages: Number,
  },
  methods: {
    goToPage (page) {
      if (page != this.cpage) {
        this.$emit('go-to-page', page)
      }
    },
    pageExists (page) {
      return page > 0 && page <= this.tpages
    }
  }
}
</script>
<style lang="scss" scoped>
@import "@/assets/css/abstract/_mixins.scss";
@import "@/assets/css/abstract/_variables.scss";
.pagination-container {
  width: 80%;
  margin: 1.5rem auto;
  text-align: center;

  @include respond(tab-land) {
    max-width: 28%;
    margin: 0 auto;
    margin-top: 3.5rem;
  }
}

.pagination {
  margin-top: 0.8rem;
  @include respond(tab-port) {
    margin: 0 auto;
    display: grid;
    grid-template-rows: repeat(1, 100%);
    grid-template-columns: repeat(4, 1fr);
    grid-column-gap: 1rem;
    margin: 1rem auto;
    max-width: 70%;
  }

  @include respond(tab-land) {
    max-width: 100%;
  }

  & > .pagination-button {
    display: inline;
    padding: 10px 24px !important;
    color: $primary-white !important;
    font-size: 0.8rem;
    border: none;
    background-color: $primary;
    text-align: center;
    cursor: pointer;
    margin-right: 0.8rem;


    @include respond(tab-land) {
      padding: 10px !important;
      font-size: 1rem;
      margin: 0;
    }

    &:hover {
      text-decoration: none;
      border: none;
      background-color: rgba($primary, 0.8);
      color: $primary-white !important;
    }

    &[disabled="disabled"] {
      background-color: $primary-grey;
      cursor: default;
    }
  }
  &-active {
    background-color: rgba($primary, 0.8);
  }
}
</style>
