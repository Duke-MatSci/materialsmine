<template>
  <div>
    <div class=" viz-u-mgup-sm utility-margin md-theme-default">
      <div class="md-card-header contactus_radios md-card-header-flex">
        <div class="md-card-header-text">
          <div class="md-layout-item_para_fl u--color-grey wrapper--medium">
            You can view and download your schema here.
          </div>
        </div>
      </div>

      <md-divider class="u_margin-top-small u_margin-bottom-med"></md-divider>

      <template >
        <div class="utility-roverflow">
          <div class="gallery-grid grid grid_col-3">
            <div class="gallery-item">
              <div class="md-layout md-layout-item md-layout-item_card utility-phone_margin">
                <router-link to="/xsd/xsd-view" tag="div" class="explorer_page-nav-card teams_container u--margin-rightml u--margin-none utility-roverflow u--shadow-none">
                  <i class="md-icon md-icon-font explorer_page-nav-card_icon md-theme-default card-icon-adjust u--margin-topxl">code</i>
                  <span class="explorer_page-nav-card_text viz-sample__loading u_margin-top-small">View XSD schema</span>
                  <p class="md-layout-item_para u--font-emph-sl"> View your schema in a json format directly from the web. </p>
                </router-link>
              </div>
            </div>
            <div class="gallery-item" @click="downloadJsonSchema()">
              <div class="md-layout md-layout-item_card utility-phone_margin">
                <div class="explorer_page-nav-card teams_container u--margin-rightml u--margin-none u--shadow-none">
                  <i class="md-icon md-icon-font explorer_page-nav-card_icon md-theme-default card-icon-adjust u--margin-topxl">download</i>
                  <span class="explorer_page-nav-card_text viz-sample__loading u_margin-top-med">Download schema</span>
                  <p class="md-layout-item_para u--font-emph-sl"> Download your schema in a XSD format to your local machine. </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
export default {
  name: 'ViewSchema',
  data () {
    return {
    }
  },
  created () {
    this.$store.commit('setAppHeaderInfo', { icon: '', name: 'View Schema' })
  },
  computed: {
    ...mapGetters({
      token: 'auth/token'
    })
  },
  methods: {
    downloadJsonSchema () {
      this.$store.commit('setSnackbar', {
        message: 'Preparing File For Download',
        duration: 7000
      })
      fetch('http://localhost/api/curate?isFile=true', {
        method: 'GET',
        headers: { Authorization: `Bearer ${this.token}` },
        responseType: 'blob'
      })
        .then(resp => resp.blob())
        .then((data) => {
          const fileUrl = window.URL.createObjectURL(data)
          const fileLink = document.createElement('a')
          fileLink.href = fileUrl
          fileLink.setAttribute('download', 'XSD-Schema')
          document.body.appendChild(fileLink)
          fileLink.click()
        })
        .catch((error) => {
          console.log(error)
          this.$store.commit('setSnackbar', {
            message: 'Something went wrong',
            action: () => this.downloadJsonSchema()
          })
        })
    }
  }
}
</script>
