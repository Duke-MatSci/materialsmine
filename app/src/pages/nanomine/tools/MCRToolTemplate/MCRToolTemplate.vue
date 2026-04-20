<template>
  <tool-card class="md-layout-item md-size-45 md-medium-size-100 tool-card" :name="name" v-if="card">
    <template v-for="(_, slotName) in $slots" v-slot:[slotName]>
      <slot :name="slotName" v-if="cardSlots.includes(slotName)"></slot>
    </template>
  </tool-card>
  <div class="tool_page md-layout md-alignment-top-center" v-else>
    <div class="md-layout-item md-size-60 md-layout md-alignment-top-center md-gutter">
      <dialog-box :active="dialogBoxActive">
        <template #title>{{ dialog.title }}</template>
        <template #content v-html="dialog.content">{{ dialog.content }}</template>
        <template #actions>
          <md-button @click.prevent="toggleDialogBox">Close</md-button>
        </template>
      </dialog-box>
      <div :class="`section_${name}`" class="" :key="name">
        <div class="team_header md-layout-item md-size-100">
          <h1 class="visualize_header-h1 teams_header">
            <slot name="title"></slot>
          </h1>
        </div>
        <div class="md-layout-item md-size-100">
          <div v-if="$slots.description">
            <h3>Description</h3>
            <slot name="description"></slot>
          </div>
          <div v-if="$slots['input-options']">
            <h3>Input Options</h3>
            <slot name="input-options"></slot>
          </div>
        </div>

        <div v-if="$slots.results"
          class="md-layout-item md-size-100 md-layout md-alignment-top-left result_container">
          <h3>Results</h3>
          <slot name="results"></slot>
        </div>

        <h3>Image Upload</h3>
        <ImageUpload class='imageUpload' @setFiles="setFiles" @set-selectors="setSelectors" :aspectRatio="job.aspectRatio"
          :selects='job.selects' :collectDimensions='job.getImageDimensions' :acceptFileTypes="job.acceptableFileTypes">
        </ImageUpload>

        <md-button class="md-layout-item md-size-100 md-primary md-raised" @click="submit()">
          <slot name="submit-button">
            Submit
          </slot>
        </md-button>


        <div class="md-layout-item md-size-100" v-if='results.submitted && useWebsocket'>
          <h3>Submission Results</h3>
          <div v-if='results.obtained'>
            <md-button class='resultsButton md-layout-item md-size-100 md-primary' @click="download()">
              <span v-if='results.downloading'>Creating zipped file...</span>
              <span v-else>Download results</span>
            </md-button>
            <div class='resultsContainer'>
              <div class='resultsSubcontainer'>
                <h4 class='resultsSubtitle'>Inputs</h4>
                <div v-for='(file, index) in results.files' :key='index'>
                  <img class='resultsImage' :src='getResultImage(index, "input")'>
                </div>
              </div>
              <div class='resultsSubcontainer'>
                <h4 class='resultsSubtitle'>Outputs</h4>
                <div v-for='(file, index) in results.files' :key='index'>
                  <img class='resultsImage' :src='getResultImage(index, "output")'>
                </div>
              </div>
            </div>
          </div>
          <spinner v-else></spinner>
        </div>
      </div>
      <div class="md-layout-item md-layout md-alignment-top-center reference-container">
        <slot name="references"></slot>
        <reference-container v-if="!$slots.references" :references="referenceList" :openOnLoad="false">
        </reference-container>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeMount, watch, getCurrentInstance } from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';
import ReferenceContainer from '@/components/nanomine/ReferenceContainer.vue';
import Dialog from '@/components/Dialog.vue';
import ImageUpload from '@/components/nanomine/ImageUpload.vue';
import { JobMgr } from '@/modules/JobMgr';
import ToolCard from '@/components/nanomine/ToolCard.vue';
import Spinner from '@/components/Spinner.vue';
import Jszip from 'jszip';

defineOptions({
  name: 'MCRToolTemplate',
});

interface Props {
  card?: boolean;
  name: string;
  job?: JobConfig;
  header?: string;
  referenceList?: string[];
}

interface JobConfig {
  aspectRatio: 'square' | 'free';
  getImageDimensions: boolean;
  submitJobTitle: string;
  submitJobType?: string;
  acceptableFileTypes: string;
  useWebsocket: boolean;
  selects?: SelectOption[];
  jobTitle?: string;
}

interface SelectOption {
  title: string;
  submitJobTitle: string;
  options?: string[];
}

interface FileData {
  name: string;
  url: string;
  fileType: string;
}

interface ResultFile {
  input: string;
  output: string;
}

interface DialogState {
  title: string;
  content: string;
  reason: string;
}

const props = withDefaults(defineProps<Props>(), {
  card: false,
  job: () => ({
    aspectRatio: 'free' as const,
    getImageDimensions: false,
    submitJobTitle: '',
    acceptableFileTypes: '',
    useWebsocket: false
  }),
  referenceList: () => []
});

const store = useStore();
const route = useRoute();
const instance = getCurrentInstance();

// Data
const jobId = ref<string>('');
const dialog = ref<DialogState>({
  title: '',
  content: '',
  reason: ''
});
const files = ref<FileData | undefined>(undefined);
const selectedOptions = ref<Record<string, any>>({});
const useWebsocket = ref<boolean>(false);
const results = ref({
  obtained: false,
  files: undefined as ResultFile[] | undefined,
  uri: undefined as string | undefined,
  jobid: undefined as string | undefined,
  submitted: false,
  downloading: false
});
const cardSlots = ref<string[]>(['image', 'title', 'content', 'actions']);
const toolId = ref<string>('');

// Computed
const dialogBoxActive = computed<boolean>(() => store.getters.dialogBox);

// Methods
const resetContent = (): void => {
  if (!props.card && props.header) {
    store.commit('setAppHeaderInfo', {
      icon: 'workspaces',
      name: props.header
    });
  }
};

const toggleDialogBox = (): void => {
  store.commit('setDialogBox');
};

const renderDialog = ({ title, content, reason }: { title: string; content: string; reason: string }): void => {
  if (!dialogBoxActive.value) {
    dialog.value = {
      title,
      content,
      reason
    };
  }
  toggleDialogBox();
};

const successDlg = (): void => {
  let contentSockets;
  if (props.job?.useWebsocket) {
    contentSockets =
      'Please stay on this page. Results may take up to a few minutes to load.';
  } else {
    contentSockets =
      'You should receive an email with a link to the job output.';
  }
  renderDialog({
    title: `${props.job?.jobTitle || props.job?.submitJobTitle} Job Submitted Successfully`,
    content: `Your ${props.job?.submitJobTitle} job is: ${toolId.value}<br />${contentSockets}`,
    reason: 'successDlg'
  });
};

const uploadError = (errorMsg: string): void => {
  renderDialog({
    title: 'Upload Error',
    content: errorMsg,
    reason: 'uploadError'
  });
};

const download = async (): Promise<void> => {
  const jszipObj = new Jszip();
  results.value.downloading = true;

  function getBase64 (image: HTMLImageElement, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): Promise<string> {
    return new Promise((resolve, reject) => {
      image.onload = function () {
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.drawImage(image, 0, 0);
        resolve(canvas.toDataURL());
      };
    });
  }

  // add images to zip file
  if (results.value.files) {
    for (let i = 0; i < results.value.files.length; i++) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const image = new Image();
      image.src = results.value.uri + '/' + results.value.files[i].output;

      const base64Image = await getBase64(image, canvas, ctx);

      jszipObj.file(
        'output-' + (i + 1) + '.jpg',
        base64Image.split(',').pop() || '',
        { base64: true }
      );
    }
  }

  // create zip file & download
  jszipObj
    .generateAsync({ type: 'base64', compression: 'DEFLATE' })
    .then(function (base64) {
      const downloadFile = 'data:application/zip;base64,' + base64;
      const link = document.createElement('a');
      link.href = downloadFile;
      link.download = 'output.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      results.value.downloading = false;
    });
};

const getResultImage = (index: number, type: 'input' | 'output'): string => {
  if (!results.value.files || !results.value.uri) return '';
  if (type === 'input') {
    return results.value.uri + '/' + results.value.files[index].input;
  } else {
    return results.value.uri + '/' + results.value.files[index].output;
  }
};

const setFiles = (fileData: FileData): void => {
  files.value = fileData; // the actual file object
};

const setSelectors = (options: Record<string, any>): void => {
  selectedOptions.value = options;
};

const setLoading = (): void => {
  store.commit('isLoading');
};

const resetLoading = (): void => {
  store.commit('notLoading');
};

const submit = (): void => {
  setLoading();

  if (files.value === undefined) {
    renderDialog({
      title: 'File Error',
      content: 'Please select a file to process.',
      reason: 'noFiles'
    });
    resetLoading();
    return;
  }

  const jm = new JobMgr();
  jm.setJobType(props.job?.submitJobTitle || '');

  const jobParameters: Record<string, any> = {
    InputType: files.value.fileType,
    useWebsocket: useWebsocket.value
  }; // Figure out which file type

  for (const key in selectedOptions.value) {
    if (key === 'phase') {
      jobParameters[key] = phaseToString(selectedOptions.value[key]);
    } else if (key === 'dimensions') {
      jobParameters[key] = dimensionToString(
        selectedOptions.value[key]
      );
    } else {
      jobParameters[key] = selectedOptions.value[key];
    }
  }

  if (props.job && 'submitJobType' in props.job) {
    jobParameters.jobtype = props.job.submitJobType;
  }

  jm.setJobParameters(jobParameters);
  jm.addInputFile(files.value.name, files.value.url);

  return jm.submitJob(
    (jobIdResult: string) => {
      // Socket integration - needs to be set up with Vue 3 socket.io plugin
      if (instance?.appContext.config.globalProperties.$socket) {
        instance.appContext.config.globalProperties.$socket.emit('newJob', jobIdResult);
      }
      results.value.submitted = true;
      results.value.obtained = false;
      toolId.value = jobIdResult;
      resetLoading();
      successDlg();
    },
    (errCode: number, errMsg: string) => {
      renderDialog({
        title: 'Job Error',
        content: `error: ${errCode} msg: ${errMsg}`,
        reason: `jobError-${errCode}`
      });
      resetLoading();
    }
  );
};

const phaseToString = (phaseObj: Record<string, { x_offset: number; y_offset: number }>): string => {
  let returnString = '';
  for (const key in phaseObj) {
    if (returnString !== '') {
      returnString += '|';
    }
    returnString += phaseObj[key].x_offset + '*' + phaseObj[key].y_offset;
  }
  return returnString;
};

const dimensionToString = (dimensionObj: { ratio?: number | null }): string => {
  if ('ratio' in dimensionObj === false) {
    return '1';
  } else if (dimensionObj.ratio === null || dimensionObj.ratio === 0) {
    return '1';
  }
  return dimensionObj.ratio.toString();
};

// Socket handlers - these would need to be set up with a Vue 3 socket.io plugin
// For now, they're commented out as placeholders
const setupSocketHandlers = (): void => {
  // Socket integration would go here
  // Example:
  // socket.on('finished', (data) => { ... })
  // socket.on('hello', (data) => { ... })
};

// Watchers
watch(() => route.path, () => {
  resetContent();
});

// Lifecycle
onBeforeMount(() => {
  if (!store.getters['auth/token']) {
    renderDialog({
      title: 'Authorization Error',
      content: 'Login is required, please log in',
      reason: 'loginRequired'
    });
  }
});

onMounted(() => {
  resetContent();
  // Socket integration
  if (instance?.appContext.config.globalProperties.$socket) {
    instance.appContext.config.globalProperties.$socket.emit('testConnection');
  }
  setupSocketHandlers();
});
</script>
