<template>
  <div class="gallery">
    <div v-if="searchForm" :class="['utility-roverflow', dense ? '' : 'u--margin-toplg']">
      <div :class="['search_box card-icon-container', dense ? '' : 'u--margin-toplg']">
        <form class="form">
          <div class="search_box_form">
            <div class="form__group search_box_form-item-1">
              <!-- input  -->
              <slot name="search_input"></slot>
              <label htmlFor="search" class="form__label search_box_form_label">Search Xml</label>
            </div>
          </div>
          <div class="form__group search_box_form-item-2 search_box_form-item-2-padded explorer_page-nav u--margin-neg" :class="[dense ? 'u--layout-width' : '']">
            <slot name="filter_inputs"></slot>
          </div>
          <div class="form__group search_box_form-item-2 explorer_page-nav u--margin-neg" :class="[dense ? 'u--layout-width search_box_form-item-2-padded' : '']">
            <slot name="action_buttons"></slot>
          </div>
        </form>
      </div>
    </div>
    <div class="utility-roverflow" >
      <div class="u_content__result u_margin-top-small viz-u-postion__rel">
        <span class="u_color utility-navfont" id="css-adjust-navfont">
          <strong v-if="totalItems === 1">{{ renderText }}</strong>
          <strong v-if="totalItems > 1">{{ renderText }}s</strong>
          <span v-if="totalItems === 0 "> No results </span>
          <span v-else-if="totalItems === 1"> 1 result </span>
          <span v-else> About {{ totalItems }} results </span>
          <span class="utility-absolute-input ">
            <label for="pagesize"><strong>Page size:</strong></label>
            <slot name="page_input">
              <input type="number" class="u_width--xs utility-navfont" name="pagesize" min="1" max="20">
            </slot>
          </span>
        </span>
      </div>
      <div :class="['gallery-grid', 'grid', dense ? 'grid_col-3 grid_gap-small u_searchimage_input' : 'grid_col-5' ]"> <slot></slot></div>
      <slot name="pagination"> </slot>
    </div>
    <div class="section_loader u--margin-toplg" v-if="loading">
      <spinner :loading="loading" :text='loadingText'/>
    </div>
    <div v-else-if="error || isEmpty" :class="['utility-roverflow u_centralize_text', dense ? '' : 'u_margin-top-med']">
      <h1 class="visualize_header-h1 u_margin-top-med"><slot name="errorMessage"></slot></h1>
    </div>
    </div>
</template>

<script>
import spinner from '@/components/Spinner'
export default {
  name: 'SearchGallery',
  props: {
    totalItems: {
      type: Number,
      required: true
    },
    loadingText: {
      type: String,
      default: 'Loading Gallery'
    },
    loading: {
      type: Boolean,
      required: true,
      default: true
    },
    error: {
      type: Boolean,
      required: true,
      default: false
    },
    isEmpty: {
      type: Boolean,
      required: true,
      default: false
    },
    dense: {
      type: Boolean,
      default: false
    },
    searchForm: {
      type: Boolean,
      default: true
    }
  },
  data () {
    return {
      renderText: 'Showing all XML'
    }
  },
  components: {
    spinner
  }
}
</script>
