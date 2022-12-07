<template>
<div>
<div class="section_teams">
  <div>
    <div>
      <md-button
          class="md-icon-button"
          @click.native.prevent="navBack"
      >
          <md-tooltip md-direction="bottom">
          Go Back
          </md-tooltip>
      <md-icon>arrow_back</md-icon>
      </md-button>
      <router-link to="/explorer/curate" v-slot="{navigate, href}" custom>
        <a :href="href" @click="navigate">
          <md-tooltip md-direction="bottom">
          Curate Home
          </md-tooltip>
          Curate
        </a>
      </router-link>
      <span class="md-icon-button"> > </span>
      <router-link to="/explorer/curate/new" v-slot="{navigate, href}" custom>
        <a :href="href" @click="navigate">
            <md-tooltip md-direction="bottom">
            Select curation method
            </md-tooltip>
            Method
        </a>
      </router-link>
      <span class="md-icon-button"> > </span>
      <span class="md-icon-button"> Direct Upload with SDD</span>
    </div>
  </div>
  <div class="curate">
    <div>
          <div>
           <div class=""></div>
            <!--------->
            <md-card style="margin: 10px" >
                <form class="modal-content" action="" method="post"
                  enctype="multipart/form-data"
                  upload_type="http://www.w3.org/ns/dcat#Dataset">
                <md-steppers :md-active-step.sync="active" md-linear>

                  <md-step id="first" md-label="Upload files" :md-done.sync="first">
                     <div style="margin: 20px">

                      <md-field style="max-width: 100%;">
                        <label>DOI of related publication (e.g., 10.1000/000)</label>
                        <md-input></md-input>
                      </md-field>

                        <md-field style="max-width: none;"  >
                          <label>Select files to upload for this dataset</label>
                          <md-file id="distrFiles" multiple required isInvalidValue=false />
                          <span class="md-error" style="margin-left:40px">At least one distribution is required</span>
                        </md-field>
                        <div class="large-12 medium-12 small-12 cell" style="margin:20px">

                        </div>

                        <md-field style="max-width: none;">
                          <label>Select a representative image to use as thumbnail</label>
                          <md-file
                            id="repImgUploader" accept="image/*"/>
                        </md-field>
                        <div id="depictWrapper" style="margin-left: 40px; visibility: hidden;">
                          <figure>
                            <img id="depictImg" src="" alt="Image preview..."  style="height:200px">
                            <figcaption>depiction caption</figcaption>
                          </figure>
                          <md-button style="margin-left: 40px;" type="button" class="close md-raised">Remove image</md-button>
                        </div>
                      </div>
                      <div class="md-layout" style="align-items: center;">
                        <div class="md-layout-item">
                          <md-button
                            @click="setDone('first', 'second')"
                            class="md-raised md-primary">
                            Upload and continue
                          </md-button>
                        </div>
                        <!-- <div class="md-layout-item" v-if="doiLoading">
                          <md-progress-spinner :md-diameter="30" :md-stroke="3" md-mode="indeterminate"></md-progress-spinner>
                        </div> -->
                        <div class="md-layout-item">
                        </div>
                        <div class="md-layout-item">
                        </div>
                      </div>

                    </md-step>

                    <md-step id="second" md-label="Provide additional info" :md-done.sync="second">

                      <div class="md-layout">

                        <!---------- General Info fields ---------->
                        <md-content style="width: 100%; margin: 20px">
                          <div class="md-headline" style="margin-top: 10px">
                            General Information
                          </div>
                          <md-field style="max-width: 100%;" >
                            <label>Title</label>
                            <md-input required></md-input>
                            <span class="md-error">Title required</span>
                          </md-field>

                          <div class="md-subheading" style="margin-top: 40px;">Contact Point</div>
                          <div class="md-layout md-gutter" style="align-items: center;">

                            <div class="md-layout-item md-size-30">
                              <md-field  style="max-width: 100%;">
                                <label>ORCID Identifier (e.g., 0000-0001-2345-6789)</label>
                                <md-input  required ></md-input>
                                <span class="md-error">ORCID iD required</span>
                              </md-field>
                            </div>

                            <div class="md-layout-item md-size-20">
                              <md-field >
                                <label>First name</label>
                                <md-input required></md-input>
                                <span class="md-error">Contact point required</span>
                              </md-field>
                            </div>

                            <div class="md-layout-item md-size-20">
                              <md-field  >
                                <label>Last name</label>
                                <md-input required></md-input>
                                <span class="md-error">Contact point required</span>
                              </md-field>
                            </div>

                            <div class="md-layout-item md-size-25">
                              <md-field   style="max-width: 100%;">
                                <label>Email</label>
                                <md-input required></md-input>
                                <span class="md-error">Valid email required</span>
                              </md-field>
                            </div>
                          </div>

                          <!-- <div style="color: red; margin-bottom: 20px; text-align: center;" v-if="cpIDError">
                            No results found for {{cpID}}
                          </div> -->

                          <div style="margin-bottom: 40px; text-align: center;">
                            Don't have an ORCID iD?
                            <a href="https://orcid.org/" target="_blank">Create one here</a>
                          </div>

                          <md-field style="max-width: 100%;"  >
                            <label>Text Description</label>
                            <md-textarea  required></md-textarea>
                            <span class="md-error">Description required</span>
                          </md-field>

                        </md-content>

                        <md-divider style="border-style: solid" width="100%"></md-divider>

                        <!---------- Contributor fields -------->
                        <md-content style="width: 100%; margin: 20px">
                          <div class="md-headline" style="margin-top: 10px; margin-bottom: 10px">
                            Contributors
                          </div>

                          <div>
                          <table class="table" width="100%" style="border-collapse: collapse;">
                            <tbody>
                              <tr >
                              <td style="width:100%">
                                <tr v-for="(row, index) in []"
                                  v-bind:key="index + 'contr'"
                                  style="border-top: 0.5pt lightgray solid"
                                >
                                  <td style="width:50%">
                                    {{contributors[index]['name']}}
                                  </td>
                                  <td style="width:40%">
                                    <!-- <md-autocomplete
                                      style="max-width: 90%;"

                                      :md-options="autocomplete.availableInstitutions"
                                      :md-open-on-focus="false"
                                      @md-changed="resolveEntityInstitution"
                                      @md-selected="selectedOrgChange(index, $event)"
                                    >
                                      <label>Organization</label>

                                      <template style="max-width: 90%;" slot="md-autocomplete-item" slot-scope="{ item, term }">
                                        <md-highlight-text :md-term="term">{{ item.label }}</md-highlight-text>
                                      </template>

                                      <template style="max-width: 90%;" slot="md-autocomplete-empty" slot-scope="{ term }">
                                        <p>No organizations matching "{{ term }}" were found.</p>
                                        <a style="cursor: pointer">Create new</a>
                                      </template>
                                    </md-autocomplete> -->

                                  </td>
                                  <td>
                                    <a style="cursor: pointer" >Remove</a>
                                  </td>
                                </tr>
                              </td>
                              </tr>
                            </tbody>

                          </table>
                          </div>
                        </md-content>

                        <md-divider style="border-style: solid" width="100%"></md-divider>

                        <!-- -------- Publication Info fields -------- -->
                        <md-content style="width: 100%; margin: 20px">
                          <div class="md-headline" style="margin-top: 10px; margin-bottom: 10px">
                            Publication Information
                          </div>

                          <div style="width: 100%">
                            <div class="md-layout md-gutter">
                              <div class="md-layout-item md-size-50">
                                <label>Date Published</label>
                                <md-field>
                                  <md-input type="date"
                                  ></md-input>
                                </md-field>
                              </div>

                              <div class="md-layout-item md-size-50">
                                <label>Date Last Modified</label>
                                <md-field>
                                  <md-input  type="date"
                                   ></md-input>
                                </md-field>
                              </div>
                            </div>

                          </div>
                        </md-content>
                        <md-button @click="setDone('second', 'third')" class="md-raised md-primary" >Next</md-button>
                        <!-- <span v-if="isInvalidForm" class="md-error" style="color:red">Check for errors in required fields</span> -->
                      </div>
                    </md-step>

                    <md-step id="third" md-label="Confirm and Submit" :md-done.sync="third">

                      <div class="md-headline" style="margin: 10px">
                        Form Results
                      </div>
                      (Results)

                      <md-card-actions>
                        <md-button class="md-primary"
                          >Submit</md-button
                        >
                      </md-card-actions>

                    </md-step>
                </md-steppers>
                </form>
              </md-card>
          </div>
    </div>
  </div>
</div>
</div>
</template>

<script>

export default {
  name: 'SDDHome',
  data () {
    return {
      auth: true,
      loading: false,
      localfiles: null,
      active: 'first',
      first: false,
      second: false,
      third: false
    }
  },
  methods: {
    navBack () {
      this.$router.back()
    },
    onInputChange (e) {
      this.addFiles(e.target.files)
      e.target.value = null // reset so that selecting the same file again will still cause it to fire this change
    },
    setDone (id, index) {
      this[id] = true
      if (index) {
        this.active = index
      }
    }
  }
}
</script>
