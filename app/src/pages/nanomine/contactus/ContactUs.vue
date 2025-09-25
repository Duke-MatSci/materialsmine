<template>
  <div class="wrapper u_width--max viz-u-postion__rel">
    <div class="research">
      <div class="team_header">
        <h1 title="Research" class="visualize_header-h1 teams_header">Get in Touch</h1>
      </div>
      <Dialog :minWidth="40" :active="dialogBoxActive">
        <template #title>{{ dialogTitle }}</template>
        <template #content>{{ dialogContent }}</template>
        <template #actions>
          <md-button @click.prevent="closeDialogBox">Close</md-button>
        </template>
      </Dialog>
      <p class="mb-3">
        We'd love to help. Please fill out this quick form and we will be in touch.
      </p>
      <div class="contactus mb-3">
        <div v-if="errors.length">
          <h3>Please correct the following error(s):</h3>
          <ul>
            <li v-for="(error, index) in errors" :key="index">{{ error }}</li>
          </ul>
        </div>
        <form class="form" @submit.prevent="onSubmit" ref="contactForm">
          <div class="form__group">
            <input
              type="text"
              class="form__input"
              placeholder="Full Name (Required)"
              name="name"
              id="name"
              v-model="name"
              required
            />
            <label for="name" class="form__label">Full Name</label>
          </div>
          <div class="form__group">
            <input
              type="email"
              class="form__input"
              placeholder="Email Address (Required)"
              name="email"
              v-model="email"
              id="email"
              required
            />
            <label for="name" class="form__label">Email Address</label>
          </div>
          <div class="contactus_radios-text">For:</div>
          <ul class="contactus_radios">
            <li>
              <div class="form__radio-group">
                <input
                  type="radio"
                  class="form__radio-input"
                  v-model="platform"
                  id="nanomine"
                  value="nanomine"
                  required
                />
                <label for="nanomine" class="form__radio-label">
                  <span class="form__radio-button"></span>
                  Nanomine
                </label>
              </div>
            </li>
            <li>
              <div class="form__radio-group">
                <input
                  type="radio"
                  class="form__radio-input"
                  v-model="platform"
                  id="metamine"
                  value="metamine"
                />
                <label for="metamine" class="form__radio-label">
                  <span class="form__radio-button"></span>
                  Metamine
                </label>
              </div>
            </li>
          </ul>
          <div class="contactus_radios-text">I want to...</div>
          <ul class="contactus_radios">
            <li>
              <div class="form__radio-group">
                <input
                  type="radio"
                  class="form__radio-input"
                  v-model="contactType"
                  id="question"
                  value="QUESTION"
                  required
                />
                <label for="question" class="form__radio-label">
                  <span class="form__radio-button"></span>
                  Ask Question
                </label>
              </div>
            </li>
            <li>
              <div class="form__radio-group">
                <input
                  type="radio"
                  class="form__radio-input"
                  v-model="contactType"
                  id="report"
                  value="TICKET"
                />
                <label for="report" class="form__radio-label">
                  <span class="form__radio-button"></span>
                  Submit A Ticket
                </label>
              </div>
            </li>
            <li>
              <div class="form__radio-group">
                <input
                  type="radio"
                  class="form__radio-input"
                  v-model="contactType"
                  id="suggestion"
                  value="SUGGESTION"
                />
                <label for="suggestion" class="form__radio-label">
                  <span class="form__radio-button"></span>
                  Make Suggestion
                </label>
              </div>
            </li>
            <li>
              <div class="form__radio-group">
                <input
                  type="radio"
                  class="form__radio-input"
                  v-model="contactType"
                  id="comment"
                  value="COMMENT"
                />
                <label for="comment" class="form__radio-label">
                  <span class="form__radio-button"></span>
                  Make Comment
                </label>
              </div>
            </li>
          </ul>
          <div class="form__group">
            <textarea
              rows="4"
              class="form__input"
              placeholder="Write your message (Required)"
              name="message"
              v-model="message"
              id="message"
              required
            ></textarea>
            <label for="message" class="form__label">Message</label>
          </div>

          <div v-if="reducedName" class="md-layout md-alignment-center-space-between">
            <p class="md-body-2">{{ reducedName }}.....</p>

            <md-button class="md-icon-button" @click="removeImage">
              <md-icon>close</md-icon>
              <md-tooltip md-direction="top">Click to remove file</md-tooltip>
            </md-button>
          </div>
          <div class="form__group u_display-flex grid_gap-small">
            <template v-if="!fileName">
              <button v-if="!isAuth" class="btn btn--primary" @click.prevent="loginAlert">
                attach a file
              </button>

              <label v-else for="attach_file">
                <div class="form__file-input">
                  <div class="md-theme-default">
                    <label class="btn btn--primary" for="attach_file">attach a file</label>
                    <div class="md-file">
                      <input
                        :disabled="!isAuth"
                        @change="onInputChange"
                        accept=".png, .jpg, .jpeg, .tiff, .tif, .csv, .zip, .xls, .xlsx"
                        type="file"
                        name="attach_file"
                        id="attach_file"
                      />
                    </div>
                  </div>
                </div>
              </label>
            </template>

            <button class="btn btn--primary" type="submit">Submit Form</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import Dialog from '@/components/Dialog.vue';

// Component name for debugging
defineOptions({
  name: 'Contact',
});

// Store and router
const store = useStore();
const router = useRouter();

// Template refs
const contactForm = ref<HTMLFormElement>();

// Reactive data
const dialogTitle = ref('');
const dialogContent = ref('');
const dialogType = ref('');
const name = ref<string | null>(null);
const email = ref<string | null>(null);
const contactType = ref<string | null>(null);
const platform = ref<string | null>(null);
const message = ref<string | null>(null);
const errors = ref<string[]>([]);
const fileName = ref('');

// Computed properties
const dialogBoxActive = computed(() => store.getters.dialogBox);
const isAuth = computed(() => store.getters['auth/isAuthenticated']);

const reducedName = computed(() => {
  const file = fileName.value;
  const arr = file.split('/');
  return arr.length > 3 ? arr[3].substring(0, 40) : file;
});

// Methods
const onInputChange = async (e: Event) => {
  displayInfo('Uploading File...');
  const target = e.target as HTMLInputElement;
  const file = [...(target.files || [])];

  const isFileValid = validateFile(file[0]?.name);

  if (!isFileValid) return displayInfo('Unsupported file format');

  try {
    if (isAuth.value) {
      const { fileLink } = await store.dispatch('uploadFile', {
        file,
        isTemp: true,
      });
      if (fileLink) {
        fileName.value = fileLink;
        displayInfo('Upload Successful', 1500);
      }
    } else {
      return displayInfo('To upload a file, you need to log in', 3000);
    }
  } catch (err: any) {
    store.commit('setSnackbar', {
      message: err?.message || 'Something went wrong',
      action: () => onInputChange(e),
    });
  } finally {
    target.value = '';
  }
};

const displayInfo = (msg: string, duration?: number) => {
  if (msg) {
    store.commit('setSnackbar', {
      message: msg,
      duration: duration ?? 3000,
    });
  }
};

const validateForm = () => {
  errors.value = [];
  if (!name.value) {
    errors.value.push('Name required');
  }
  if (!email.value) {
    errors.value.push('Email required');
  } else if (!validEmail(email.value)) {
    errors.value.push('Valid email required.');
  }

  if (!contactType.value) {
    errors.value.push('Contact type required');
  }

  if (!message.value || message.value.trim() === '') {
    errors.value.push('Message required');
  }
  if (!platform.value) {
    errors.value.push('Please select nanomine or metamine platform');
  }

  if (!errors.value.length) {
    return true;
  }
};

const validEmail = (email: string) => {
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
};

const validateFile = (fileName: string) => {
  if (!fileName) return false;
  const supportedTypes = ['png', 'jpg', 'jpeg', 'tiff', 'tif', 'csv', 'zip', 'xls', 'xlsx'];
  const fileExtention = fileName.split('.').at(-1);
  if (!fileExtention) return false;
  return supportedTypes.includes(fileExtention);
};

const resetForm = () => {
  if (contactForm.value) {
    contactForm.value.reset();
  }
  errors.value = [];
};

const openDialogBox = (element: { type: string; header: string; content: string }) => {
  dialogType.value = element.type;
  dialogTitle.value = element.header;
  dialogContent.value = element.content;
  store.commit('setDialogBox');
};

const closeDialogBox = () => {
  store.commit('setDialogBox');
};

const onSubmit = async () => {
  validateForm();
  if (errors.value.length) {
    return;
  }
  try {
    const payload = {
      fullName: name.value,
      email: email.value,
      purpose: contactType.value,
      message: message.value,
      attachments: fileName.value,
    };
    const query = await store.dispatch('contact/contactUs', payload);
    if (!query) {
      throw new Error('Failed to Submit');
    }
    openDialogBox({
      type: 'Success',
      header: 'Submitted successfully',
      content: 'We will get back to you shortly',
    });
    resetForm();
  } catch (error: any) {
    store.commit(
      'setSnackbar',
      {
        message: error?.message ?? 'Something went wrong!',
        action: () => onSubmit(),
      },
      { root: true }
    );
  }
};

const removeImage = async () => {
  const name = fileName.value;
  if (!name) return;

  const { deleted, error } = await store.dispatch('deleteFile', {
    name,
    isTemp: true,
  });
  if (!error && deleted) {
    fileName.value = '';
    return;
  }
  store.commit('setSnackbar', {
    message: 'Something went wrong',
    action: () => removeImage(),
  });
};

const loginAlert = () => {
  displayInfo('Login Required: Login is required before uploading files.');
};

// Watchers
watch(dialogBoxActive, (newVal, oldVal) => {
  if (oldVal && !newVal && dialogType.value === 'Success') {
    router.push('/nm');
  }
});

// Lifecycle
onMounted(() => {
  store.commit('setAppHeaderInfo', {
    icon: 'mail',
    name: 'Contact Us',
  });
});
</script>

<style scoped>
li {
  list-style: none;
}

.mb-3 {
  margin-bottom: 1.5rem;
}
</style>
