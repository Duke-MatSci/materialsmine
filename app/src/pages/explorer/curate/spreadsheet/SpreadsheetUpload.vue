<template>
<div>
<div class="section_teams">
  <div class="curate">
    <div>
      <LoginReq v-if="!auth"/>
      <div v-else>
        <h2 class="visualize_header-h1">Import spreadsheet data </h2>
        <md-steppers md-vertical md-linear :md-active-step.sync="active" class="form__stepper">
          <md-step id="first" md-label="Select spreadsheets for upload" :md-done.sync="first">
            <DropZone class="form__drop-area" @files-dropped="addFiles">
                <label for="file-input">
                    <div class="form__drop-area_label">
                        <div class="explorer_page-nav-card_text">Drag your file(s) here </div>
                        <div class="md-layout-item_para md-layout-item_para_fl" style="text-align:center">
                            or click to browse. Accepts .xlsx, .xls and .xml
                        </div>
                        <input type="file" id="file-input" multiple @change="onInputChange" accept=".xlsx, .xls, .xml"/>
                    </div>
                </label>
            </DropZone>

            <div class="md-layout" v-show="localfiles.length">
              <md-list class="md-layout utility-transparentbg md-theme-default">
                <FilePreview v-for="file in localfiles" :key="file.id" :file="file" tag="div" classname="md-layout-item" @remove="removeFile" />
              </md-list>
            </div>
            <div class="md-layout">
                  <button type="submit" id="clear-files-btn"
                    class="md-layout-item md-size-40 btn--tertiary btn btn--noradius search_box_form_btn mid-first-li display-text u--margin-pos"
                    @click="clearAllFiles">
                    Clear Files
                  </button>
                  <button type="submit" class="md-layout-item md-size-40 btn btn--primary btn--noradius search_box_form_btn mid-first-li display-text u--margin-pos"
                    @click="setDone('first', 'second')">
                    Continue
                  </button>
                </div>
          </md-step>
          <md-step id="second" md-label="Upload selected spreadsheets">
            <div>Loading bars go here</div>
            <a @click="setDone('second', 'third')">Continue</a>
          </md-step>
          <md-step id="third" md-label="Verify data">
            User verifies data here
                <a @click="setDone('third', 'fourth')">Continue</a>
          </md-step>
          <md-step id="fourth" md-label="Confirm and submit">
            User confirms submission
            <a>Complete</a>
          </md-step>
        </md-steppers>
      </div>
    </div>
  </div>
</div>
</div>
</template>

<script>
import DropZone from '@/components/curate/FileDrop.vue'
import FilePreview from '@/components/curate/FilePreview.vue'
import LoginRequired from '@/components/LoginRequired.vue'
import useFileList from '@/modules/file-list'
const { files, addFiles, removeFile, clearAllFiles } = useFileList()

export default {
  name: 'SpreadsheetHome',
  components: {
    DropZone,
    FilePreview,
    LoginReq: LoginRequired
  },
  data () {
    return {
      auth: true,
      localfiles: files,
      active: 'first',
      first: false,
      second: false,
      third: false,
      fourth: false
    }
  },
  methods: {
    addFiles: addFiles,
    removeFile: removeFile,
    clearAllFiles: clearAllFiles,
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
