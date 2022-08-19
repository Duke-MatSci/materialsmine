<template>
    <div class="image-detail-page">
      <div class="section_loader" v-if="$apollo.loading">
        <spinner :loading="$apollo.loading" text='Loading Images'/>
      </div>
      <div class="utility-roverflow" v-else-if="getSingleImages && getSingleImages.images">
        <div class="utility-content__result teams_partner">
          <div class="utility-space search_box_form u--layout-flex-justify-end">
            <md-button id="navbackBtn" class="md-icon-button" @click.native.prevent="navBack">
              <md-tooltip> Go Back </md-tooltip>
              <md-icon>arrow_back</md-icon>
            </md-button>
            <md-button id="shareChartBtn"  class="md-icon-button" @click.native.prevent="handleShare(`${baseUrl}${$router.currentRoute.fullPath}`)">
              <md-tooltip> {{ shareToolTip }} </md-tooltip>
              <md-icon>share</md-icon>
            </md-button>
          </div>
        </div>

        <md-card md-theme="green-card" class="md-primary u--shadow-none u--padding-zero-mobile" >
          <md-card-header class="section_md-header ">
            <md-card-header-text class="section_text-col flex-item">
              <div class="md-title u--margin-header">{{ currentImage.description || "Polymer nanocomposite image"}}</div>
              <div class="md-subhead u--margin-header">{{ currentImage.metaData.title}}</div>

              <button
                class="btn btn--primary search_box_form_btn mid-first-li display-text u--b-rad"
                @click="nav_to_doi(currentImage.metaData.doi)"
                >
                View Article
              </button>
            </md-card-header-text>

            <div class="quicklinks_content flex-item img-div u--padding-zero">
              <img :src="currentImage.file" :alt="currentImage.metaData.title" class="facet_viewport img">
            </div>
          </md-card-header>
        </md-card>

        <div class="search_box_form image-detail-page-tab u--layout-flex-justify-fs u--margin-centered  u--font-emph-smm u--margin-bottommd u--color-grey-sec u--dimension-size-m u--margin-leftsm ">
          <div @click="nav_to_tab" name="ri_active" :class="{'u--margin-rightmd': true, 'section_tabb-controller': !tabbed_content.ri_active, u_pointer: true, 'u--padding-rl-xs': true}">Related Images</div>
          <div @click="nav_to_tab" name="kw_active" :class="{'u--margin-rightmd': true, 'section_tabb-controller': !tabbed_content.kw_active, u_pointer: true, 'u--padding-rl-xs': true}">Keywords</div>
          <div @click="nav_to_tab" name="md_active" :class="{'u--margin-rightmd': true, 'section_tabb-controller': !tabbed_content.md_active, u_pointer: true, 'u--padding-rl-xs': true}">Metadata</div>
        </div>

        <div>
          <div id="related-images" :class="{search_box_form: true, 'u--layout-flex-justify-se': true, explorer_page_header: true, 'u--layout-flex-switch': tabbed_content.ri_active}">
            <div class="search_box_form howto_item-header">
              <md-button :class="{'md-icon-button': true, 'u--layout-hide': hideAssetNavLeft}" @click.prevent="reduceAsset('prev')">
                <md-tooltip> Show Left </md-tooltip>
                <md-icon>arrow_back</md-icon>
              </md-button>

              <div class="section_md-header image-detail-page__relatedImg">
                <md-card
                  v-for="(image, index) in assetItems"
                  :key="index"
                  class="md-card-class u--margin-none"
                >
                  <md-card-media-cover md-solid>
                    <md-card-media md-ratio="16:9">
                      <img :src="baseUrl + image.file" :alt="image.metaData.title" @click="updateCurrentImage(image.file)" class="u_pointer">
                    </md-card-media>

                    <md-card-area class="u_gridbg">
                      <md-card-header class="u_show_hide">
                        <span class="md-subheading">
                          <strong>{{ reduceDescription(image.description || 'polymer nanocomposite', 2) }}</strong>
                        </span>
                        <span class="md-body-1">
                          {{ reduceDescription(image.metaData.title || 'polymer nanocomposite', 8) }}
                        </span>
                      </md-card-header>
                    </md-card-area>
                  </md-card-media-cover>
                </md-card>
              </div>

              <md-button id="shareChartBtn"  :class="{'md-icon-button': true }" @click.prevent="reduceAsset('next')" >
                <md-tooltip> Show Right </md-tooltip>
                <md-icon>arrow_forward</md-icon>
              </md-button>
            </div>
          </div>

          <div id="keyword" :class="{'search_box_form':true, 'u--layout-flex-justify-se':true, 'explorer_page_header': true, 'u--layout-flex-switch': tabbed_content.kw_active, 'image-detail-page-details-flex-item-col':true}">
              <button
              v-for="word in getSingleImages.images[0].metaData.keywords"
              :key="word"
              @click="navToKeyword(word)"
              class="btn btn--primary search_box_form_btn mid-first-li display-text u--b-rad u--margin-pos">{{word}}</button>
          </div>

          <div id="metadata" :class="{search_box_form: true, 'u--layout-flex-justify-se': true, explorer_page_header: true, 'u--layout-flex-switch': tabbed_content.md_active, metadata:true}">
            <div class="u--margin-pos">
              <span class="u--font-emph-xl u--color-black">
                Microscopy:
              </span>
              <span id="microscropy" class="u--font-emph-xl u--color-grey-sec">
                {{ getSingleImages.images[0].microscopyType || 'N/A' }}
              </span>
            </div>
            <div class="u--margin-pos">
              <span class="u--font-emph-xl u--color-black">
                Dimension:
              </span>
              <span class="u--font-emph-xl u--color-grey-sec">
                width: {{ getSingleImages.images[0].dimension.width || 'N/A' }} | height: {{ getSingleImages.images[0].dimension.height || 'N/A' }}
              </span>
            </div>
            <div class="u--margin-pos">
              <span class="u--font-emph-xl u--color-black">
                Type:
              </span>
              <span class="u--font-emph-xl u--color-grey-sec">
                {{ getSingleImages.images[0].type || 'N/A' }}
              </span>
            </div>
          </div>
        </div>

      </div>
      <div v-else class="utility-roverflow u_centralize_text u_margin-top-med">
        <h1 class="visualize_header-h1 u_margin-top-med">Cannot Load Images!!!</h1>
      </div>
    </div>
</template>
<script>
import spinner from '@/components/Spinner'
import { SINGLE_IMAGE_QUERY } from '@/modules/gql/image-gql'
import reducer from '@/mixins/reduce'
export default {
  name: 'ImageDetailView',
  mixins: [reducer],
  props: ['id'],
  data () {
    return {
      baseUrl: window.location.origin,
      shareToolTip: 'Share Image',
      error: { status: false, message: null },
      getSingleImages: {},
      tabbed_content: {
        ri_active: true,
        kw_active: true,
        md_active: false
      },
      showLink: false,
      currentImage: {},
      assetItems: [],
      pushedAssetItem: [],
      screen: 0
    }
  },
  components: {
    spinner
  },
  watch: {
    getSingleImages (newValues, oldValues) {
      if (newValues) {
        this.setCurrentImage(newValues)
      }
    }
  },
  methods: {
    setCurrentImage (newValues) {
      const { images } = newValues
      const [first] = images.filter(img => img.file === this.$route.params.fileId)
      this.currentImage = first
      this.assetItems = images.filter(img => img.file !== this.$route.params.fileId)
    },
    navBack () {
      this.$router.push('/explorer/images')
    },
    nav_to_tab (e) {
      Object.keys(this.tabbed_content).forEach(el => { this.tabbed_content[el] = true })
      this.tabbed_content[e.target.getAttribute('name')] = false
    },
    nav_to_doi (doi) {
      this.$router.push(`/explorer/article/${doi}`)
    },
    navToKeyword (keyword) {
      this.$router.push('explorer/images')
    },
    updateCurrentImage (fileId) {
      const [first] = this.getSingleImages.images.filter(img => img.file === fileId)
      this.currentImage = first
    },
    handleShare (imgUrl) {
      navigator.clipboard.writeText(imgUrl)
      this.shareToolTip = 'Link copied to clipboard'
      setTimeout(function () { this.shareToolTip = 'Share Image' }, 2000)
    }
  },
  apollo: {
    getSingleImages: {
      query: SINGLE_IMAGE_QUERY,
      variables () {
        return {
          input: { id: this.$route.params.id }
        }
      },
      fetchPolicy: 'cache-and-network'
    }
  }
}
</script>
