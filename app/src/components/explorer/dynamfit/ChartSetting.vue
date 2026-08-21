<template>
  <div class="u_width--max utility-bg_border-dark md-card-header u--b-rad">
    <label class="form-label md-subheading">
      <div class="u_margin-bottom-small" v-if="!updateControls">
        Begin by uploading your viscoelastic dataset or selecting from existing entries.
      </div>
      <div class="u_margin-bottom-small" v-else>
        To start over, hit reset to clear all selections and begin fresh.
      </div>
    </label>

    <!-- Reset bar when data loaded -->
    <div v-if="updateControls" class="dynamfit-reset-bar" @click="resetAll">
      <div class="dynamfit-reset-bar__status">
        <md-icon class="dynamfit-reset-bar__pulse">fiber_manual_record</md-icon>
        <span>Session active</span>
      </div>
      <button class="dynamfit-reset-bar__action">
        <md-icon class="dynamfit-reset-bar__icon">restart_alt</md-icon>
        <span>Reset</span>
      </button>
    </div>

    <!-- Domain -->
    <div class="viz-u-mgbottom-big">
      <label class="md-body-2">Input data domain</label>
      <div class="dynamfit-domain-switcher">
        <button
          :class="[
            'dynamfit-domain-switcher__option',
            selectedProperty === 'frequency' ? 'dynamfit-domain-switcher__option--active' : '',
          ]"
          @click="selectedProperty = 'frequency'"
        >
          <md-icon class="dynamfit-domain-switcher__icon">ssid_chart</md-icon>
          <span>Frequency</span>
        </button>
        <button
          :class="[
            'dynamfit-domain-switcher__option',
            selectedProperty === 'temperature' ? 'dynamfit-domain-switcher__option--active' : '',
          ]"
          @click="selectedProperty = 'temperature'"
        >
          <md-icon class="dynamfit-domain-switcher__icon">thermostat</md-icon>
          <span>Temperature</span>
        </button>
      </div>
    </div>

    <!-- Data Source (collapsible) -->
    <div class="viz-u-mgbottom-sm">
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
            <button
              class="dynamfit-source-btn disabled"
              disabled
              aria-disabled="true"
              title="Temporarily unavailable"
            >
              <md-icon style="margin-left: 0; margin-right: 0.25rem">manage_search</md-icon>
              Explore XML
            </button>
          </div>
          <div class="dynamfit-source-grid u_margin-bottom-small">
            <button class="dynamfit-source-btn" @click="cSelectSource('popular')">
              <md-icon style="margin-left: 0; margin-right: 0.25rem">star</md-icon>
              Popular Polymers
            </button>
            <button class="dynamfit-source-btn" @click="cSelectSource('surprise')">
              <md-icon style="margin-left: 0; margin-right: 0.25rem">shuffle</md-icon>
              Surprise Me
            </button>
          </div>
          <span class="dynamfit-hint">Explore XML is temporarily unavailable.</span>
        </template>

        <!-- Upload sub-panel -->
        <template v-if="dataType === 'upload'">
          <div class="dynamfit-shift-upload">
            <p class="dynamfit-shift-upload__label">
              Upload a viscoelastic data file (CSV, TSV, or TXT) with {{ cAxisLabel }}, E' (Pa), E" (Pa).
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
          <div class="dynamfit-format">
            <div
              class="u_pointer"
              style="display: flex; align-items: center; width: 100%"
              @click="cFormatOpen = !cFormatOpen"
            >
              <label class="md-body-2 u_pointer">Expected data source file format</label>
              <md-icon style="margin-left: auto; margin-right: 0">{{
                cFormatOpen ? 'expand_less' : 'expand_more'
              }}</md-icon>
            </div>
            <template v-if="cFormatOpen">
              <div class="dynamfit-format__body">
                <p>
                  Columns are read by position and count. A header row is optional and is
                  ignored entirely.
                </p>
                <ul class="dynamfit-format__shapes">
                  <li>{{ cAxisLabel }} · E' · E"</li>
                  <li>{{ cAxisLabel }} · E' · E" · Error</li>
                  <li>{{ cAxisLabel }} · E' · E" · E' Error · E" Error</li>
                </ul>
                <p>
                  Error is an <b>absolute standard deviation in Pa</b> — the same units as
                  the moduli, not a fraction or a percent. If E' is 1e9 Pa, a 5%
                  uncertainty is <b>5e7</b>, not 0.05.
                </p>
                <p>
                  Every error value must be greater than 0. Error columns set the fit
                  weights (1/σ), and the setting below becomes an Error Scale that
                  multiplies them. They are not drawn as error bars.
                </p>
              </div>
            </template>
          </div>
          <!-- Template downloads sit at the upload level, not buried inside
               the format explainer above. -->
          <div class="u_display-flex u_centralize_content" style="gap: 0.5rem; flex-wrap: wrap">
            <a class="btn-text btn--noradius" href="/dynamfit-template.tsv" download>
              <span class="md-body-1">Download Template</span>
            </a>
            <HelpPopover label="Template format">{{ downloadTitle() }}</HelpPopover>
            <a class="btn-text btn--noradius" href="/dynamfit-template-error.tsv" download>
              <span class="md-body-1">Download Template with Error Columns</span>
            </a>
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
              v-for="file in popularPolymerFiles"
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

    <!-- Relaxation Grid Size Slider (sent as number_of_prony) -->
    <div
      v-if="!disableInput && (selectedProperty !== 'temperature' || cTtspApplied)"
      class="viz-u-mgbottom-sm"
    >
      <label for="prony" class="md-body-2">
        Relaxation Grid Size <span>[{{ dynamfit.range }}]</span>
        <HelpPopover label="Relaxation grid size">
          How many relaxation times the fit may choose from, log-spaced across your data's
          span. The default is about 3 per decade of frequency; a finer grid fits finer
          detail but can overfit noisy data. This is an upper bound rather than the answer:
          the fit discards terms it does not need, and temperature-domain data is capped
          against the frequency span the ω-T transform produces. The figure legends and the
          coefficient table report how many terms the fit actually kept.
        </HelpPopover>
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
          :style="{ left: `${dynamfit.range}%` }"
          v-if="showToolTip"
          class="u_margin-top-med viz-u-display__show nuplot-slider-tooltip"
          id="parame-selector-slider-id"
        >
          {{ dynamfit.range }}
        </div>
      </div>
      <div class="u--layout-flex u--layout-flex-justify-sb u--color-grey-sec">
        <div>1</div>
        <div>100</div>
      </div>
    </div>

    <!-- Smoothness/RelError + ω-T Transformation -->
    <div class="viz-u-mgbottom-sm">
      <div
        v-if="!disableInput && (selectedProperty !== 'temperature' || cTtspApplied)"
        class="u--layout-flex u--layout-flex-justify-sb grid_gap-small u_margin-bottom-small"
      >
        <div class="u_display-flex u--layout-flex-column grid_gap-smaller">
          <label for="smoothnessC" class="md-body-2">
            Smoothness (%)
            <HelpPopover label="Smoothness">
              Penalty on curvature of the relaxation spectrum, as a percentage.  Larger values give
              a smoother spectrum; 0 disables smoothing; over 100% is possible but not recommended.
            </HelpPopover>
          </label>
          <input
            :disabled="disableInput"
            v-model.number="smoothnessPercent"
            :class="[disableInput ? 'nuplot-masked' : '', 'form__input form__input--flat']"
            type="number"
            name="smoothness"
            id="smoothnessC"
            min="0"
            max="100"
            :step="PERCENT_INPUT_STEP"
            :placeholder="SMOOTHNESS_DEFAULT_PERCENT"
          />
        </div>
        <div class="u_display-flex u--layout-flex-column grid_gap-smaller">
          <!-- One widget slot, two modes: the same knob reads as a relative
               error when the fit synthesizes sigma from |E*|, and as a plain
               multiplier on the file's own error columns when it has them. -->
          <label v-if="cHasErrorColumns" for="errorScaleC" class="md-body-2">
            Error Scale
            <HelpPopover label="Error Scale">
              Multiplies the error columns supplied by your file: 1.0 uses them exactly
              as given, 2.0 doubles every σ. Point-to-point weighting still comes from
              the file; this only scales it, which shifts χ²/dof and the smoothness
              trade-off.
            </HelpPopover>
          </label>
          <label v-else for="relativeErrorC" class="md-body-2">
            Relative Error (%)
            <HelpPopover label="Relative Error">
              Assumed measurement uncertainty as a percentage: the fit weights each point by
              ΔE = (Relative Error ÷ 100) × |E*|. Ignored when your file supplies its own
              error column(s).
            </HelpPopover>
          </label>
          <input
            v-if="cHasErrorColumns"
            :disabled="disableInput"
            v-model.number="errorScale"
            :class="[
              disableInput ? 'nuplot-masked' : '',
              'form__input form__input--flat',
            ]"
            type="number"
            name="errorScale"
            id="errorScaleC"
            min="0"
            max="100"
            :step="ERROR_SCALE_STEP"
            :placeholder="ERROR_SCALE_DEFAULT"
          />
          <input
            v-else
            :disabled="disableInput"
            v-model.number="relativeErrorPercent"
            :class="[
              disableInput ? 'nuplot-masked' : '',
              'form__input form__input--flat',
            ]"
            type="number"
            name="relativeError"
            id="relativeErrorC"
            min="0"
            max="200"
            :step="PERCENT_INPUT_STEP"
            :placeholder="RELATIVE_ERROR_DEFAULT_PERCENT"
          />
        </div>
      </div>
      <div
        v-if="!disableInput"
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
              WLF
            </md-radio>
            <md-radio
              id="cTransformMethodHybrid"
              v-model="transformMethod"
              value="hybrid"
              :disabled="isFrequencyDomain"
            >
              Hybrid
            </md-radio>
            <md-radio id="cTransformMethodManual" v-model="transformMethod" value="manual">
              Manual
            </md-radio>
          </div>
          <span v-if="isFrequencyDomain" class="dynamfit-hint">
            Hybrid needs temperature-domain data — it has no inverse transform yet.
          </span>

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

          <!-- Coefficient fields (WLF / Hybrid). The model's anchor leads the
               list: TC is the hybrid crossover, Tg the WLF reference. In the
               frequency domain Tg has no estimate checkbox — a master curve's
               tan-δ peak is a frequency, so there is nothing to estimate a
               temperature from, and the server refuses Tg_estimate there. -->
          <template v-if="isWLF || isHybrid">
            <div class="u--layout-flex u--layout-flex-justify-sb" v-if="isHybrid">
              <md-field class="dynamfit-field--half">
                <md-input
                  v-model="ttspTCValue"
                  :placeholder="tcPlaceholder"
                  :disabled="!ttsp || tCEstimated"
                ></md-input>
              </md-field>
              <md-checkbox
                :disabled="ttspDisabled"
                v-model="tCEstimated"
                class="u--layout-flex viz-u-mgup-sm viz-u-mgbottom-sm u_centralize_items"
              >
                Use Estimated Tc
              </md-checkbox>
            </div>
            <div class="u--layout-flex u--layout-flex-justify-sb">
              <md-field class="dynamfit-field--half">
                <md-input
                  v-model="ttspTgValue"
                  :placeholder="tgPlaceholder"
                  :disabled="!ttsp || tgEstimated"
                ></md-input>
              </md-field>
              <md-checkbox
                v-if="!isFrequencyDomain"
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
                  :placeholder="c1Placeholder"
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
                  :placeholder="c2Placeholder"
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
                  v-model="ttspEAValue"
                  :placeholder="eaPlaceholder"
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
            <!-- Anchor inputs for fitting the uploaded shift factors: WLF and
                 hybrid each need their reference temperature before /fit-shift
                 can run, and neither field exists elsewhere in manual mode —
                 without these the "enter Tg or TC" nudge would be a dead end.
                 No estimate checkboxes: estimation is an extract-side feature,
                 the coefficient fit needs an explicit anchor. -->
            <p class="dynamfit-shift-upload__label">
              To also fit WLF or hybrid coefficients to the shift factors, enter the model's
              anchor: Tg for WLF, Tc for hybrid.
            </p>
            <div class="u--layout-flex u--layout-flex-justify-sb">
              <md-field class="dynamfit-field--half">
                <md-input v-model="ttspTgValue" placeholder="Tg (fits WLF)"></md-input>
              </md-field>
              <md-field class="dynamfit-field--half">
                <md-input v-model="ttspTCValue" placeholder="Tc (fits hybrid)"></md-input>
              </md-field>
            </div>
          </template>

          <!-- The section's own apply button: every widget above is inert
               until it is hit, so it lives with them rather than carrying a
               bespoke visibility state at the panel's foot. -->
          <div class="u_display-flex u_centralize_content utility-margin-top">
            <a
              class="btn-text btn--noradius"
              :class="{ disabled: !updateBtn }"
              href="#"
              @click="handleUpdate"
            >
              <span class="md-body-1">Update</span>
            </a>
          </div>
        </template>
      </template>
    </div>

    <!-- Fitted shift coefficients (a_T_ref, misfit, ...) are shown in the
         visualizer's Shift Coeff tab, not here. -->

    <!-- Shift file name display -->
    <div v-if="mFile" class="md-alert md-alert--info utility-margin-top">
      <md-icon class="md-alert-icon u--color-primary u_margin-right-small">info</md-icon>
      <span class="md-alert-content">
        <strong>Shift File:</strong> {{ reduceDescription(mFile, 15, true) }}
      </span>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { useStore } from 'vuex';
import { useOptionalChaining } from '@/composables';
import { useReduce } from '@/composables/useReduce';
import {
  computeDefaultPronyTerms,
  fractionToPercent,
  percentToFraction,
  ERROR_SCALE_DEFAULT,
  ERROR_SCALE_STEP,
  PERCENT_INPUT_STEP,
  RELATIVE_ERROR_DEFAULT_PERCENT,
  SMOOTHNESS_DEFAULT_PERCENT,
} from '@/composables/useDynamfitDefaults';
import {
  resolveShiftFitModel,
  resolveExtractTransformMethod,
} from '@/composables/useDynamfitShift';
import Pagination from '@/components/explorer/Pagination.vue';
import HelpPopover from '@/components/HelpPopover.vue';

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

// Reactive state
const showToolTip = ref(false);
const isTemp = ref(true);
const useSample = ref(false);
const selectedProperty = ref('frequency');
const limit = ref(2);
const results = ref<SearchResults>({});
const currentItem = ref<XmlItem | null>(null);
const selectedItemProperty = ref<SelectedItemProperty | null>(null);
const currentPage = ref(1);
const totalPages = ref(0);
const dataType = ref<string | undefined>(undefined);
const ttsp = ref(false);
const transformMethod = ref('');
const ttspTgValue = ref(null);
const tgEstimated = ref(false);
const ttspC1Value = ref(null);
const c1Estimated = ref(false);
const ttspC2Value = ref(null);
const c2Estimated = ref(false);
const ttspTCValue = ref(null);
const ttspEAValue = ref(null);
const tCEstimated = ref(false);
const eAEstimated = ref(false);
// Open on arrival: the source buttons are the first thing the user needs, and
// nothing collapses them again except an explicit click on the header caret.
const cDataSourceOpen = ref(true);
const cFormatOpen = ref(false);
// Held as the fractions the API takes; the inputs bind to the percent proxies
// below so the units on screen match the labels.
const smoothness = ref<number>(percentToFraction(SMOOTHNESS_DEFAULT_PERCENT));
const relativeError = ref<number>(percentToFraction(RELATIVE_ERROR_DEFAULT_PERCENT));
// The widget's other mode: a plain multiplier on the file's own error
// columns. Both values ride in every request and the server consumes
// whichever matches the upload's shape, so neither mode can corrupt the
// other — see the error_scale comment in services routes.py.
const errorScale = ref<number>(ERROR_SCALE_DEFAULT);

const smoothnessPercent = computed<number>({
  get: () => fractionToPercent(smoothness.value),
  set: (v) => {
    smoothness.value = percentToFraction(v);
  },
});
const relativeErrorPercent = computed<number>({
  get: () => fractionToPercent(relativeError.value),
  set: (v) => {
    relativeError.value = percentToFraction(v);
  },
});
const sentRequest = ref(false);
const updateBtn = ref(false);
const cTtspApplied = ref(false);
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
    label: 'DGEBA-IPD (170°C)',
    domain: 'frequency',
  },
  {
    path: '/docs/dynamfit/PETMP-TATATO-OLD-wide-bar-55C_mastercurve.tsv',
    label: 'PETMP-TATATO (55°C)',
    domain: 'frequency',
  },
  {
    path: '/docs/dynamfit/VeroCyan-80C_mastercurve.tsv',
    label: 'VeroCyan (80°C)',
    domain: 'frequency',
  },
  {
    path: '/docs/dynamfit/Cavaille-PS-98k-master-93C.csv',
    label: 'Polystyrene 98kDa, shear (93°C)',
    domain: 'frequency',
  },
  {
    path: '/docs/dynamfit/PMMA-R09-master-clean-148C.csv',
    label: 'PMMA R09 (148°C)',
    domain: 'frequency',
  },
  {
    path: '/docs/dynamfit/fisher-polycarbonate-150C_mastercurve.csv',
    label: 'Polycarbonate (150°C)',
    domain: 'frequency',
  },
  {
    path: '/docs/dynamfit/agilus30-1Hz_temp.tsv',
    label: 'Agilus30 (1Hz)',
    domain: 'temperature',
  },
  {
    path: '/docs/dynamfit/dgeba-ipd-wide-bar-1Hz_temp.tsv',
    label: 'DGEBA-IPD (1Hz)',
    domain: 'temperature',
  },
  {
    path: '/docs/dynamfit/PETMP-TATATO-OLD-wide-bar-1Hz_temp.tsv',
    label: 'PETMP-TATATO (1Hz)',
    domain: 'temperature',
  },
  {
    path: '/docs/dynamfit/VeroCyan-1Hz_temp.tsv',
    label: 'VeroCyan (1Hz)',
    domain: 'temperature',
  },
  {
    path: '/docs/dynamfit/PMMA-R09-temp-sweep-clean.csv',
    label: 'PMMA R09 (1Hz)',
    domain: 'temperature',
  },
];

const popularPolymerFiles = computed(() =>
  allPolymerFiles.filter((f) => f.domain === selectedProperty.value)
);
const skipCoeffWatcher = ref(false);
// Held for the whole of resetAll() and released only after Vue has flushed the
// watcher queue. Every watcher that can start a fit checks it, so tearing the
// session down never fires a request against the file we just deleted.
const resetting = ref(false);

// Computed
const token = computed(() => store.getters['auth/token']);
const dynamfit = computed(() => store.getters['explorer/dynamfit']);
const mFile = computed(() => store.getters['explorer/getDynamfitManualFile']);

const disableInput = computed(() => {
  return !dynamfitData.value || !Object.keys(dynamfitData.value).length;
});

const dynamfitData = computed(() => {
  return store.getters['explorer/getDynamfitData'];
});

const cAxisLabel = computed(() =>
  selectedProperty.value === 'temperature' ? 'Temperature (°C)' : 'Frequency (Hz)'
);

const isFrequencyDomain = computed(() => selectedProperty.value === 'frequency');

// Ghosted-input placeholders name each estimate's source while its box is
// checked. The values are client-side constants on purpose — the universal
// WLF numbers and generic Ea are fixed server-side (see UNIVERSAL_WLF_* and
// the Ea estimate in the trive routes), so echoing them from the backend
// would be plumbing for data that cannot vary; the data-derived ones name
// their derivation instead of a number the client cannot know.
const tgPlaceholder = computed(() => {
  if (tgEstimated.value) return 'Tg (tan δ peak)';
  return isFrequencyDomain.value ? 'Tg (required)' : 'Tg';
});
const tcPlaceholder = computed(() => (tCEstimated.value ? 'Tc (E″ peak)' : 'Tc'));
const c1Placeholder = computed(() => (c1Estimated.value ? 'C1 (17.44, Universal)' : 'C1'));
const c2Placeholder = computed(() => (c2Estimated.value ? 'C2 (51.6, Universal)' : 'C2'));
const eaPlaceholder = computed(() => (eAEstimated.value ? 'EA (200 kJ/mol, Universal)' : 'EA'));

// Error columns are only known WITH the fit response: upload-data echoes every
// column upload_init produced, keyed by name. Before the first response
// dynamfitData is {}, so disableInput already ghosts the error widget; both
// flags flip on the same commit. This drives which MODE the widget renders in
// (Relative Error % vs Error Scale), not whether it is enabled. Known stale
// window: loadPolymerFile() swaps the file without clearing dynamfitData, so
// this can read wrong for one request after replacing a 5-column file with a
// 3-column one — harmless, because every request carries both mode's values
// and the server consumes the one matching the upload's actual shape.
// Clearing first would flip disableInput mid-request and collapse the whole
// panel, which is worse than a briefly stale label.
const cHasErrorColumns = computed<boolean>(() => {
  const rows = dynamfitData.value?.['upload-data'];
  if (!Array.isArray(rows) || !rows.length) return false;
  const cols = Object.keys(rows[0] ?? {});
  return (
    cols.includes('Error') ||
    (cols.includes('E Storage Error') && cols.includes('E Loss Error'))
  );
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

// Everything the last successful /fit-shift returned, including which model it
// ran. Kept in the store rather than in transformMethod: the radio says what
// drives the transform, this says what was fitted, and in manual mode those are
// different answers. Cleared wherever the coefficients are.
const shiftFit = computed(() => store.getters['explorer/getDynamfitShiftCoefficients']);

// Methods
const resetAll = async (): Promise<void> => {
  resetting.value = true;

  // Unconditionally, not just when a file exists: the toast we most need to
  // clear is the one raised by a failed fit that never produced a file.
  store.commit('resetSnackbar');

  await resetChart();

  selectedProperty.value = 'frequency';
  currentItem.value = null;
  selectedItemProperty.value = null;
  currentPage.value = 1;
  totalPages.value = 0;
  results.value = {};
  limit.value = 2;
  dataType.value = undefined;
  transformMethod.value = '';
  ttsp.value = false;
  smoothness.value = percentToFraction(SMOOTHNESS_DEFAULT_PERCENT);
  relativeError.value = percentToFraction(RELATIVE_ERROR_DEFAULT_PERCENT);
  errorScale.value = ERROR_SCALE_DEFAULT;
  store.commit('explorer/setDynamfitManualFile', '');
  store.commit('explorer/resetDynamfitShiftCoefficients');
  cTtspApplied.value = false;
  cShiftModelOpen.value = true;
  cFormatOpen.value = false;
  selectedPolymerFile.value = '';
  useSample.value = false;
  updateBtn.value = false;
  sentRequest.value = false;
  showToolTip.value = false;
  skipCoeffWatcher.value = false;
  ttspTgValue.value = null;
  ttspC1Value.value = null;
  ttspC2Value.value = null;
  ttspTCValue.value = null;
  ttspEAValue.value = null;
  tgEstimated.value = false;
  c1Estimated.value = false;
  c2Estimated.value = false;
  tCEstimated.value = false;
  eAEstimated.value = false;
  store.commit('explorer/setDynamfitSourceType', '');
  // Start state: the four source buttons, per the panel's default.
  cDataSourceOpen.value = true;

  // Load-bearing: Vue flushes watcher callbacks asynchronously, so releasing
  // the flag synchronously would let every guarded watcher run anyway.
  await nextTick();
  resetting.value = false;
};

const downloadTitle = (): string => {
  const axis = selectedProperty.value === 'temperature' ? 'temperature (°C)' : 'frequency (Hz)';
  return (
    `An example tsv file of 3 columns: ${axis}, E' (Pa), E" (Pa).`
  );
};

// Must be called in the SAME synchronous block as the `fileUpload` write: the
// deep watcher on `dynamfit` triggers the fit, and Vue batches watcher
// callbacks per flush, so two writes in one tick cost exactly one request.
const applyDefaultPronyTerms = (fileText: string): void => {
  // Only the frequency domain has a span worth measuring — a temperature file
  // has no frequency axis until the ω-T transform has run. The store default
  // (100) is sent there and the server applies the same per-decade rule to the
  // master curve the transform produces, treating what we send as a ceiling
  // (see prony_terms_for_span in dynamfit2.py). Turning the input down still
  // reaches the fit; turning it up past what the span supports does not.
  if (selectedProperty.value !== 'frequency') return;
  const terms = computeDefaultPronyTerms(fileText);
  if (terms !== null) dynamfit.value.range = terms;
};

// Clear everything inside the ω-T segment — model, coefficients, estimate
// flags, shift file, stored fit results — without touching the checkbox
// itself. skipCoeffWatcher marks the writes as programmatic, keeping the
// transformMethod watcher's cascade (and the Update link) from firing over
// a reset.
const resetTtspSegment = (): void => {
  skipCoeffWatcher.value = true;
  transformMethod.value = '';
  ttspTgValue.value = null;
  ttspC1Value.value = null;
  ttspC2Value.value = null;
  ttspTCValue.value = null;
  ttspEAValue.value = null;
  tgEstimated.value = false;
  c1Estimated.value = false;
  c2Estimated.value = false;
  tCEstimated.value = false;
  eAEstimated.value = false;
  cTtspApplied.value = false;
  cShiftModelOpen.value = true;
  store.commit('explorer/setDynamfitManualFile', '');
  store.commit('explorer/resetDynamfitShiftCoefficients');
  // Release only after the watcher queue for this batch has flushed.
  nextTick(() => {
    skipCoeffWatcher.value = false;
  });
};

// Fresh data must not inherit the previous dataset's ω-T setup: the deep
// dynamfit watcher refits as soon as fileUpload is written, and any transform
// still armed here would be applied to the new file silently. Call this in
// the same synchronous block as the load so the reset and the file write land
// in one watcher flush.
const resetTtspForNewData = (): void => {
  skipCoeffWatcher.value = true;
  ttsp.value = false;
  resetTtspSegment();
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
    // The upload response only carries the mangled server name, so remember
    // what the user actually picked before dispatching.
    const originalName = file[0]?.name ?? '';
    const fileText = await file[0].text();
    const { fileName } = await store.dispatch('uploadFile', {
      file,
      isTemp: isTemp.value,
    });
    if (fileName) {
      resetTtspForNewData();
      applyDefaultPronyTerms(fileText);
      dynamfit.value.fileUpload = fileName;
      store.commit('explorer/setDynamfitSourceType', 'upload');
      store.commit('explorer/setDynamfitFileMeta', { label: '', originalName });
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
      updateBtn.value = true;
    }
  } catch (err) {
    const error = err as Error;
    store.commit('setSnackbar', {
      message: error?.message || 'Something went wrong',
      action: () => onShiftFileChange(e),
    });
  }
};

const resetChart = async (): Promise<void> => {
  const name = dynamfit.value.fileUpload || selectedItemProperty.value?.index;
  if (!name) return;

  store.commit('resetSnackbar');

  // Clear the client state whether or not the delete succeeded. Leaving the
  // store half-populated after a failed DELETE strands the user in a session
  // they cannot reset; orphaning a server-side temp file is the cheaper cost.
  if (!useSample.value) {
    await store.dispatch('deleteFile', {
      name,
      isTemp: isTemp.value,
    });
  }
  clearDynamfitData();
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

/**
 * Manual-mode chart update: best-effort /fit-shift, then the extract —
 * unconditionally. The previous version sent transform_method 'manual' to
 * /fit-shift (a guaranteed 400) and awaited it ahead of the extract in one
 * try, so uploading a shift file killed the charts along with the fit.
 *
 * refit distinguishes an Update click, which is the only thing that can change
 * what the shift fit sees, from a repaint that merely needs the same fit drawn
 * again.
 */
const fitShiftAndExtract = async (
  extractPayload: Record<string, unknown>,
  refit = true
): Promise<void> => {
  const fitModel = refit
    ? resolveShiftFitModel(transformMethod.value, ttspTgValue.value, ttspTCValue.value)
    : null;

  if (!refit) {
    // A repaint (prony terms, smoothness, relative error / error scale) changes nothing the
    // shift fit depends on, so re-running it would spend a round-trip to
    // reproduce numbers we already hold — and re-toast the "enter an anchor"
    // nudge below on every drag of the slider. Replay the stored fit instead so
    // the shift figure keeps its curve and its misfit stamp.
    const fitted = shiftFit.value;
    for (const key of ['C1', 'C2', 'Tg', 'Ea', 'TC', 'a_T_ref', 'chi2_reduced']) {
      if (fitted[key] != null) extractPayload[key] = fitted[key];
    }
  } else if (fitModel) {
    const fitPayload: Record<string, unknown> = {
      shift_file_name: mFile.value,
      transform_method: fitModel,
    };
    if (ttspTgValue.value) fitPayload.Tg = ttspTgValue.value;
    if (ttspC1Value.value) fitPayload.C1 = ttspC1Value.value;
    if (ttspC2Value.value) fitPayload.C2 = ttspC2Value.value;
    if (ttspTCValue.value) fitPayload.TC = ttspTCValue.value;
    if (ttspEAValue.value) fitPayload.Ea = ttspEAValue.value;

    try {
      const fitted = await store.dispatch('explorer/fetchFitShiftData', fitPayload);

      // Programmatic write-back: raise the guard before touching the refs, so
      // neither the coefficient watcher (which arms Update) nor the estimate
      // watchers react. Released after the watcher flush. The fitted MODEL is
      // deliberately not written into transformMethod — see
      // resolveExtractTransformMethod.
      skipCoeffWatcher.value = true;
      if (fitted.C1 != null) ttspC1Value.value = fitted.C1;
      if (fitted.C2 != null) ttspC2Value.value = fitted.C2;
      if (fitted.Tg != null) ttspTgValue.value = fitted.Tg;
      if (fitted.Ea != null) ttspEAValue.value = fitted.Ea;
      if (fitted.TC != null) ttspTCValue.value = fitted.TC;
      setTimeout(() => {
        skipCoeffWatcher.value = false;
      }, 0);

      if (fitted.C1 != null) extractPayload.C1 = fitted.C1;
      if (fitted.C2 != null) extractPayload.C2 = fitted.C2;
      if (fitted.Tg != null) extractPayload.Tg = fitted.Tg;
      if (fitted.Ea != null) extractPayload.Ea = fitted.Ea;
      if (fitted.TC != null) extractPayload.TC = fitted.TC;
      // Display-only passthroughs for the shift figure: the fitted curve's
      // vertical offset (a_T_ref, co-fitted by both models) and the fit-time
      // χ²/ν stamp. Deliberately absent from
      // the debounced coefficient watcher's payload, so hand-editing a
      // coefficient drops the then-stale readout.
      if (fitted.a_T_ref != null) extractPayload.a_T_ref = fitted.a_T_ref;
      if (fitted.chi2_reduced != null) extractPayload.chi2_reduced = fitted.chi2_reduced;
    } catch (err: unknown) {
      // Drop the previous fit with it: leaving one standing would keep drawing
      // its curve — and naming its model on the extract — beside a figure the
      // user just failed to refit.
      store.commit('explorer/resetDynamfitShiftCoefficients');
      const error = err as Error;
      store.commit('setSnackbar', {
        message: `Shift fit failed: ${error.message || 'unknown error'} — charts use the uploaded shift factors directly.`,
        duration: 5000,
        type: 'error',
      });
    }
  } else {
    // No anchor means no fit — including any earlier one, whose anchor the user
    // has since cleared.
    store.commit('explorer/resetDynamfitShiftCoefficients');
    displayInfo(
      'Enter Tg (WLF) or Tc (hybrid) to fit shift coefficients. Charts use the uploaded shift factors directly.',
      5000
    );
  }

  // 'hybrid'/'WLF' here draws that model's curve on the shift figure;
  // shift_file_name alongside it keeps the uploaded table driving the
  // transform. Both, deliberately — see resolveExtractTransformMethod.
  extractPayload.transform_method = resolveExtractTransformMethod(
    transformMethod.value,
    shiftFit.value.model
  );
  extractPayload.shift_file_name = mFile.value;
  await store.dispatch('explorer/fetchDynamfitData', extractPayload);
};

// `fromUpdate` says the user hit the Update button, as opposed to one of the
// watchers below repainting after a prony/smoothness/file change. Only that
// click is allowed to move the visualizer to the cross-domain tab: a repaint
// that happens to carry the already-applied transform should leave the user on
// whatever tab they were reading.
const updateChart = async (fromUpdate = false): Promise<void> => {
  // Belt and braces: the watchers below already guard, but this also covers the
  // handleSelect() shortcut just underneath.
  if (resetting.value) return;

  if ((selectedItemProperty.value?.index ?? -1) >= 0) {
    return await handleSelect();
  }

  const payload: Record<string, unknown> = {
    useSample: useSample.value,
    file_name: dynamfit.value.fileUpload,
    number_of_prony: dynamfit.value.range,
    model: dynamfit.value.model,
    domain: selectedProperty.value,
    smoothness: smoothness.value,
    relative_error: relativeError.value,
    error_scale: errorScale.value,
    // Say "no transform" out loud rather than leaving the key off. Both
    // branches below overwrite this when ω-T is checked; unchecked, it keeps
    // the server from inferring a shift model and returning a temperature
    // curve the user never asked for.
    transform_method: 'none',
  };

  if (isManual.value && mFile.value) {
    try {
      store.commit('explorer/setDynamfitDomain', selectedProperty.value);
      await fitShiftAndExtract(payload, fromUpdate);
      updateBtn.value = false;
      if (selectedProperty.value === 'temperature') cTtspApplied.value = true;
      if (fromUpdate) store.commit('explorer/triggerDynamfitTransformTab');
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
      if (ttspTCValue.value) payload.TC = ttspTCValue.value;
      if (eAEstimated.value) payload.Ea_estimate = eAEstimated.value;
      if (tCEstimated.value) payload.TC_estimate = tCEstimated.value;
    }

    // A previously uploaded shift file stays on the shift figure as the
    // Experiment markers for comparison against the model curve — display
    // only. shift_file_name would instead make the transform apply the
    // table, overriding the WLF/hybrid model the user just picked.
    if (mFile.value) payload.shift_reference_file = mFile.value;
  }

  store.commit('explorer/setDynamfitDomain', selectedProperty.value);
  await store.dispatch('explorer/fetchDynamfitData', payload);
  updateBtn.value = false;
  // Gate on what was actually SENT, not on transformMethod being set: with the
  // box unchecked the payload says 'none', and treating that as "applied" used
  // to collapse the config and (in the temperature domain) reveal fit controls
  // for a fit that doesn't exist.
  const transformSent = payload.transform_method !== 'none';
  if (selectedProperty.value === 'temperature') cTtspApplied.value = transformSent;
  if (transformSent) {
    if (fromUpdate) store.commit('explorer/triggerDynamfitTransformTab');
    cShiftModelOpen.value = false;
    nextTick(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }
};

const handleUpdate = async (): Promise<void> => {
  // The link is always rendered inside the Shift-Factor Model section now;
  // the disabled class ghosts it, this guard makes the state real.
  if (!updateBtn.value) return;
  updateBtn.value = false;
  await updateChart(true);
};

const goBack = (): void => {
  currentItem.value = null;
  selectedItemProperty.value = null;
};

const cSelectSource = (type: string): void => {
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
    const fileText = await blob.text();
    const fileName = filePath.split('/').pop() || 'polymer_data.txt';
    const file = new File([blob], fileName, { type: blob.type || 'text/plain' });
    const { fileName: uploadedName } = await store.dispatch('uploadFile', {
      file: [file],
      isTemp: isTemp.value,
    });
    if (uploadedName) {
      resetTtspForNewData();
      applyDefaultPronyTerms(fileText);
      dynamfit.value.fileUpload = uploadedName;
      store.commit('explorer/setDynamfitSourceType', sourceType);
      store.commit('explorer/setDynamfitFileMeta', {
        label: allPolymerFiles.find((f) => f.path === filePath)?.label ?? '',
        originalName: fileName,
      });
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
  if (sentRequest.value) {
    store.commit('setSnackbar', { message: 'Please wait & try after a few sec' });
    return;
  }

  if (!selectedItemProperty.value) {
    store.commit('setSnackbar', {
      message: 'Please select an item before proceeding.',
      type: 'error',
      duration: 4000,
    });
    return;
  }

  sentRequest.value = true;
  try {
    const payload = {
      id: currentItem.value?.id,
      domain: selectedProperty.value,
      index: selectedItemProperty.value.index,
      numberOfProny: dynamfit.value.range,
      model: dynamfit.value.model,
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
    resetTtspForNewData();
    store.commit('explorer/setDynamfitDomain', selectedProperty.value);
    store.commit('explorer/setDynamfitFileMeta', {
      label: currentItem.value?.title ?? '',
      originalName: '',
    });
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
  // Auto-check the estimate boxes only for a USER model change. A programmatic
  // flip (fitShiftAndExtract adopting the fitted model) raises skipCoeffWatcher
  // first; checking the boxes here would cascade into the estimate watcher
  // below, which nulls the inputs — wiping the freshly fitted coefficients.
  if (!skipCoeffWatcher.value && (newValue === 'WLF' || newValue === 'hybrid')) {
    // No Tg estimate in the frequency domain: a master curve's tan-δ peak is
    // a frequency, and the server 400s a frequency-domain Tg_estimate. The
    // checkbox is hidden there; Tg must be typed.
    if (!isFrequencyDomain.value) tgEstimated.value = true;
    c1Estimated.value = true;
    c2Estimated.value = true;
    if (newValue === 'hybrid') {
      tCEstimated.value = true;
      eAEstimated.value = true;
    }
  }
  // A user-picked model also orphans any fitted shift coefficients: leaving
  // them standing shows a stale a_T_ref/misfit readout (and a Shift Coeff
  // table mixing the new model's name with the old model's values) next to a
  // figure whose curve no longer comes from that fit.
  if (!skipCoeffWatcher.value) {
    store.commit('explorer/resetDynamfitShiftCoefficients');
  }
  if (newValue) updateBtn.value = true;
});

watch(
  dynamfit,
  (newVal) => {
    if (resetting.value) return;
    if (!newVal) return;
    updateChart();
  },
  { deep: true }
);

watch([smoothness, relativeError, errorScale], () => {
  if (resetting.value) return;
  updateChart();
});

watch(limit, () => {
  if (resetting.value) return;
  return search();
});

watch(selectedProperty, (v) => {
  if (v !== 'select') {
    cDataSourceOpen.value = true;
    cTtspApplied.value = false;
    cShiftModelOpen.value = true;
    if (v === 'frequency') {
      // Hybrid is ghosted in the frequency domain (no inverse transform), so
      // a hybrid setup cannot survive the switch; an armed Tg estimate would
      // 400 there for the same reason and just unchecks.
      if (transformMethod.value === 'hybrid') {
        resetTtspSegment();
      } else if (tgEstimated.value) {
        tgEstimated.value = false;
      }
    }
  }
});

watch(
  () => dynamfit.value?.fileUpload,
  (newVal, oldVal) => {
    // Reset must land on the source grid, not the upload sub-panel. The guard
    // leaves the intended "Change file" behaviour alone — confirmChangeFile in
    // DynamFit.vue never sets this flag.
    if (resetting.value) return;
    if (oldVal && !newVal) {
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

// Checking ω-T reveals the config and arms Update; nothing is sent until the
// button is hit. UNCHECKING acts immediately: it abandons the transform
// outright — segment reset (otherwise the hidden model would silently revive
// on the next check) and a repaint without the transform, emptying the
// figures that only the transform filled. Update applies config; withdrawing
// it should not need a second click. Programmatic writes (data-load reset,
// session reset) come flagged and stay silent.
watch(ttsp, (checked) => {
  if (resetting.value || skipCoeffWatcher.value) return;
  if (!checked) {
    resetTtspSegment();
    if (dynamfit.value?.fileUpload) updateChart();
    return;
  }
  updateBtn.value = true;
});

watch([tgEstimated, c1Estimated, c2Estimated, tCEstimated, eAEstimated], (cv, ov) => {
  if (cv[0] && cv[0] === true) ttspTgValue.value = null;
  if (cv[1] && cv[1] === true) ttspC1Value.value = null;
  if (cv[2] && cv[2] === true) ttspC2Value.value = null;
  if (cv[3] && cv[3] === true) ttspTCValue.value = null;
  if (cv[4] && cv[4] === true) ttspEAValue.value = null;
  if (!skipCoeffWatcher.value && cv !== ov) updateBtn.value = true;
});

watch(ttspTgValue, (v) => {
  if (v) tgEstimated.value = false;
});
watch(ttspC1Value, (v) => {
  if (v) c1Estimated.value = false;
});
watch(ttspC2Value, (v) => {
  if (v) c2Estimated.value = false;
});
watch(ttspTCValue, (v) => {
  if (v) tCEstimated.value = false;
});
watch(ttspEAValue, (v) => {
  if (v) eAEstimated.value = false;
});

// Coefficient edits are inert until Update: typing a value (or clearing one)
// only arms the button. The old debounced auto-extract here meant an
// unchecked-estimate + hand-typed Ea repainted the figures before Update was
// ever hit. Programmatic write-backs are excluded — they arrive under
// skipCoeffWatcher and already came from an update. This also covers the
// manual-mode Tg/TC anchors, which previously needed their own watcher.
watch([ttspTgValue, ttspC1Value, ttspC2Value, ttspTCValue, ttspEAValue], () => {
  if (resetting.value || skipCoeffWatcher.value) return;
  if (!ttsp.value) return;
  updateBtn.value = true;
});

// A freshly uploaded shift file is likewise inert (onShiftFileChange arms
// Update); the fit-then-extract runs when the user hits the button. Only the
// no-data hint fires here, since Update could not do anything yet.
watch(mFile, (newFile) => {
  if (!newFile) return;
  if (!ttsp.value) return;
  if (resetting.value) return;
  if (!dynamfit.value?.fileUpload) {
    displayInfo('Shift file loaded. Select or upload a data file to fit and see charts.', 5000);
  }
});

watch(
  () => store.state.explorer.dynamfitSurpriseRequest,
  () => {
    loadSurpriseFile();
  }
);
</script>
