<template>
  <div>
    <div class="wrapper u_margin-top-med md-layout">
      <div class="u_width--max">
        <h4 class="md-title">Comments</h4>
      </div>

      <div
        v-for="(item, i) in optionalChaining(() => loadComment.comments)"
        :key="i"
        :class="[
          isUserMessage(optionalChaining(() => item.user.displayName))
            ? 'md-alignment-bottom-right u--margin-left-auto'
            : 'md-alignment-top-left',
          'md-layout-item md-size-85 md-layout u_margin-top-med',
        ]"
      >
        <div
          v-if="!isUserMessage(optionalChaining(() => item.user.displayName))"
          class="u--margin-right-1"
        >
          <MdIcon>account_circle</MdIcon>
        </div>

        <div
          style="padding: 1.6rem; border: 1px solid #a2a5a9"
          :class="[
            isUserMessage(optionalChaining(() => item.user.displayName)) && 'u--margin-right-1',
            'md-layout-item u--b-rad',
          ]"
        >
          <p class="u--color-primary u--default-size">
            {{ item.user.givenName }} {{ item.user.surName }}
          </p>
          <p class="md-body-1">{{ item.comment }}</p>
          <p class="utility-align--right md-caption">{{ formatDate(item.createdAt) }}</p>
        </div>

        <div v-if="isUserMessage(optionalChaining(() => item.user.displayName))">
          <MdIcon>account_circle</MdIcon>
        </div>
      </div>
    </div>

    <div class="wrapper u_margin-top-med">
      <form>
        <MdField>
          <label>Message</label>
          <MdTextarea v-model="commentInput"></MdTextarea>
        </MdField>

        <button
          type="submit"
          @click.prevent="submitComment"
          class="btn btn--primary btn--noradius search_box_form_btn u--margin-bottommd u--margin-left-auto"
        >
          Submit
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useMutation, useQuery } from '@vue/apollo-composable';
import { LOAD_COMMENTS, POST_COMMENT } from '@/modules/gql/comment-gql';
import { useOptionalChaining } from '@/composables/useOptionalChaining';

// Component name for debugging
defineOptions({
  name: 'Comments',
});

// Props
interface Props {
  type: string;
  identifier: string;
}

const props = defineProps<Props>();

// Store
const store = useStore();

// Composables
const { optionalChaining } = useOptionalChaining();

// Reactive data
const commentInput = ref('');
const pageNumber = ref(1);
const pageSize = ref(20);

// Computed properties
const displayName = computed(() => store.getters['auth/displayName']);
const isAuth = computed(() => store.getters['auth/isAuthenticated']);

// Apollo queries
const { result: loadCommentResult, refetch: refetchComments } = useQuery(
  LOAD_COMMENTS,
  computed(() => ({
    input: {
      pageNumber: pageNumber.value,
      pageSize: pageSize.value,
      type: props.type,
      identifier: props.identifier,
    },
  })),
  {
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'ignore',
  }
);

const loadComment = computed(() => loadCommentResult.value?.loadComment || { comments: [] });

// Apollo mutations
const { mutate: postCommentMutation } = useMutation(POST_COMMENT, {
  errorPolicy: 'ignore',
});

// Methods
const isUserMessage = (arg: string) => {
  return arg === displayName.value;
};

const submitComment = async () => {
  if (commentInput.value.length > 0) {
    if (isAuth.value && props.identifier && props.type) {
      try {
        await postCommentMutation({
          input: {
            identifier: props.identifier,
            type: props.type,
            comment: commentInput.value,
          },
        });
      } catch (error) {
        return errorHandler(error);
      }
      commentInput.value = '';
      return refetchComments();
    } else {
      errorHandler({ graphQLErrors: 'You must be logged in to post comments' });
    }
  }
};

const errorHandler = (error: any) => {
  if (error.networkError) {
    const err = error.networkError;
    error.value = `Network Error: ${err?.response?.status} ${err?.response?.statusText}`;
  } else if (error.graphQLErrors) {
    error.value = error.graphQLErrors;
  }
  store.commit('setSnackbar', {
    message: error.value,
    duration: 10000,
  });
};

const isToday = (date: Date) => {
  return new Date().toDateString() === date.toDateString();
};

const isYesterday = (date: Date) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toDateString() === date.toDateString();
};

const formatDate = (date: string | number) => {
  const givenDate = new Date(parseInt(date.toString()));
  if (isToday(givenDate)) {
    return `Today ${givenDate.toLocaleTimeString()}`;
  }
  if (isYesterday(givenDate)) {
    return `Yesterday ${givenDate.toLocaleTimeString()}`;
  }
  return `${givenDate.toLocaleDateString()} ${givenDate.toLocaleTimeString()}`;
};

// Watchers
watch(
  () => props.identifier,
  () => {
    refetchComments();
  }
);

// Lifecycle
onMounted(() => {
  // Component is ready
});
</script>
