<template>
  <tool-card class="md-layout-item tool-card" name="Dynamfit" v-if="card">
    <template #image>
      <img src="@/assets/img/nanomine/dynamfit.png" alt="Dynamfit">
    </template>
    <template #actions>
      <router-link to="Dynamfit">
        <md-button class="md-raised md-primary">
          Launch
        </md-button>
      </router-link>
    </template>
    <template #title>
      Dynamfit
    </template>
    <template #content>
      Dynamfit is a sign control algorithm for Prony Series fitting. This program
      fits a viscoelastic mastercurve from DMA experiments with a Prony Series.
      The Prony Series coefficients can be used as baseline properties for the
      matrix in a FEA simulation of nanocomposites.
    </template>
  </tool-card>
  <div class="md-layout tool_page md-alignment-top-center" v-else>
    <div class="md-layout-item md-size-60 md-layout md-alignment-top-center md-gutter">
      <dialog-box :active="dialogBoxActive">
        <template #title>{{ dialog.title }}</template>
        <template #content>{{ dialog.content }}</template>
        <template #actions>
          <md-button @click.prevent="toggleDialogBox">Close</md-button>
        </template>
      </dialog-box>
      <div class="team_header">
        <h1 class="visualize_header-h1 teams_header">
          Dynamfit - Prony Series coefficient fitting
        </h1>
      </div>
      <div v-if="examplePage === 'exampleInput'" key="example-input-header">
        <h3>An Example - Part I</h3>
        <p>
          Please click <a href="/assets/EXAMPLE.X_T">here</a> to download example
          data file. This file is a .X_T file with three columns per line
          (Frequency, X', X'').
        </p>
      </div>
      <div v-else-if="examplePage === 'inputTest'" key="input-test-header">
        <h3>An Example - Part II</h3>
        <p class="text-xs-left">
          In this page, you will learn to use and modify all the parameters
          available in Dynamfit. An email will be sent to your registered email
          address once the job is completed. You will then be able to compare the
          fitting results with the example given in the previous page.
        </p>
      </div>
      <div v-else key="no-example">
        <h3>Description</h3>
        <p>
          This program fits a viscoelastic mastercurve (tan &#948; vs. frequency)
          from DMA experiments with a Prony Series. The Prony Series coefficients
          can be used as baseline properties for the matrix in a FEA simulation of
          nanocomposites.
        </p>
        <p>
          If this tool is new to you, please click
          <md-button class="md-primary md-raised" @click="examplePage = 'exampleInput'">
            Example of Dynamfit
          </md-button>
          to get familiar with this tool.
        </p>
      </div>
      <div>
        <h3>Instructions</h3>
        <ol class="md-layout">
          <div class="md-layout-item md-size-100">
            <li>
              Upload #.X_T file containing three values per line (Frequency X'
              X''):
            </li>
            <div v-if="examplePage === 'noExample' || examplePage === 'inputTest'">
              <p v-if="examplePage === 'noExample'">Upload #.X_T file here:</p>
              <p v-else-if="examplePage === 'inputTest'">
                Upload "EXAMPLE.X_T" here:
              </p>
              <md-button class="md-primary md-raised" @click="pickTemplate">Browse</md-button>
              <input type="file" style="display: none" accept=".X_T" ref="myTemplate" @change="onTemplatePicked" />
              <md-list v-model="templateName" subheader="true" v-if="templateUploaded">
                <md-list-item :key="templateName">
                  <md-icon class="md-primary">check_circle_outline</md-icon>
                  <span class="md-list-item-text" v-text="templateName"></span>
                </md-list-item>
              </md-list>
            </div>
            <div v-else-if="examplePage === 'exampleInput'">
              <p>
                EXAMPLE.X_T is preloaded in this example. For general use, you
                will need to upload your .X_T file.
              </p>
            </div>
          </div>
          <div class="md-layout-item md-size-100">
            <li>Factor For Weighting X' and X'' data:</li>
            <div v-if="examplePage === 'noExample' || examplePage === 'inputTest'">
              <p>0.0 Means Consider Only X'' Data</p>
              <p>2.0 Means Consider Only X' Data</p>
              <p>1.0 Means Weight Evenly X' and X''</p>
              <p>All Other Values Represent Uneven Weighting</p>
            </div>
            <md-field>
              <label for="weight">Enter the weighting parameter you wish to use:</label>
              <md-input id="weight" v-model="weight" placeholder="1.0" v-bind:disabled="examplePage === 'exampleInput'">
              </md-input>
            </md-field>
          </div>
          <div class="md-layout-item md-size-100">
            <li>Standard deviation:</li>
            <div>
              <md-radio class="md-primary" v-model="stdRadios" value="std1"
                v-bind:disabled="examplePage === 'exampleInput'">Data point values</md-radio>
              <md-radio class="md-primary" v-model="stdRadios" value="std2"
                v-bind:disabled="examplePage === 'exampleInput'">Unity</md-radio>
            </div>
          </div>
          <div class="md-layout-item md-size-100">
            <li>
              Number of elements (should be larger than 2 and should NOT be too
              large):
            </li>
            <md-field>
              <label for="nEle">Enter the number of elements to use:</label>
              <md-input id="nEle" v-model="nEle" placeholder="20" v-bind:disabled="examplePage === 'exampleInput'">
              </md-input>
            </md-field>
          </div>
          <div class="md-layout-item md-size-100">
            <li>Data type:</li>
            <div>
              <md-radio class="md-primary" v-model="dtRadios" value="dt1"
                v-bind:disabled="examplePage === 'exampleInput'">
                Compliance</md-radio>
              <md-radio class="md-primary" v-model="dtRadios" value="dt2"
                v-bind:disabled="examplePage === 'exampleInput'">
                Modulus</md-radio>
            </div>
          </div>
        </ol>
      </div>
      <div v-if="examplePage === 'exampleInput'" class=" md-layout md-alignment-top-center">
        <h3 class="md-layout-item md-size-100">
          The fitting result is shown below:
        </h3>
        <div class="md-layout-item md-size-50">
          <h4>Epsilon Prime</h4>
          <img src="@/assets/img/nanomine/dynamfit_example_E.png" />
        </div>
        <div class="md-layout-item md-size-50">
          <h4>Epsilon Double Prime</h4>
          <img src="@/assets/img/nanomine/dynamfit_example_EE.png" />
        </div>
        <div class="md-layout-item md-size-100">
          <p>
            Now please click the arrow to advance to the next part of the example,
            where you can change the parameters of simulation, compare your result
            with result above and get familiar with the tool.
          </p>
          <md-button class="md-primary md-raised" @click="examplePage = 'inputTest'">
            Part II<md-icon>arrow_forward</md-icon>
          </md-button>
        </div>
      </div>
      <div>
        <md-button v-if="examplePage === 'noExample' || examplePage === 'inputTest'" @click="submit()"
          class="md-primary md-raised">
          Run Simulation
        </md-button>
        <md-button v-if="examplePage === 'inputTest'" @click="examplePage = 'exampleInput'" class="md-primary md-raised">
          <md-icon>arrow_back</md-icon>Part I
        </md-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeMount, onMounted } from 'vue';
import { useStore } from 'vuex';
import { JobMgr } from '@/modules/JobMgr';
import Dialog from '@/components/Dialog.vue';
import ToolCard from '@/components/nanomine/ToolCard.vue';

defineOptions({
  name: 'Dynamfit',
});

interface Props {
  card?: boolean;
}

interface DialogState {
  title: string;
  content: string;
  minWidth?: number;
}

interface FileTemplate {
  fileName: string;
  fileUrl: string;
}

const props = withDefaults(defineProps<Props>(), {
  card: false
});

const store = useStore();

// Refs
const myTemplate = ref<HTMLInputElement | null>(null);
const templateName = ref<string>('');
const templateUrl = ref<string>('');
const template = ref<FileTemplate | null>(null);
const templateUploaded = ref<boolean>(false);
const weight = ref<number>(1.0);
const stdRadios = ref<string>('');
const nEle = ref<number>(20);
const dtRadios = ref<string>('');
const jobId = ref<string>('');
const examplePage = ref<string>('noExample');
const dialog = ref<DialogState>({
  title: '',
  content: ''
});
const references = ref<string[]>([
  '10.1023/A:1009772018066'
]);

// Computed
const dialogBoxActive = computed<boolean>(() => store.getters.dialogBox);

// Methods
const toggleDialogBox = (): void => {
  store.commit('setDialogBox');
};

const setLoading = (): void => {
  store.commit('isLoading');
};

const resetLoading = (): void => {
  store.commit('notLoading');
};

const pickTemplate = (): void => {
  myTemplate.value?.click();
};

const resetTemplate = (): void => {
  templateName.value = '';
  templateUrl.value = '';
  template.value = null;
  templateUploaded.value = false;
};

const onTemplatePicked = (e: Event): void => {
  resetTemplate();
  const target = e.target as HTMLInputElement;
  const files = target.files;
  const file: FileTemplate = {} as FileTemplate;
  const f = files?.[0];
  if (f !== undefined) {
    templateName.value = f.name;
    file.fileName = templateName.value;
    const fr = new FileReader();
    fr.readAsDataURL(f);
    fr.addEventListener('load', () => {
      templateUrl.value = fr.result as string;
      file.fileUrl = templateUrl.value;
      template.value = file;
      templateUploaded.value = true;
    });
  } else {
    resetTemplate();
  }
};

const submit = (): void => {
  if (!templateUploaded.value) {
    if (examplePage.value === 'inputTest') {
      renderDialog('Upload Error', 'Please upload EXAMPLE.X_T.');
    } else {
      renderDialog('Upload Error', 'Please upload the .X_T file.');
    }
    return;
  }
  if (weight.value === null || weight.value.toString() === '') {
    renderDialog(
      'Input Error',
      'Please input the weighting parameter.'
    );
    return;
  }
  if (stdRadios.value === '') {
    renderDialog(
      'Input Error',
      'Please select the type of the standard deviation.'
    );
    return;
  }
  if (nEle.value === null || nEle.value.toString() === '') {
    renderDialog(
      'Input Error',
      'Please input the number of Prony elements.'
    );
    return;
  }
  if (dtRadios.value === '') {
    renderDialog('Input Error', 'Please select the data type.');
    return;
  }
  setLoading();
  const jm = new JobMgr();
  jm.setJobType('dynamfit');
  jm.setJobParameters({
    templateName: templateName.value,
    weight: weight.value,
    stddev: stdRadios.value,
    nEle: nEle.value,
    dt: dtRadios.value
  });
  jm.addInputFile(templateName.value, templateUrl.value);
  return jm.submitJob(
    (jobIdResult: string) => {
      jobId.value = jobIdResult;
      resetLoading();
      renderDialog(
        'Dynamfit Job Submitted Successfully',
        `Your uploader job is: ${jobIdResult}
         You should receive an email with a link to the job output.`
      );
    },
    (errCode: number, errMsg: string) => {
      renderDialog(
        'Error Submitting Files for Upload',
        `error code: ${errCode}
        message: ${errMsg}`
      );
      resetLoading();
    }
  );
};

const displayExample = (example: string): void => {
  const examplePages = ['noExample', 'exampleInput', 'inputTest'];
  if (examplePages.includes(example)) {
    examplePage.value = example;
  } else {
    examplePage.value = 'noExample';
  }
};

const renderDialog = (title: string, content: string, minWidth?: number): void => {
  dialog.value = {
    title,
    content,
    minWidth
  };
  toggleDialogBox();
};

// Watchers
watch(examplePage, (newValue) => {
  if (newValue === 'exampleInput') {
    stdRadios.value = 'std1';
    dtRadios.value = 'dt2';
  } else {
    stdRadios.value = '';
    dtRadios.value = '';
  }
});

// Lifecycle
onBeforeMount(() => {
  if (!store.getters['auth/isAuthenticated'] && !props.card) {
    renderDialog('Authorization Error', 'Please log in.');
  }
});

onMounted(() => {
  if (!props.card) {
    store.commit('setAppHeaderInfo', {
      icon: 'workspaces',
      name: 'Dynamfit'
    });
  }
});
</script>
