<template>
  <div class="u_width--max utility-bg_border-dark md-card-header u--b-rad">
    <label class="form-label md-subheading">
      <div class="u_margin-bottom-small" v-if="!updateControls">
        Begin by uploading your viscoelastic dataset or selecting from existing entries.
      </div>
      <div class="u_margin-bottom-small" v-else>
        Click reset below to clear all your selections and begin again.
      </div>
    </label>
    <!-- Control Panel (A/B: sidebar workflow) -->
    <div v-if="variant !== 'c'" class="search_box_form u_centralize_items">
      <div class="utility-margin-right viz-u-mgup-md viz-u-mgbottom-big">
        <div class="new-item-button-container" v-if="!updateControls">
          <button @click="openSidebar" class="btn btn--primary u--b-rad">
            Continue to Datafile Options
          </button>
          <div class="new-item-new-badge">New</div>
        </div>
        <div v-else title="Click to reset all your selections">
          <button @click="resetAll" class="btn btn--tertiary u_margin-right-small">Reset</button>
          <button v-if="!isSidebarOpen" @click="openSidebar" class="btn btn--primary">
            Open Sidebar
          </button>
          <button v-else @click="closeSidebar" class="btn btn--primary">Close Sidebar</button>
        </div>

        <!-- Sidebar -->
        <div v-if="isSidebarOpen" class="sidebar">
          <button
            class="md-fab md-fixed md-dense md-fab-top-right md-button btn--primary dialog-box_close"
            @click="closeSidebar"
          >
            <md-icon class="utility-navfonticon u--font-emph-xl">close</md-icon>
          </button>

          <!-- ==================== VARIANT B: Step 1 — Fitting Configuration ==================== -->
          <template v-if="variant === 'b' && stepper === 1">
            <h2 class="md-title metamine_footer-ref-header u_margin-bottom-small">
              Fitting Configuration
            </h2>
            <hr />

            <div class="metamine_footer-ref-header">
              <label for="domainSelect" class="md-body-2">Domain</label>
              <div class="u_display-flex u--layout-flex-column grid_gap-smaller">
                <select
                  id="domainSelect"
                  class="form__input form__input--adjust utility-padding-sm"
                  v-model="selectedProperty"
                >
                  <option value="select">Select Domain</option>
                  <option value="temperature">Temperature</option>
                  <option value="frequency">Frequency</option>
                </select>
              </div>
            </div>

            <hr class="dynamfit-separator" />

            <div class="metamine_footer-ref-header">
              <md-checkbox v-model="ttsp" class="u--layout-flex viz-u-mgup-sm viz-u-mgbottom-sm">
                ω-T Transformation
              </md-checkbox>
            </div>

            <!-- Shift-Factor Model -->
            <div v-if="ttsp" class="metamine_footer-ref-header">
              <label class="md-body-2">Shift-Factor Model</label>
              <div class="u--margin-neg">
                <md-radio id="transformMethodWLF" v-model="transformMethod" value="WLF">
                  WLF <small>(Default)</small>
                </md-radio>
                <md-radio id="transformMethodHybrid" v-model="transformMethod" value="hybrid">
                  Hybrid
                </md-radio>
              </div>

              <!-- Input method toggle -->
              <div v-if="transformMethod" class="u_margin-bottom-small">
                <div class="dynamfit-toggle">
                  <button
                    :class="[
                      'dynamfit-toggle__option',
                      inputMethod === 'enter' ? 'dynamfit-toggle__option--active' : '',
                    ]"
                    @click="inputMethod = 'enter'"
                  >
                    Enter values
                  </button>
                  <button
                    :class="[
                      'dynamfit-toggle__option',
                      inputMethod === 'upload' ? 'dynamfit-toggle__option--active' : '',
                    ]"
                    @click="inputMethod = 'upload'"
                  >
                    Upload file
                  </button>
                </div>
              </div>

              <!-- Coefficient fields (Enter values mode) -->
              <template v-if="transformMethod && inputMethod === 'enter'">
                <div class="u--layout-flex u--layout-flex-justify-sb" v-if="isWLF || isHybrid">
                  <md-field class="dynamfit-field--half">
                    <md-input
                      v-model="ttspTgValue"
                      name="ttspTgValue"
                      id="ttspTgValue"
                      placeholder="Tg"
                      :disabled="!ttsp || tgEstimated"
                    ></md-input>
                  </md-field>
                  <md-checkbox
                    :disabled="ttspDisabled"
                    v-model="tgEstimated"
                    class="u--layout-flex viz-u-mgup-sm viz-u-mgbottom-sm u_centralize_items"
                  >
                    Use Estimated Tg
                  </md-checkbox>
                </div>
                <div class="u--layout-flex u--layout-flex-justify-sb" v-if="isWLF || isHybrid">
                  <md-field class="dynamfit-field--half">
                    <md-input
                      v-model="ttspC1Value"
                      name="ttspC1Value"
                      id="ttspC1Value"
                      placeholder="C1"
                      :disabled="!ttsp || c1Estimated"
                    ></md-input>
                  </md-field>
                  <md-checkbox
                    :disabled="ttspDisabled"
                    v-model="c1Estimated"
                    class="u--layout-flex viz-u-mgup-sm viz-u-mgbottom-sm u_centralize_items"
                  >
                    Use Estimated C1
                  </md-checkbox>
                </div>
                <div class="u--layout-flex u--layout-flex-justify-sb" v-if="isWLF || isHybrid">
                  <md-field class="dynamfit-field--half">
                    <md-input
                      v-model="ttspC2Value"
                      name="ttspC2Value"
                      id="ttspC2Value"
                      placeholder="C2"
                      :disabled="!ttsp || c2Estimated"
                    ></md-input>
                  </md-field>
                  <md-checkbox
                    :disabled="ttspDisabled"
                    v-model="c2Estimated"
                    class="u--layout-flex viz-u-mgup-sm viz-u-mgbottom-sm u_centralize_items"
                  >
                    Use Estimated C2
                  </md-checkbox>
                </div>
                <div class="u--layout-flex u--layout-flex-justify-sb" v-if="isHybrid">
                  <md-field class="dynamfit-field--half">
                    <md-input
                      v-model="ttspTLValue"
                      name="ttspTLValue"
                      id="ttspTLValue"
                      placeholder="TL"
                      :disabled="!ttsp || tLEstimated"
                    ></md-input>
                  </md-field>
                  <md-checkbox
                    :disabled="ttspDisabled"
                    v-model="tLEstimated"
                    class="u--layout-flex viz-u-mgup-sm viz-u-mgbottom-sm u_centralize_items"
                  >
                    Use Estimated TL
                  </md-checkbox>
                </div>
                <div class="u--layout-flex u--layout-flex-justify-sb" v-if="isHybrid">
                  <md-field class="dynamfit-field--half">
                    <md-input
                      v-model="ttspEAValue"
                      name="ttspEAValue"
                      id="ttspEAValue"
                      placeholder="EA"
                      :disabled="!ttsp || eAEstimated"
                    ></md-input>
                  </md-field>
                  <md-checkbox
                    :disabled="ttspDisabled"
                    v-model="eAEstimated"
                    class="u--layout-flex viz-u-mgup-sm viz-u-mgbottom-sm u_centralize_items"
                  >
                    Use Estimated EA
                  </md-checkbox>
                </div>
              </template>
            </div>

            <div class="metamine_footer-ref-header u_display-flex u_centralize_content">
              <button
                @click="increaseStepper"
                class="btn btn--primary u--b-rad"
                :disabled="selectedProperty === 'select'"
              >
                Next
              </button>
            </div>
          </template>

          <!-- ==================== VARIANT A: Step 1 — Domain Only ==================== -->
          <template v-if="variant === 'a' && stepper === 1">
            <h2 class="md-title metamine_footer-ref-header u_margin-bottom-small">
              Next: Select Domain
            </h2>
            <hr />

            <div class="u_display-flex metamine_footer-ref-header u_centralize_content">
              <div class="u_display-flex u--layout-flex-column grid_gap-smaller utility-half-width">
                <select
                  class="form__input form__input--adjust utility-padding-sm"
                  v-model="selectedProperty"
                >
                  <option value="select">Select Domain</option>
                  <option value="temperature">Temperature</option>
                  <option value="frequency">Frequency</option>
                </select>
              </div>
            </div>
            <div class="metamine_footer-ref-header u_display-flex u_centralize_content">
              <button
                @click="increaseStepper"
                class="btn btn--primary u--b-rad"
                :disabled="selectedProperty === 'select'"
              >
                Next
              </button>
            </div>
          </template>

          <!-- ==================== VARIANT B: Step 2 — Shift File + Data Source ==================== -->
          <template v-if="variant === 'b' && stepper === 2">
            <h2 class="md-title metamine_footer-ref-header u_margin-bottom-small">
              Next: Choose how you'd like to provide viscoelastic data
            </h2>
            <hr />

            <!-- Shift file upload (when user chose "Upload file" toggle) -->
            <div v-if="needsShiftFile" class="metamine_footer-ref-header">
              <div class="dynamfit-shift-upload">
                <p class="dynamfit-shift-upload__label">
                  Upload a shift-factor file (2 columns: Temperature, a_T)
                </p>
                <template v-if="!mFile">
                  <div class="form__file-input">
                    <div class="md-theme-default">
                      <label class="btn btn--primary u--b-rad" for="Shift_Factor_File">
                        <p class="md-body-1">Upload Shift File</p>
                      </label>
                      <div class="md-file">
                        <input
                          @change="onShiftFileChange"
                          accept=".csv, .tsv, .txt"
                          type="file"
                          name="Shift_Factor_File"
                          id="Shift_Factor_File"
                        />
                      </div>
                    </div>
                  </div>
                </template>
                <template v-else>
                  <span class="md-caption md-success viz-u-display__show">{{ mFile }}</span>
                </template>
              </div>

              <!-- Reference temperature (required for fit-shift) -->
              <div class="u_margin-bottom-small">
                <md-field v-if="isWLF">
                  <md-input
                    v-model="ttspTgValue"
                    placeholder="Tg (required for WLF fitting)"
                  ></md-input>
                </md-field>
                <md-field v-if="isHybrid">
                  <md-input
                    v-model="ttspTLValue"
                    placeholder="TL (required for Hybrid fitting)"
                  ></md-input>
                </md-field>
              </div>
            </div>

            <!-- Upload File / Explore XML cards -->
            <div
              class="md-layout u--margin-toplg"
              :class="{ 'nuplot-masked': needsShiftFile && !mFile }"
            >
              <div class="md-layout-item">
                <div
                  id="dynamfit-card"
                  class="teams_container explorer_page-nav-card md-layout-item_card md-layout-item_card-short"
                  @click="handleCardClick('upload')"
                >
                  <md-icon class="icons" id="mm">cloud_upload</md-icon>
                  <span class="u--font-emph-l">Upload File</span>
                  <p class="u--font-emph-smm utility-padding-sm u_centralize_text">
                    Upload a compatible viscoelastic file
                    <em>(accepted formats: '.csv', '.tsv')</em>
                  </p>
                </div>
              </div>
              <div class="md-layout-item">
                <div
                  id="dynamfit-card"
                  class="teams_container explorer_page-nav-card md-layout-item_card md-layout-item_card-short"
                  @click="handleCardClick('explore')"
                >
                  <md-icon class="icons" id="mm">manage_search</md-icon>
                  <span class="u--font-emph-l">Explore Xml</span>
                  <p class="u--font-emph-smm utility-padding-sm u_centralize_text">
                    Browse existing entries from the XML repository
                  </p>
                </div>
              </div>
            </div>
            <div
              class="metamine_footer-ref-header u_display-flex u_centralize_content md-layout-item_card-btn"
            >
              <button @click="decreaseStepper" class="btn btn--primary u--b-rad">Back</button>
            </div>
          </template>

          <!-- ==================== VARIANT A: Step 2 — Data Source (no shift file) ==================== -->
          <template v-if="variant === 'a' && stepper === 2">
            <h2 class="md-title metamine_footer-ref-header u_margin-bottom-small">
              Next: Choose how you'd like to provide viscoelastic data
            </h2>
            <hr />

            <div class="md-layout u--margin-toplg">
              <div class="md-layout-item">
                <div
                  id="dynamfit-card"
                  class="teams_container explorer_page-nav-card md-layout-item_card md-layout-item_card-short"
                  @click="selectType('upload')"
                >
                  <md-icon class="icons" id="mm">cloud_upload</md-icon>
                  <span class="u--font-emph-l">Upload File</span>
                  <p class="u--font-emph-smm utility-padding-sm u_centralize_text">
                    Upload a compatible viscoelastic file
                    <em>(accepted formats: '.csv', '.tsv')</em>
                  </p>
                </div>
              </div>
              <div class="md-layout-item">
                <div
                  id="dynamfit-card"
                  class="teams_container explorer_page-nav-card md-layout-item_card md-layout-item_card-short"
                  @click="selectType('explore')"
                >
                  <md-icon class="icons" id="mm">manage_search</md-icon>
                  <span class="u--font-emph-l">Explore Xml</span>
                  <p class="u--font-emph-smm utility-padding-sm u_centralize_text">
                    Browse existing entries from the XML repository
                  </p>
                </div>
              </div>
            </div>
            <div
              class="metamine_footer-ref-header u_display-flex u_centralize_content md-layout-item_card-btn"
            >
              <button
                @click="decreaseStepper"
                class="btn btn--primary u--b-rad"
                :disabled="selectedProperty === 'select'"
              >
                Change Domain
              </button>
            </div>
          </template>

          <!-- ==================== SHARED A/B: Step 3 — Upload or Explore XML ==================== -->
          <template v-if="(variant === 'a' || variant === 'b') && stepper === 3">
            <template v-if="dataType === 'upload'">
              <h2 class="md-title metamine_footer-ref-header u_margin-bottom-small">
                Next: Upload
              </h2>
              <hr />

              <div class="search_box_form u_centralize_items">
                <div class="utility-margin-right viz-u-mgup-md viz-u-mgbottom-big">
                  <template v-if="!dynamfit.fileUpload">
                    <label for="Viscoelastic_Data" class="u--inline">
                      <div class="form__file-input">
                        <div class="md-theme-default">
                          <label class="btn btn--primary u--b-rad" for="Viscoelastic_Data">
                            <p class="md-body-1">Upload file</p>
                          </label>
                          <div class="md-file">
                            <input
                              @change="onInputChange"
                              accept=".csv, .tsv, .txt"
                              type="file"
                              name="Viscoelastic_Data"
                              id="Viscoelastic_Data"
                            />
                          </div>
                        </div>
                      </div>
                    </label>
                  </template>
                  <template v-else>
                    <button
                      class="md-button btn btn--tertiary btn--noradius"
                      @click.prevent="resetChart"
                    >
                      Reset
                    </button>
                    <span class="md-caption md-success viz-u-display__show">{{
                      dynamfit.fileUpload
                    }}</span>
                  </template>
                </div>
              </div>
            </template>

            <template v-else>
              <h2 class="md-title metamine_footer-ref-header u_margin-bottom-small">
                Next: Explore XML
              </h2>
              <hr />

              <div class="u_display-flex metamine_footer-ref-header u_centralize_content">
                <div
                  class="u_display-flex u--layout-flex-column grid_gap-smaller utility-half-width"
                >
                  <label>Response Limit</label>
                  <input
                    class="form__input form__input--adjust utility-padding-sm"
                    type="number"
                    v-model.number="limit"
                    min="1"
                  />
                </div>
              </div>
              <div class="metamine_footer-ref-header u_display-flex u_centralize_content">
                <button @click="search" class="btn btn--primary u--b-rad">Search</button>
              </div>

              <div
                v-if="optionalChaining(() => results?.xmls?.length) && !currentItem"
                class="metamine_footer-ref-header"
              >
                <h3 v-if="(results.counts ?? 0) > limit">
                  Results ({{ currentPage * limit }} of {{ results.counts ?? 0 }})
                </h3>
                <h3 v-else>Results ({{ currentPage }} of {{ results.counts ?? 0 }})</h3>
                <hr />
                <div class="list-container">
                  <div
                    v-for="item in results.xmls"
                    :key="item.id"
                    class="u_display-flex grid_gap-small u_margin-bottom-small"
                  >
                    <input type="radio" :id="item.id" :value="item" v-model="currentItem" />
                    <label :for="item.title">{{ item.title }}</label>
                  </div>
                </div>
                <Pagination
                  v-if="totalPages > 1 && !currentItem"
                  :cpage="currentPage"
                  :tpages="totalPages"
                  @go-to-page="goToPage"
                />
              </div>

              <div v-if="currentItem" class="metamine_footer-ref-header">
                <h3>
                  {{ currentItem.title }}
                  <span class="u--color-grey-sec u--margin-neg md-body-1"
                    >({{ currentItem.contains.length }} viscoelastic data)</span
                  >
                </h3>
                <hr />
                <div class="list-container">
                  <div
                    v-for="(item, index) in currentItem.contains"
                    :key="index"
                    class="u_display-flex grid_gap-small u_margin-bottom-small"
                  >
                    <input
                      type="radio"
                      :id="String(index)"
                      :value="{ ...item, index: index }"
                      v-model="selectedItemProperty"
                    />
                    <label :for="String(index)">
                      <span class="u_display-flex u--layout-flex-column">
                        <strong>Description:</strong> {{ item.property }}
                      </span>
                      <span class="u--color-grey-sec u--margin-neg md-body-1">
                        <strong>Table:</strong> {{ item.table }}
                      </span>
                    </label>
                  </div>
                </div>
                <button @click="goBack" class="select-btn btn btn--primary u--margin-rightlg">
                  Go Back
                </button>
                <button @click="handleSelect" class="select-btn btn btn--primary">Select</button>
              </div>
            </template>
          </template>
        </div>
      </div>
    </div>

    <!-- ==================== VARIANT C: Inline left-panel configuration ==================== -->
    <template v-if="variant === 'c'">
      <!-- Reset button when data loaded -->
      <div v-if="updateControls" class="u_margin-bottom-small">
        <button @click="resetAll" class="btn btn--tertiary">Reset</button>
      </div>

      <!-- Domain -->
      <div>
        <label for="cDomainSelect" class="md-body-2">Domain</label>
        <div class="md-field viz-u-mgbottom-big">
          <select id="cDomainSelect" class="form__select u--b-rad" v-model="selectedProperty">
            <option value="frequency">Frequency</option>
            <option value="temperature">Temperature</option>
          </select>
        </div>
      </div>

      <!-- Data Source (collapsible, hidden until domain selected) -->
      <div v-if="selectedProperty !== 'select'" class="viz-u-mgbottom-sm">
        <div
          class="u_pointer"
          style="display: flex; align-items: center; width: 100%"
          @click="cDataSourceOpen = !cDataSourceOpen"
        >
          <label class="md-body-2 u_pointer">Data Source</label>
          <md-icon style="margin-left: auto; margin-right: 0">{{
            cDataSourceOpen ? 'expand_less' : 'expand_more'
          }}</md-icon>
        </div>
        <template v-if="cDataSourceOpen">
          <!-- Compact source buttons when no dataType selected -->
          <template v-if="!dataType">
            <div class="dynamfit-source-grid u_margin-bottom-small">
              <button class="dynamfit-source-btn" @click="cSelectSource('upload')">
                <md-icon style="margin-left: 0; margin-right: 0.25rem">cloud_upload</md-icon>
                Upload File
              </button>
              <button class="dynamfit-source-btn" @click="cSelectSource('explore')">
                <md-icon style="margin-left: 0; margin-right: 0.25rem">manage_search</md-icon>
                Explore XML
              </button>
            </div>
            <div class="dynamfit-source-grid u_margin-bottom-small">
              <button class="dynamfit-source-btn" @click="cSelectSource('popular')">
                <md-icon style="margin-left: 0; margin-right: 0.25rem">star</md-icon>
                Popular Polymer
              </button>
              <button class="dynamfit-source-btn" @click="cSelectSource('surprise')">
                <md-icon style="margin-left: 0; margin-right: 0.25rem">shuffle</md-icon>
                Surprise Me
              </button>
            </div>
          </template>

          <!-- Upload sub-panel -->
          <template v-if="dataType === 'upload'">
            <div class="dynamfit-shift-upload">
              <p class="dynamfit-shift-upload__label">
                Upload a viscoelastic data file (CSV, TSV, or TXT)
              </p>
              <template v-if="!dynamfit.fileUpload">
                <div class="form__file-input">
                  <div class="md-theme-default">
                    <label class="btn btn--primary u--b-rad" for="C_Viscoelastic_Data">
                      <p class="md-body-1">Upload File</p>
                    </label>
                    <div class="md-file">
                      <input
                        @change="onInputChange"
                        accept=".csv, .tsv, .txt"
                        type="file"
                        name="C_Viscoelastic_Data"
                        id="C_Viscoelastic_Data"
                      />
                    </div>
                  </div>
                </div>
              </template>
              <template v-else>
                <span class="md-caption md-success viz-u-display__show">{{
                  dynamfit.fileUpload
                }}</span>
              </template>
            </div>
            <div class="u_display-flex u_centralize_content">
              <button @click="cGoBackToMain" class="btn btn--primary u--b-rad">Back</button>
            </div>
          </template>

          <!-- Popular Polymer sub-panel -->
          <template v-if="dataType === 'popular'">
            <label class="md-body-2">Select a polymer data file</label>
            <div class="dynamfit-polymer-grid">
              <div
                v-for="(file, i) in popularPolymerFiles"
                :key="file.path"
                class="dynamfit-polymer-grid__item"
              >
                <md-radio v-model="selectedPolymerFile" :value="file.path">
                  {{ file.label }}
                </md-radio>
              </div>
            </div>
            <div class="u_display-flex u_centralize_content" style="gap: 0.5rem">
              <button @click="cGoBackToMain" class="btn btn--tertiary u--b-rad">Back</button>
              <button
                :disabled="!selectedPolymerFile"
                :class="{ disabled: !selectedPolymerFile }"
                class="btn btn--primary u--b-rad"
                @click="loadPopularPolymer"
              >
                Load
              </button>
            </div>
          </template>

          <!-- Explore sub-panel -->
          <template v-if="dataType === 'explore'">
            <div class="u_display-flex u_centralize_content u_margin-bottom-small">
              <div class="u_display-flex u--layout-flex-column grid_gap-smaller utility-half-width">
                <label>Response Limit</label>
                <input
                  class="form__input form__input--adjust utility-padding-sm"
                  type="number"
                  v-model.number="limit"
                  min="1"
                />
              </div>
            </div>
            <div
              class="u_display-flex u_centralize_content u_margin-bottom-small"
              style="gap: 0.5rem"
            >
              <button
                @click="cGoBackToMain"
                v-if="!optionalChaining(() => results?.xmls?.length)"
                class="btn btn--tertiary u--b-rad"
              >
                Back
              </button>
              <button @click="search" class="btn btn--primary u--b-rad">Search</button>
            </div>

            <div v-if="optionalChaining(() => results?.xmls?.length) && !currentItem">
              <h3 v-if="(results.counts ?? 0) > limit">
                Results ({{ currentPage * limit }} of {{ results.counts ?? 0 }})
              </h3>
              <h3 v-else>Results ({{ currentPage }} of {{ results.counts ?? 0 }})</h3>
              <hr />
              <div class="list-container">
                <div
                  v-for="item in results.xmls"
                  :key="item.id"
                  class="u_display-flex grid_gap-small u_margin-bottom-small"
                >
                  <input type="radio" :id="'c_' + item.id" :value="item" v-model="currentItem" />
                  <label :for="'c_' + item.id">{{ item.title }}</label>
                </div>
              </div>
              <Pagination
                v-if="totalPages > 1 && !currentItem"
                :cpage="currentPage"
                :tpages="totalPages"
                @go-to-page="goToPage"
              />
            </div>

            <div v-if="currentItem">
              <h3>
                {{ currentItem.title }}
                <span class="u--color-grey-sec u--margin-neg md-body-1"
                  >({{ currentItem.contains.length }} viscoelastic data)</span
                >
              </h3>
              <hr />
              <div class="list-container">
                <div
                  v-for="(item, index) in currentItem.contains"
                  :key="'c_' + index"
                  class="u_display-flex grid_gap-small u_margin-bottom-small"
                >
                  <input
                    type="radio"
                    :id="'c_prop_' + index"
                    :value="{ ...item, index: index }"
                    v-model="selectedItemProperty"
                  />
                  <label :for="'c_prop_' + index">
                    <span class="u_display-flex u--layout-flex-column">
                      <strong>Description:</strong> {{ item.property }}
                    </span>
                    <span class="u--color-grey-sec u--margin-neg md-body-1">
                      <strong>Table:</strong> {{ item.table }}
                    </span>
                  </label>
                </div>
              </div>
              <button @click="goBack" class="select-btn btn btn--primary u--margin-rightlg">
                Go Back
              </button>
              <button @click="handleSelect" class="select-btn btn btn--primary">Select</button>
            </div>

            <div
              v-if="optionalChaining(() => results?.xmls?.length)"
              class="u_display-flex u_centralize_content"
            >
              <button @click="cGoBackToMain" class="btn btn--primary u--b-rad">Back</button>
            </div>
          </template>
        </template>
      </div>
    </template>

    <!-- Fitting Method -->
    <!-- <div>
      <label for="model" class="md-body-2">Select Fitting Method</label>
      <div class="md-field viz-u-mgbottom-big">
        <select
          :disabled="disableInput"
          v-model="dynamfit.model"
          :class="[disableInput ? 'nuplot-masked' : '', 'form__select u--b-rad']"
          name="model"
          id="model"
        >
          <option value="Linear">Linear</option>
          <option value="LASSO">LASSO</option>
          <option value="Ridge">Ridge</option>
        </select>
      </div>
    </div> -->

    <!-- Prony Terms Slider -->
    <div
      v-if="
        !disableInput && (variant !== 'c' || selectedProperty !== 'temperature' || cTtspApplied)
      "
      class="viz-u-mgbottom-sm"
    >
      <label for="prony" class="md-body-2">
        Select Number of Prony Terms <span>[{{ dynamfit.range }}]</span>
      </label>
      <div class="nuplot-range-slider u--margin-centered u_centralize_text viz-u-postion__rel">
        <input
          :disabled="disableInput"
          @mouseenter="showToolTip = true"
          @mouseleave="showToolTip = false"
          name="prony"
          v-model.lazy.number="dynamfit.range"
          type="range"
          min="1"
          max="100"
          :class="[disableInput ? 'nuplot-masked' : '']"
          class="nuplot-range-slider u--layout-width u--margin-centered u_centralize_text viz-u-postion__abs utility-transparentbg"
        />
        <div
          :style="{ left: `${dynamfit.range - 5}` }"
          v-if="showToolTip"
          class="u_margin-top-med viz-u-display__show nuplot-slider-tooltip"
          id="parame-selector-slider-id"
        >
          {{ dynamfit.range }}
        </div>
      </div>
      <div class="u--layout-flex u--layout-flex-justify-sb u--color-grey-sec">
        <div>0</div>
        <div>100</div>
      </div>
    </div>

    <!-- ==================== VARIANT A: Smoothness/RelError + Additional Settings ==================== -->
    <template v-if="variant === 'a'">
      <!-- Smoothness + Relative Error (above Additional Settings) -->
      <div class="viz-u-mgbottom-sm">
        <div class="u--layout-flex u--layout-flex-justify-sb grid_gap-small">
          <div class="u_display-flex u--layout-flex-column grid_gap-smaller">
            <label for="smoothness" class="md-body-2">Smoothness</label>
            <input
              :disabled="disableInput"
              v-model.number="smoothness"
              :class="[disableInput ? 'nuplot-masked' : '', 'form__input form__input--flat']"
              type="number"
              name="smoothness"
              id="smoothness"
              min="0"
              max="10"
              step="0.1"
              placeholder="0"
            />
          </div>
          <div class="u_display-flex u--layout-flex-column grid_gap-smaller">
            <label for="relativeError" class="md-body-2">Relative Error</label>
            <input
              :disabled="disableInput"
              v-model.number="relativeError"
              :class="[disableInput ? 'nuplot-masked' : '', 'form__input form__input--flat']"
              type="number"
              name="relativeError"
              id="relativeError"
              min="0"
              max="2"
              step="0.1"
              placeholder="0.2"
            />
          </div>
        </div>
      </div>

      <!-- Additional Settings -->
      <div style="margin-bottom: 0.5rem">
        <label for="fitSettings" class="md-body-2">Additional Settings</label>
        <div class="u--layout-flex u--layout-flex-justify-sb">
          <md-checkbox v-model="ttsp" class="u--layout-flex viz-u-mgup-sm viz-u-mgbottom-sm">
            ω-T Transformation
          </md-checkbox>
          <!-- <md-checkbox
            :disabled="disableInput"
            v-model="dynamfit.fitSettings"
            :class="[
              disableInput ? 'nuplot-masked' : '',
              'u--layout-flex viz-u-mgup-sm viz-u-mgbottom-sm',
            ]"
          >
            Show Basis Functions
          </md-checkbox> -->
        </div>
      </div>

      <!-- Transform Method (when ω-T enabled) -->
      <div v-if="ttsp" class="utility-margin-top u_margin-bottom-small">
        <label for="transformMethods" class="md-body-2">Transform Method:</label>
        <div class="u--margin-neg" id="transformMethods">
          <md-radio id="transformMethodWLF" v-model="transformMethod" value="WLF">
            WLF <small>(Default)</small>
          </md-radio>
          <md-radio id="transformMethodHybrid" v-model="transformMethod" value="hybrid">
            Hybrid
          </md-radio>
          <md-radio id="transformMethodManual" v-model="transformMethod" value="manual">
            Manual
          </md-radio>
        </div>

        <!-- Manual file info -->
        <div v-if="isManual" class="md-alert md-alert--info utility-margin-top">
          <md-icon class="md-alert-icon u--color-primary u_margin-right-small">info</md-icon>
          <span class="md-alert-content" v-if="mFile">
            <strong>Filename:</strong> {{ reduceDescription(mFile, 15, true) }}
          </span>
          <span class="md-alert-content" v-else>
            <strong>Filename:</strong> No file uploaded yet.
          </span>
        </div>

        <!-- Coefficient fields (WLF / Hybrid) -->
        <div class="u--layout-flex u--layout-flex-justify-sb" v-if="isWLF || isHybrid">
          <md-field style="max-width: 40% !important">
            <md-input
              v-model="ttspTgValue"
              name="ttspTgValue"
              id="ttspTgValueA"
              placeholder="Tg"
              :disabled="!ttsp || tgEstimated"
            ></md-input>
          </md-field>
          <md-checkbox
            :disabled="ttspDisabled"
            v-model="tgEstimated"
            class="u--layout-flex viz-u-mgup-sm viz-u-mgbottom-sm"
            style="align-items: center"
          >
            Use Estimated Tg
          </md-checkbox>
        </div>
        <div class="u--layout-flex u--layout-flex-justify-sb" v-if="isWLF || isHybrid">
          <md-field style="max-width: 40% !important">
            <md-input
              v-model="ttspC1Value"
              name="ttspC1Value"
              id="ttspC1ValueA"
              placeholder="C1"
              :disabled="!ttsp || c1Estimated"
            ></md-input>
          </md-field>
          <md-checkbox
            :disabled="ttspDisabled"
            v-model="c1Estimated"
            class="u--layout-flex viz-u-mgup-sm viz-u-mgbottom-sm"
            style="align-items: center"
          >
            Use Estimated C1
          </md-checkbox>
        </div>
        <div class="u--layout-flex u--layout-flex-justify-sb" v-if="isWLF || isHybrid">
          <md-field style="max-width: 40% !important">
            <md-input
              v-model="ttspC2Value"
              name="ttspC2Value"
              id="ttspC2ValueA"
              placeholder="C2"
              :disabled="!ttsp || c2Estimated"
            ></md-input>
          </md-field>
          <md-checkbox
            :disabled="ttspDisabled"
            v-model="c2Estimated"
            class="u--layout-flex viz-u-mgup-sm viz-u-mgbottom-sm"
            style="align-items: center"
          >
            Use Estimated C2
          </md-checkbox>
        </div>
        <div class="u--layout-flex u--layout-flex-justify-sb" v-if="isHybrid">
          <md-field style="max-width: 40% !important">
            <md-input
              v-model="ttspTLValue"
              name="ttspTLValue"
              id="ttspTLValueA"
              placeholder="TL"
              :disabled="!ttsp || tLEstimated"
            ></md-input>
          </md-field>
          <md-checkbox
            :disabled="ttspDisabled"
            v-model="tLEstimated"
            class="u--layout-flex viz-u-mgup-sm viz-u-mgbottom-sm"
            style="align-items: center"
          >
            Use Estimated TL
          </md-checkbox>
        </div>
        <div class="u--layout-flex u--layout-flex-justify-sb" v-if="isHybrid">
          <md-field style="max-width: 40% !important">
            <md-input
              v-model="ttspEAValue"
              name="ttspEAValue"
              id="ttspEAValueA"
              placeholder="EA"
              :disabled="!ttsp || eAEstimated"
            ></md-input>
          </md-field>
          <md-checkbox
            :disabled="ttspDisabled"
            v-model="eAEstimated"
            class="u--layout-flex viz-u-mgup-sm viz-u-mgbottom-sm"
            style="align-items: center"
          >
            Use Estimated EA
          </md-checkbox>
        </div>
      </div>
    </template>

    <!-- ==================== VARIANT B: Collapsible Additional Settings ==================== -->
    <template v-if="variant === 'b'">
      <div class="viz-u-mgbottom-sm">
        <div
          class="u--layout-flex u--layout-flex-justify-fs u_centralize_items u_pointer"
          @click="additionalSettingsOpen = !additionalSettingsOpen"
        >
          <label class="md-body-2 u_pointer">Additional Settings</label>
          <md-icon>{{ additionalSettingsOpen ? 'expand_less' : 'expand_more' }}</md-icon>
        </div>
        <template v-if="additionalSettingsOpen">
          <!-- <md-checkbox
            :disabled="disableInput"
            v-model="dynamfit.fitSettings"
            :class="[
              disableInput ? 'nuplot-masked' : '',
              'u--layout-flex viz-u-mgup-sm viz-u-mgbottom-sm',
            ]"
          >
            Show Basis Functions
          </md-checkbox> -->
          <div class="u--layout-flex u--layout-flex-justify-sb grid_gap-small">
            <div class="u_display-flex u--layout-flex-column grid_gap-smaller">
              <label for="smoothness" class="md-body-2">Smoothness</label>
              <input
                :disabled="disableInput"
                v-model.number="smoothness"
                :class="[disableInput ? 'nuplot-masked' : '', 'form__input form__input--flat']"
                type="number"
                name="smoothness"
                id="smoothnessB"
                min="0"
                max="10"
                step="0.1"
                placeholder="0"
              />
            </div>
            <div class="u_display-flex u--layout-flex-column grid_gap-smaller">
              <label for="relativeError" class="md-body-2">Relative Error</label>
              <input
                :disabled="disableInput"
                v-model.number="relativeError"
                :class="[disableInput ? 'nuplot-masked' : '', 'form__input form__input--flat']"
                type="number"
                name="relativeError"
                id="relativeErrorB"
                min="0"
                max="2"
                step="0.1"
                placeholder="0.2"
              />
            </div>
          </div>
        </template>
      </div>

      <!-- a_T_ref read-only display -->
      <div v-if="shiftCoefficients.a_T_ref !== null" class="u_margin-bottom-small">
        <div class="dynamfit-readonly">
          <span class="dynamfit-readonly__label">a_T_ref:</span>
          <span class="dynamfit-readonly__value">{{ shiftCoefficients.a_T_ref }}</span>
        </div>
      </div>

      <!-- Shift file name display -->
      <div v-if="mFile" class="md-alert md-alert--info utility-margin-top">
        <md-icon class="md-alert-icon u--color-primary u_margin-right-small">info</md-icon>
        <span class="md-alert-content">
          <strong>Shift File:</strong> {{ reduceDescription(mFile, 15, true) }}
        </span>
      </div>
    </template>

    <!-- ==================== VARIANT C: Smoothness/RelError + Show Basis Functions ==================== -->
    <template v-if="variant === 'c'">
      <div class="viz-u-mgbottom-sm">
        <div
          v-if="selectedProperty !== 'temperature' || cTtspApplied"
          class="u--layout-flex u--layout-flex-justify-sb grid_gap-small u_margin-bottom-small"
        >
          <div class="u_display-flex u--layout-flex-column grid_gap-smaller">
            <label for="smoothnessC" class="md-body-2">Smoothness</label>
            <input
              :disabled="disableInput"
              v-model.number="smoothness"
              :class="[disableInput ? 'nuplot-masked' : '', 'form__input form__input--flat']"
              type="number"
              name="smoothness"
              id="smoothnessC"
              min="0"
              max="10"
              step="0.1"
              placeholder="0"
            />
          </div>
          <div class="u_display-flex u--layout-flex-column grid_gap-smaller">
            <label for="relativeErrorC" class="md-body-2">Relative Error</label>
            <input
              :disabled="disableInput"
              v-model.number="relativeError"
              :class="[disableInput ? 'nuplot-masked' : '', 'form__input form__input--flat']"
              type="number"
              name="relativeError"
              id="relativeErrorC"
              min="0"
              max="2"
              step="0.1"
              placeholder="0.2"
            />
          </div>
        </div>
        <div
          v-if="cTtspVisible"
          style="display: flex; justify-content: space-between; align-items: center"
        >
          <md-checkbox v-model="ttsp" class="u--layout-flex viz-u-mgup-sm viz-u-mgbottom-sm">
            ω-T Transformation
          </md-checkbox>
          <!-- <md-checkbox
            :disabled="disableInput"
            v-model="dynamfit.fitSettings"
            :class="[
              disableInput ? 'nuplot-masked' : '',
              'u--layout-flex viz-u-mgup-sm viz-u-mgbottom-sm',
            ]"
          >
            Show Basis Functions
          </md-checkbox> -->
        </div>

        <!-- ω-T config (expands when checkbox is checked) -->
        <template v-if="ttsp">
          <div
            class="u_pointer"
            style="display: flex; align-items: center; width: 100%; margin-top: 1rem"
            @click="cShiftModelOpen = !cShiftModelOpen"
          >
            <label class="md-body-2 u_pointer">Shift-Factor Model</label>
            <md-icon style="margin-left: auto; margin-right: 0">{{
              cShiftModelOpen ? 'expand_less' : 'expand_more'
            }}</md-icon>
          </div>
          <template v-if="cShiftModelOpen">
            <div class="u--margin-neg">
              <md-radio id="cTransformMethodWLF" v-model="transformMethod" value="WLF">
                WLF <small>(Default)</small>
              </md-radio>
              <md-radio id="cTransformMethodHybrid" v-model="transformMethod" value="hybrid">
                Hybrid
              </md-radio>
              <md-radio id="cTransformMethodManual" v-model="transformMethod" value="manual">
                Manual
              </md-radio>
            </div>

            <!-- Manual file info -->
            <div v-if="isManual" class="md-alert md-alert--info utility-margin-top">
              <md-icon class="md-alert-icon u--color-primary u_margin-right-small">info</md-icon>
              <span class="md-alert-content" v-if="mFile">
                <strong>Filename:</strong> {{ reduceDescription(mFile, 15, true) }}
              </span>
              <span class="md-alert-content" v-else>
                <strong>Filename:</strong> No file uploaded yet.
              </span>
            </div>

            <!-- Coefficient fields (WLF / Hybrid) -->
            <template v-if="isWLF || isHybrid">
              <div class="u--layout-flex u--layout-flex-justify-sb">
                <md-field class="dynamfit-field--half">
                  <md-input
                    v-model="ttspTgValue"
                    placeholder="Tg"
                    :disabled="!ttsp || tgEstimated"
                  ></md-input>
                </md-field>
                <md-checkbox
                  :disabled="ttspDisabled"
                  v-model="tgEstimated"
                  class="u--layout-flex viz-u-mgup-sm viz-u-mgbottom-sm u_centralize_items"
                >
                  Use Estimated Tg
                </md-checkbox>
              </div>
              <div class="u--layout-flex u--layout-flex-justify-sb">
                <md-field class="dynamfit-field--half">
                  <md-input
                    v-model="ttspC1Value"
                    placeholder="C1"
                    :disabled="!ttsp || c1Estimated"
                  ></md-input>
                </md-field>
                <md-checkbox
                  :disabled="ttspDisabled"
                  v-model="c1Estimated"
                  class="u--layout-flex viz-u-mgup-sm viz-u-mgbottom-sm u_centralize_items"
                >
                  Use Estimated C1
                </md-checkbox>
              </div>
              <div class="u--layout-flex u--layout-flex-justify-sb">
                <md-field class="dynamfit-field--half">
                  <md-input
                    v-model="ttspC2Value"
                    placeholder="C2"
                    :disabled="!ttsp || c2Estimated"
                  ></md-input>
                </md-field>
                <md-checkbox
                  :disabled="ttspDisabled"
                  v-model="c2Estimated"
                  class="u--layout-flex viz-u-mgup-sm viz-u-mgbottom-sm u_centralize_items"
                >
                  Use Estimated C2
                </md-checkbox>
              </div>
              <div class="u--layout-flex u--layout-flex-justify-sb" v-if="isHybrid">
                <md-field class="dynamfit-field--half">
                  <md-input
                    v-model="ttspTLValue"
                    placeholder="TL"
                    :disabled="!ttsp || tLEstimated"
                  ></md-input>
                </md-field>
                <md-checkbox
                  :disabled="ttspDisabled"
                  v-model="tLEstimated"
                  class="u--layout-flex viz-u-mgup-sm viz-u-mgbottom-sm u_centralize_items"
                >
                  Use Estimated TL
                </md-checkbox>
              </div>
              <div class="u--layout-flex u--layout-flex-justify-sb" v-if="isHybrid">
                <md-field class="dynamfit-field--half">
                  <md-input
                    v-model="ttspEAValue"
                    placeholder="EA"
                    :disabled="!ttsp || eAEstimated"
                  ></md-input>
                </md-field>
                <md-checkbox
                  :disabled="ttspDisabled"
                  v-model="eAEstimated"
                  class="u--layout-flex viz-u-mgup-sm viz-u-mgbottom-sm u_centralize_items"
                >
                  Use Estimated EA
                </md-checkbox>
              </div>
            </template>

            <!-- Shift file upload (Manual only) -->
            <template v-if="isManual">
              <div class="dynamfit-shift-upload">
                <p class="dynamfit-shift-upload__label">
                  Upload a shift-factor file (2 columns: Temperature, a_T)
                </p>
                <template v-if="!mFile">
                  <div class="form__file-input">
                    <div class="md-theme-default">
                      <label class="btn btn--primary u--b-rad" for="C_Shift_Factor_File">
                        <p class="md-body-1">Upload Shift File</p>
                      </label>
                      <div class="md-file">
                        <input
                          @change="onShiftFileChange"
                          accept=".csv, .tsv, .txt"
                          type="file"
                          name="C_Shift_Factor_File"
                          id="C_Shift_Factor_File"
                        />
                      </div>
                    </div>
                  </div>
                </template>
                <template v-else>
                  <span class="md-caption md-success viz-u-display__show">{{ mFile }}</span>
                </template>
              </div>
            </template>
          </template>
        </template>
      </div>

      <!-- a_T_ref read-only display -->
      <div v-if="shiftCoefficients.a_T_ref !== null" class="u_margin-bottom-small">
        <div class="dynamfit-readonly">
          <span class="dynamfit-readonly__label">a_T_ref:</span>
          <span class="dynamfit-readonly__value">{{ shiftCoefficients.a_T_ref }}</span>
        </div>
      </div>

      <!-- Shift file name display -->
      <div v-if="mFile" class="md-alert md-alert--info utility-margin-top">
        <md-icon class="md-alert-icon u--color-primary u_margin-right-small">info</md-icon>
        <span class="md-alert-content">
          <strong>Shift File:</strong> {{ reduceDescription(mFile, 15, true) }}
        </span>
      </div>
    </template>

    <!-- Use Sample / Download Template -->
    <div class="grid grid_col-2">
      <div>
        <a
          v-if="!dynamfit.fileUpload.length"
          class="btn-text btn--noradius"
          href="#"
          @click="useSampleFile"
        >
          <span class="md-body-1">Use Sample</span>
        </a>
        <a
          v-else
          class="btn-text btn--noradius"
          :class="{ disabled: !updateBtn }"
          href="#"
          @click="handleUpdate"
        >
          <span class="md-body-1">Update</span>
        </a>
        <span v-if="!dynamfit.fileUpload.length">
          <md-icon class="u_superscript-icon utility-color" :title="sampleTitle()">
            help_outline
          </md-icon>
        </span>
      </div>
      <div class="utility-align--right">
        <a class="btn-text btn--noradius" href="/dynamfit-template.tsv" download>
          <span class="md-body-1">Download Template</span>
        </a>
        <span>
          <md-icon class="u_superscript-icon utility-color" :title="downloadTitle()">
            help_outline
          </md-icon>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { useStore } from 'vuex';
import { useOptionalChaining } from '@/composables';
import { useReduce } from '@/composables/useReduce';
import { useDynamfitVariant } from '@/composables/useDynamfitVariant';
import Pagination from '@/components/explorer/Pagination.vue';

defineOptions({
  name: 'ChartSetting',
});

interface XmlItem {
  id: string;
  title: string;
  contains: Array<{
    property: string;
    table: string;
  }>;
}

interface SearchResults {
  xmls?: XmlItem[];
  counts?: number;
}

interface SelectedItemProperty {
  property: string;
  table: string;
  index: number;
}

const { optionalChaining } = useOptionalChaining();
const { reduceDescription } = useReduce();
const store = useStore();
const { variant } = useDynamfitVariant();

// Reactive state
const showToolTip = ref(false);
const isTemp = ref(true);
const useSample = ref(false);
const isSidebarOpen = ref(false);
const selectedProperty = ref(variant.value === 'c' ? 'frequency' : 'select');
const limit = ref(2);
const results = ref<SearchResults>({});
const currentItem = ref<XmlItem | null>(null);
const selectedItemProperty = ref<SelectedItemProperty | null>(null);
const currentPage = ref(1);
const totalPages = ref(0);
const stepper = ref(1);
const dataType = ref<string | undefined>(undefined);
const ttsp = ref(false);
const transformMethod = ref('');
const inputMethod = ref<'enter' | 'upload'>('enter');
const ttspTgValue = ref(null);
const tgEstimated = ref(false);
const ttspC1Value = ref(null);
const c1Estimated = ref(false);
const ttspC2Value = ref(null);
const c2Estimated = ref(false);
const ttspTLValue = ref(null);
const ttspEAValue = ref(null);
const tLEstimated = ref(false);
const eAEstimated = ref(false);
const additionalSettingsOpen = ref(false);
const cDataSourceOpen = ref(false);
const smoothness = ref<number>(0.1);
const relativeError = ref<number>(0.2);
const sentRequest = ref(false);
const updateBtn = ref(false);
const cTtspApplied = ref(false);
const cTtspVisible = ref(true);
const cShiftModelOpen = ref(true);
const selectedPolymerFile = ref('');

const allPolymerFiles = [
  {
    path: '/docs/dynamfit/agilus30-20C_mastercurve.tsv',
    label: 'Agilus30 (20°C)',
    domain: 'frequency',
  },
  {
    path: '/docs/dynamfit/dgeba-ipd-wide-bar-170C_mastercurve.tsv',
    label: 'DGEBA-IPD Wide Bar (170°C)',
    domain: 'frequency',
  },
  {
    path: '/docs/dynamfit/PETMP-TATATO-OLD-wide-bar-55C_mastercurve.tsv',
    label: 'PETMP-TATATO Wide Bar (55°C)',
    domain: 'frequency',
  },
  {
    path: '/docs/dynamfit/VeroCyan-80C_mastercurve.tsv',
    label: 'VeroCyan (80°C)',
    domain: 'frequency',
  },
  {
    path: '/docs/dynamfit/polystyrene-260kDa-100C_mastercurve.tsv',
    label: 'Polystyrene 260kDa (100°C)',
    domain: 'frequency',
  },
  {
    path: '/docs/dynamfit/agilus30-1Hz_temp.tsv',
    label: 'Agilus30 (1Hz)',
    domain: 'temperature',
  },
  {
    path: '/docs/dynamfit/dgeba-ipd-wide-bar-1Hz_temp.tsv',
    label: 'DGEBA-IPD Wide Bar (1Hz)',
    domain: 'temperature',
  },
  {
    path: '/docs/dynamfit/PETMP-TATATO-OLD-wide-bar-1Hz_temp.tsv',
    label: 'PETMP-TATATO Wide Bar (1Hz)',
    domain: 'temperature',
  },
  {
    path: '/docs/dynamfit/VeroCyan-1Hz_temp.tsv',
    label: 'VeroCyan (1Hz)',
    domain: 'temperature',
  },
];

const popularPolymerFiles = computed(() =>
  allPolymerFiles.filter((f) => f.domain === selectedProperty.value)
);
const skipCoeffWatcher = ref(false);
let coeffDebounceTimer: ReturnType<typeof setTimeout> | null = null;

// Computed
const token = computed(() => store.getters['auth/token']);
const dynamfit = computed(() => store.getters['explorer/dynamfit']);
const mFile = computed(() => store.getters['explorer/getDynamfitManualFile']);
const shiftCoefficients = computed(() => store.getters['explorer/getDynamfitShiftCoefficients']);

const disableInput = computed(() => {
  return !dynamfitData.value || !Object.keys(dynamfitData.value).length;
});

const dynamfitData = computed(() => {
  return store.getters['explorer/getDynamfitData'];
});

const updateControls = computed(() => {
  return !!dynamfit.value?.fileUpload || !!results.value?.xmls?.length;
});

const ttspDisabled = computed(() => {
  return false;
});

const isWLF = computed(() => {
  return ttsp.value && transformMethod.value === 'WLF';
});

const isHybrid = computed(() => {
  return ttsp.value && transformMethod.value === 'hybrid';
});

const isManual = computed(() => {
  return ttsp.value && transformMethod.value === 'manual';
});

const needsShiftFile = computed(() => {
  return ttsp.value && (isWLF.value || isHybrid.value) && inputMethod.value === 'upload';
});

// Methods
const resetAll = (): void => {
  closeSidebar();
  resetChart();
  selectedProperty.value = 'select';
  currentItem.value = null;
  selectedItemProperty.value = null;
  currentPage.value = 1;
  totalPages.value = 0;
  results.value = {};
  stepper.value = 1;
  dataType.value = undefined;
  inputMethod.value = 'enter';
  transformMethod.value = '';
  ttsp.value = false;
  smoothness.value = 0.1;
  relativeError.value = 0.2;
  store.commit('explorer/setDynamfitManualFile', '');
  store.commit('explorer/resetDynamfitShiftCoefficients');
  cTtspApplied.value = false;
  cTtspVisible.value = true;
  cShiftModelOpen.value = true;
  selectedPolymerFile.value = '';
  store.commit('explorer/setDynamfitSourceType', '');
};

const selectType = (type: string): void => {
  stepper.value = 3;
  dataType.value = type;
};

const handleCardClick = (type: string): void => {
  if (needsShiftFile.value && !mFile.value) {
    displayInfo('Please upload a shift-factor file first');
    return;
  }
  selectType(type);
};

const increaseStepper = (): void => {
  stepper.value++;
};

const decreaseStepper = (): void => {
  stepper.value--;
};

const sampleTitle = (): string => {
  return dynamfit.value.fileUpload.length
    ? `An example set of E', E" data for PMMA which can be used to explore the Prony Series fitting and conversion tool.`
    : `Click to resubmit your changes`;
};

const downloadTitle = (): string => {
  return `An example tsv file of 3 columns containing: frequency, E', E"; no header row. Format your data as this template then 'upload file' to use the Prony Series fitting and conversion tool.`;
};

const onInputChange = async (e: Event): Promise<void> => {
  useSample.value = false;
  displayInfo('Uploading File...');
  const target = e.target as HTMLInputElement;
  const file = [...(target?.files || [])];
  const allowedTypes = ['csv', 'tsv', 'tab-separated-values', 'plain'];
  try {
    const extension = file[0]?.type?.replace(/(.*)\//, '') || file[0]?.name.split('.').pop();
    if (!extension || !allowedTypes.includes(extension)) {
      return displayInfo('Unsupported file format');
    }
    const { fileName } = await store.dispatch('uploadFile', {
      file,
      isTemp: isTemp.value,
    });
    if (fileName) {
      dynamfit.value.fileUpload = fileName;
      store.commit('explorer/setDynamfitSourceType', 'upload');
      displayInfo('Upload Successful', 1500);
    }
  } catch (err) {
    const error = err as Error;
    store.commit('setSnackbar', {
      message: error?.message || 'Something went wrong',
      action: () => onInputChange(e),
    });
  }
};

const onShiftFileChange = async (e: Event): Promise<void> => {
  displayInfo('Uploading Shift File...');
  store.commit('explorer/setDynamfitManualFile', '');
  const target = e.target as HTMLInputElement;
  const file = [...(target?.files || [])];
  const allowedTypes = ['csv', 'tsv', 'tab-separated-values', 'plain'];
  try {
    const extension = file[0]?.type?.replace(/(.*)\//, '') || file[0]?.name.split('.').pop();
    if (!extension || !allowedTypes.includes(extension)) {
      return displayInfo('Unsupported file format');
    }
    const { fileName } = await store.dispatch('uploadFile', {
      file,
      isTemp: isTemp.value,
    });
    if (fileName) {
      store.commit('explorer/setDynamfitManualFile', fileName);
      displayInfo('Shift file uploaded', 1500);
      if (variant.value === 'c') updateBtn.value = true;
    }
  } catch (err) {
    const error = err as Error;
    store.commit('setSnackbar', {
      message: error?.message || 'Something went wrong',
      action: () => onShiftFileChange(e),
    });
  }
};

const useSampleFile = async (): Promise<void> => {
  closeSidebar();
  useSample.value = true;
  displayInfo('Using sample file', 1500);
  dynamfit.value.fileUpload = 'test.tsv';
};

const resetChart = async (): Promise<void> => {
  const name = dynamfit.value.fileUpload || selectedItemProperty.value?.index;
  if (!name) return;

  store.commit('resetSnackbar');

  if (!useSample.value) {
    const { deleted, error } = await store.dispatch('deleteFile', {
      name,
      isTemp: isTemp.value,
    });
    if (!error && deleted) {
      return clearDynamfitData();
    }
  } else {
    return clearDynamfitData();
  }
};

const displayInfo = (msg: string, duration?: number): void => {
  if (msg) {
    store.commit('setSnackbar', {
      message: msg,
      duration: duration ?? 3000,
    });
  }
};

const clearDynamfitData = (): void => {
  useSample.value = false;
  store.commit('explorer/resetDynamfit');
  store.commit('explorer/resetDynamfitData');
  store.commit('explorer/setDynamfitManualFile', '');
  store.commit('explorer/resetDynamfitShiftCoefficients');
};

const fitShiftAndExtract = async (extractPayload: Record<string, unknown>): Promise<void> => {
  const fitPayload: Record<string, unknown> = {
    shift_file_name: mFile.value,
    transform_method: transformMethod.value,
  };

  if (ttspTgValue.value) fitPayload.Tg = ttspTgValue.value;
  if (ttspC1Value.value) fitPayload.C1 = ttspC1Value.value;
  if (ttspC2Value.value) fitPayload.C2 = ttspC2Value.value;
  if (ttspTLValue.value) fitPayload.TL = ttspTLValue.value;
  if (ttspEAValue.value) fitPayload.Ea = ttspEAValue.value;

  const fitted = await store.dispatch('explorer/fetchFitShiftData', fitPayload);

  if (fitted.C1 != null) ttspC1Value.value = fitted.C1;
  if (fitted.C2 != null) ttspC2Value.value = fitted.C2;
  if (fitted.Tg != null) ttspTgValue.value = fitted.Tg;
  if (fitted.Ea != null) ttspEAValue.value = fitted.Ea;
  if (fitted.TL != null) ttspTLValue.value = fitted.TL;

  extractPayload.transform_method = transformMethod.value;
  extractPayload.shift_file_name = mFile.value;
  if (fitted.C1 != null) extractPayload.C1 = fitted.C1;
  if (fitted.C2 != null) extractPayload.C2 = fitted.C2;
  if (fitted.Tg != null) extractPayload.Tg = fitted.Tg;
  if (fitted.Ea != null) extractPayload.Ea = fitted.Ea;
  if (fitted.TL != null) extractPayload.TL = fitted.TL;

  await store.dispatch('explorer/fetchDynamfitData', extractPayload);
};

const updateChart = async (): Promise<void> => {
  if ((selectedItemProperty.value?.index ?? -1) >= 0) {
    return await handleSelect();
  }

  const payload: Record<string, unknown> = {
    useSample: useSample.value,
    file_name: dynamfit.value.fileUpload,
    number_of_prony: dynamfit.value.range,
    model: dynamfit.value.model,
    // fit_settings: dynamfit.value.fitSettings,
    domain: selectedProperty.value,
    smoothness: smoothness.value,
    relative_error: relativeError.value,
  };

  if (variant.value === 'a') {
    // Variant A: Manual sends shift_file_name, WLF/Hybrid send coefficients directly
    if (transformMethod.value && isManual.value) {
      payload.transform_method = transformMethod.value;
      payload.shift_file_name = mFile.value;
    } else if (transformMethod.value && (isWLF.value || isHybrid.value)) {
      payload.transform_method = transformMethod.value;
      if (ttspTgValue.value) payload.Tg = ttspTgValue.value;
      if (ttspC1Value.value) payload.C1 = ttspC1Value.value;
      if (ttspC2Value.value) payload.C2 = ttspC2Value.value;
      if (tgEstimated.value) payload.Tg_estimate = tgEstimated.value;
      if (c1Estimated.value) payload.C1_estimate = c1Estimated.value;
      if (c2Estimated.value) payload.C2_estimate = c2Estimated.value;

      if (isHybrid.value) {
        if (ttspEAValue.value) payload.Ea = ttspEAValue.value;
        if (ttspTLValue.value) payload.TL = ttspTLValue.value;
        if (eAEstimated.value) payload.Ea_estimate = eAEstimated.value;
        if (tLEstimated.value) payload.TL_estimate = tLEstimated.value;
      }
    }
  } else if (variant.value === 'c') {
    // Variant C: Manual uses fitShiftAndExtract, WLF/Hybrid send coefficients directly
    if (isManual.value && mFile.value) {
      try {
        store.commit('explorer/setDynamfitDomain', selectedProperty.value);
        await fitShiftAndExtract(payload);
        updateBtn.value = false;
        if (selectedProperty.value === 'temperature') cTtspApplied.value = true;
        cTtspVisible.value = false;
        cShiftModelOpen.value = false;
        nextTick(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
      } catch (err: unknown) {
        const error = err as Error;
        store.commit('setSnackbar', {
          message: error.message || 'Failed to fit shift coefficients',
          duration: 3000,
        });
      }
      return;
    }

    if (transformMethod.value && (isWLF.value || isHybrid.value)) {
      payload.transform_method = transformMethod.value;
      if (ttspTgValue.value) payload.Tg = ttspTgValue.value;
      if (ttspC1Value.value) payload.C1 = ttspC1Value.value;
      if (ttspC2Value.value) payload.C2 = ttspC2Value.value;
      if (tgEstimated.value) payload.Tg_estimate = tgEstimated.value;
      if (c1Estimated.value) payload.C1_estimate = c1Estimated.value;
      if (c2Estimated.value) payload.C2_estimate = c2Estimated.value;

      if (isHybrid.value) {
        if (ttspEAValue.value) payload.Ea = ttspEAValue.value;
        if (ttspTLValue.value) payload.TL = ttspTLValue.value;
        if (eAEstimated.value) payload.Ea_estimate = eAEstimated.value;
        if (tLEstimated.value) payload.TL_estimate = tLEstimated.value;
      }
    }
  } else {
    // Variant B: fitShiftAndExtract for upload mode, enter-values for enter mode
    if (needsShiftFile.value && mFile.value) {
      try {
        isSidebarOpen.value = false;
        store.commit('explorer/setDynamfitDomain', selectedProperty.value);
        await fitShiftAndExtract(payload);
      } catch (err: unknown) {
        const error = err as Error;
        store.commit('setSnackbar', {
          message: error.message || 'Failed to fit shift coefficients',
          duration: 3000,
          type: 'error',
        });
      }
      return;
    }

    if (transformMethod.value && (isWLF.value || isHybrid.value) && inputMethod.value === 'enter') {
      payload.transform_method = transformMethod.value;
      if (ttspTgValue.value) payload.Tg = ttspTgValue.value;
      if (ttspC1Value.value) payload.C1 = ttspC1Value.value;
      if (ttspC2Value.value) payload.C2 = ttspC2Value.value;
      if (tgEstimated.value) payload.Tg_estimate = tgEstimated.value;
      if (c1Estimated.value) payload.C1_estimate = c1Estimated.value;
      if (c2Estimated.value) payload.C2_estimate = c2Estimated.value;

      if (isHybrid.value) {
        if (ttspEAValue.value) payload.Ea = ttspEAValue.value;
        if (ttspTLValue.value) payload.TL = ttspTLValue.value;
        if (eAEstimated.value) payload.Ea_estimate = eAEstimated.value;
        if (tLEstimated.value) payload.TL_estimate = tLEstimated.value;
      }
    }
  }

  isSidebarOpen.value = false;
  store.commit('explorer/setDynamfitDomain', selectedProperty.value);
  await store.dispatch('explorer/fetchDynamfitData', payload);
  updateBtn.value = false;
  if (variant.value === 'c' && transformMethod.value) {
    if (selectedProperty.value === 'temperature') cTtspApplied.value = true;
    cTtspVisible.value = false;
    cShiftModelOpen.value = false;
    nextTick(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }
};

// Manual re-run for ω-T changes that don't auto-dispatch on their own —
// toggling "use estimated" or switching transform method. Those changes arm
// updateBtn; running the fit clears it so the Update button disables again
// until the next pending change.
const handleUpdate = async (): Promise<void> => {
  updateBtn.value = false;
  await updateChart();
};

const openSidebar = (): void => {
  isSidebarOpen.value = true;
};

const closeSidebar = (): void => {
  isSidebarOpen.value = false;
};

const goBack = (): void => {
  currentItem.value = null;
  selectedItemProperty.value = null;
};

const cSelectSource = (type: string): void => {
  if ((type === 'popular' || type === 'surprise') && (!selectedProperty.value || selectedProperty.value === 'select')) {
    store.commit('setSnackbar', { message: 'Please select a domain first (Frequency or Temperature)', duration: 4000 });
    return;
  }
  if (type === 'surprise') {
    loadSurpriseFile();
    return;
  }
  dataType.value = type;
};

const cGoBackToMain = (): void => {
  dataType.value = undefined;
  selectedPolymerFile.value = '';
};

const loadPolymerFile = async (filePath: string, sourceType: string): Promise<void> => {
  displayInfo('Loading polymer data...');
  try {
    const response = await fetch(filePath);
    if (!response.ok) throw new Error('Failed to fetch file');
    const blob = await response.blob();
    const fileName = filePath.split('/').pop() || 'polymer_data.txt';
    const file = new File([blob], fileName, { type: blob.type || 'text/plain' });
    const { fileName: uploadedName } = await store.dispatch('uploadFile', {
      file: [file],
      isTemp: isTemp.value,
    });
    if (uploadedName) {
      dynamfit.value.fileUpload = uploadedName;
      store.commit('explorer/setDynamfitSourceType', sourceType);
      displayInfo('File loaded successfully', 1500);
    }
  } catch (err) {
    const error = err as Error;
    store.commit('setSnackbar', {
      message: error?.message || 'Failed to load polymer file',
      action: () => loadPolymerFile(filePath, sourceType),
    });
  }
};

const loadPopularPolymer = async (): Promise<void> => {
  if (!selectedPolymerFile.value) return;
  await loadPolymerFile(selectedPolymerFile.value, 'popular');
};

const loadSurpriseFile = async (): Promise<void> => {
  const files = popularPolymerFiles.value;
  if (!files.length) return;
  const currentFile = dynamfit.value?.fileUpload || '';
  let candidates = files.filter((f) => f.path.split('/').pop() !== currentFile);
  if (!candidates.length) candidates = files;
  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  await loadPolymerFile(pick.path, 'surprise');
};

const handleSelect = async (): Promise<void> => {
  if (sentRequest.value)
    store.commit('setSnackbar', { message: 'Please wait & try after a few sec' });

  if (!selectedItemProperty.value) {
    store.commit('setSnackbar', {
      message: 'Please select an item before proceeding.',
      type: 'error',
      duration: 4000,
    });
    return;
  }

  sentRequest.value = true;
  isSidebarOpen.value = false;
  try {
    const payload = {
      id: currentItem.value?.id,
      domain: selectedProperty.value,
      index: selectedItemProperty.value.index,
      numberOfProny: dynamfit.value.range,
      model: dynamfit.value.model,
      // fitSettings: dynamfit.value.fitSettings,
    };

    const response = await fetch('/api/mn/loadxml', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token.value,
      },
      body: JSON.stringify(payload),
    });
    const resp = await response.json();
    if (!response.ok) {
      sentRequest.value = false;
      throw new Error(resp.message);
    }

    const data = resp?.response ?? {};
    store.commit('explorer/setDynamfitDomain', selectedProperty.value);
    store.commit('explorer/setDynamfitData', data);
    sentRequest.value = false;
  } catch (err) {
    sentRequest.value = false;
    const error = err as Error;
    store.commit('setSnackbar', {
      message: error.message || 'Something went wrong. Please try again.',
      type: 'error',
      duration: 1000,
    });
  }
};

const search = async (): Promise<void> => {
  const payload = {
    has: selectedProperty.value,
    limit: limit.value || 2,
    page: currentPage.value,
  };
  try {
    const response = await fetch('/api/xml/xml-has-property', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token.value,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message);
    }
    results.value = data;
    totalPages.value = Math.ceil(data.counts / limit.value);
  } catch (err) {
    const error = err as Error;
    store.commit('setSnackbar', {
      message: error.message || 'Something went wrong. Please try again.',
      type: 'error',
      duration: 10000,
    });
  }
};

const goToPage = async (page: number): Promise<void> => {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  await search();
};

// Watchers
watch(transformMethod, (newValue) => {
  store.commit(
    'explorer/setDynamfitTransformMethod',
    newValue as 'none' | 'WLF' | 'hybrid' | 'manual'
  );
  if (variant.value === 'c' && (newValue === 'WLF' || newValue === 'hybrid')) {
    tgEstimated.value = true;
    c1Estimated.value = true;
    c2Estimated.value = true;
    if (newValue === 'hybrid') {
      tLEstimated.value = true;
      eAEstimated.value = true;
    }
  }
  if (newValue) updateBtn.value = true;
});

watch(
  dynamfit,
  (newVal) => {
    if (!newVal) return;
    updateChart();
  },
  { deep: true }
);

watch([smoothness, relativeError], () => {
  updateChart();
});

watch(limit, () => {
  return search();
});

watch(variant, (v) => {
  if (v === 'c' && selectedProperty.value === 'select') {
    selectedProperty.value = 'frequency';
  }
});

watch(selectedProperty, (v) => {
  if (variant.value === 'c' && v !== 'select') {
    cDataSourceOpen.value = true;
    cTtspApplied.value = false;
    cTtspVisible.value = true;
    cShiftModelOpen.value = true;
  }
});

watch(disableInput, (disabled) => {
  if (!disabled && variant.value === 'c') {
    cDataSourceOpen.value = false;
  }
});

watch(
  () => dynamfit.value?.fileUpload,
  (newVal, oldVal) => {
    if (variant.value === 'c' && oldVal && !newVal) {
      dataType.value = 'upload';
      cDataSourceOpen.value = true;
      nextTick(() => {
        document
          .getElementById('C_Viscoelastic_Data')
          ?.closest('.dynamfit-shift-upload')
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }
  }
);

watch([tgEstimated, c1Estimated, c2Estimated, tLEstimated, eAEstimated], (cv, ov) => {
  if (cv[0] && cv[0] === true) ttspTgValue.value = null;
  if (cv[1] && cv[1] === true) ttspC1Value.value = null;
  if (cv[2] && cv[2] === true) ttspC2Value.value = null;
  if (cv[3] && cv[3] === true) ttspTLValue.value = null;
  if (cv[4] && cv[4] === true) ttspEAValue.value = null;
  if (cv !== ov) updateBtn.value = true;
});

watch(ttspTgValue, (v) => {
  if (variant.value === 'c' && v) tgEstimated.value = false;
});
watch(ttspC1Value, (v) => {
  if (variant.value === 'c' && v) c1Estimated.value = false;
});
watch(ttspC2Value, (v) => {
  if (variant.value === 'c' && v) c2Estimated.value = false;
});
watch(ttspTLValue, (v) => {
  if (variant.value === 'c' && v) tLEstimated.value = false;
});
watch(ttspEAValue, (v) => {
  if (variant.value === 'c' && v) eAEstimated.value = false;
});

// Debounced watcher: when ttsp coefficient inputs change, call /extract if fileUpload exists
watch([ttspTgValue, ttspC1Value, ttspC2Value, ttspTLValue, ttspEAValue], () => {
  if (skipCoeffWatcher.value) return;
  if (!ttsp.value) return;
  if (!transformMethod.value || !(isWLF.value || isHybrid.value)) return;
  if (inputMethod.value !== 'enter') return;

  if (coeffDebounceTimer) clearTimeout(coeffDebounceTimer);
  coeffDebounceTimer = setTimeout(async () => {
    if (!dynamfit.value?.fileUpload) {
      store.commit('setSnackbar', {
        message: 'Please upload or select a data file in Data Source first.',
        duration: 4000,
      });
      return;
    }

    const payload: Record<string, unknown> = {
      useSample: useSample.value,
      file_name: dynamfit.value.fileUpload,
      number_of_prony: dynamfit.value.range,
      model: dynamfit.value.model,
      // fit_settings: dynamfit.value.fitSettings,
      domain: selectedProperty.value,
      smoothness: smoothness.value,
      relative_error: relativeError.value,
      transform_method: transformMethod.value,
    };

    if (ttspTgValue.value) payload.Tg = ttspTgValue.value;
    if (ttspC1Value.value) payload.C1 = ttspC1Value.value;
    if (ttspC2Value.value) payload.C2 = ttspC2Value.value;
    if (tgEstimated.value) payload.Tg_estimate = tgEstimated.value;
    if (c1Estimated.value) payload.C1_estimate = c1Estimated.value;
    if (c2Estimated.value) payload.C2_estimate = c2Estimated.value;

    if (isHybrid.value) {
      if (ttspEAValue.value) payload.Ea = ttspEAValue.value;
      if (ttspTLValue.value) payload.TL = ttspTLValue.value;
      if (eAEstimated.value) payload.Ea_estimate = eAEstimated.value;
      if (tLEstimated.value) payload.TL_estimate = tLEstimated.value;
    }

    store.commit('explorer/setDynamfitDomain', selectedProperty.value);
    await store.dispatch('explorer/fetchDynamfitData', payload);
  }, 500);
});

// Watcher: when shift file (mFile) is uploaded, immediately call /fit-shift
watch(mFile, async (newFile) => {
  if (!newFile) return;
  if (!ttsp.value) return;
  if (inputMethod.value !== 'upload') return;

  const method = transformMethod.value || 'WLF';
  const fitPayload: Record<string, unknown> = {
    shift_file_name: newFile,
    transform_method: method,
  };

  if (method === 'WLF' || method === 'hybrid') {
    if (ttspTgValue.value) fitPayload.Tg = ttspTgValue.value;
  }
  if (method === 'hybrid') {
    if (ttspTLValue.value) fitPayload.TL = ttspTLValue.value;
  }

  try {
    const response = await store.dispatch('explorer/fetchFitShiftData', fitPayload);

    const responseMethod = response.transform_method || 'WLF';
    transformMethod.value = responseMethod;

    // Populate coefficient fields from response — skip the debounced watcher
    // so we can batch-set values then trigger extract once at the end
    skipCoeffWatcher.value = true;

    if (response.Tg != null) {
      ttspTgValue.value = response.Tg;
      tgEstimated.value = false;
    }
    if (response.C1 != null) {
      ttspC1Value.value = response.C1;
      c1Estimated.value = false;
    }
    if (response.C2 != null) {
      ttspC2Value.value = response.C2;
      c2Estimated.value = false;
    }
    if (response.Ea != null) {
      ttspEAValue.value = response.Ea;
      eAEstimated.value = false;
    }
    if (response.TL != null) {
      ttspTLValue.value = response.TL;
      tLEstimated.value = false;
    }

    // Nudge user to enter Tg/TL to trigger backend call
    const nudgeField = responseMethod === 'hybrid' ? 'Tg or TL' : 'Tg';
    store.commit('setSnackbar', {
      message: `Shift file loaded. Enter a value for ${nudgeField} to trigger fitting.`,
      duration: 0,
    });

    // Switch to enter mode so the coefficient watcher can chain into /extract
    inputMethod.value = 'enter';

    // Re-enable the watcher after a tick so it can fire from the populated values
    setTimeout(() => {
      skipCoeffWatcher.value = false;
      // Manually trigger extract if fileUpload is present
      if (dynamfit.value?.fileUpload) {
        const payload: Record<string, unknown> = {
          useSample: useSample.value,
          file_name: dynamfit.value.fileUpload,
          number_of_prony: dynamfit.value.range,
          model: dynamfit.value.model,
          // fit_settings: dynamfit.value.fitSettings,
          domain: selectedProperty.value,
          smoothness: smoothness.value,
          relative_error: relativeError.value,
          transform_method: transformMethod.value,
          shift_file_name: newFile,
        };

        if (ttspTgValue.value) payload.Tg = ttspTgValue.value;
        if (ttspC1Value.value) payload.C1 = ttspC1Value.value;
        if (ttspC2Value.value) payload.C2 = ttspC2Value.value;
        if (ttspEAValue.value) payload.Ea = ttspEAValue.value;
        if (ttspTLValue.value) payload.TL = ttspTLValue.value;

        store.commit('explorer/setDynamfitDomain', selectedProperty.value);
        store.dispatch('explorer/fetchDynamfitData', payload);
      }
    }, 0);
  } catch (err: unknown) {
    const error = err as Error;
    store.commit('setSnackbar', {
      message: error.message || 'Failed to fit shift coefficients',
      duration: 3000,
      type: 'error',
    });
  }
});

watch(
  () => store.state.explorer.dynamfitSurpriseRequest,
  () => {
    if (variant.value === 'c') loadSurpriseFile();
  }
);
</script>
