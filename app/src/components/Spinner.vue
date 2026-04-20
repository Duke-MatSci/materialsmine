<template>
  <div class="u_display-flex spinner" v-show="loading">
    <div
      v-if="text"
      style="font-size: 1.5rem; font-weight: 200; flex: 0 0 auto; margin-bottom: 2rem"
    >
      {{ text }} <br />
    </div>
    <div style="flex: 0 0 auto">
      <span class="sync" :style="[spinnerStyle, spinnerDelay1]"></span>
      <span class="sync" :style="[spinnerStyle, spinnerDelay2]"></span>
      <span class="sync" :style="[spinnerStyle, spinnerDelay3]"></span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

// Component name for debugging
defineOptions({
  name: 'Spinner',
});

// Props
interface Props {
  loading?: boolean;
  color?: string;
  size?: string;
  margin?: string;
  radius?: string;
  text?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  loading: true,
  color: '#08233c',
  size: '15px',
  margin: '2px',
  radius: '100%',
  text: null,
});

// Computed
const spinnerStyle = computed(() => ({
  backgroundColor: props.color,
  height: props.size,
  width: props.size,
  borderRadius: props.radius,
  margin: props.margin,
  display: 'inline-block',
  animationName: 'spinerAnimation',
  animationDuration: '1.25s',
  animationIterationCount: 'infinite',
  animationTimingFunction: 'ease-in-out',
  animationFillMode: 'both',
}));

const spinnerDelay1 = computed(() => ({
  animationDelay: '0.07s',
}));

const spinnerDelay2 = computed(() => ({
  animationDelay: '0.14s',
}));

const spinnerDelay3 = computed(() => ({
  animationDelay: '0.21s',
}));
</script>

<style>
.spinner {
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  align-content: center;
  flex-direction: column;
}
@keyframes spinerAnimation {
  33% {
    transform: translateY(10px);
  }
  66% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(0);
  }
}
</style>
