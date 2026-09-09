<template>
  <span ref="root" class="help-popover">
    <button
      ref="trigger"
      type="button"
      class="help-popover__trigger"
      :aria-expanded="open"
      :aria-label="`Help: ${label}`"
      @click="toggle"
    >
      <md-icon class="help-popover__icon">help_outline</md-icon>
    </button>
    <div v-if="open" class="help-popover__panel" role="note">
      <slot />
    </div>
  </span>
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue';

defineOptions({
  name: 'HelpPopover',
});

defineProps<{
  // Names the control being explained; read out as "Help: <label>".
  label: string;
}>();

const open = ref(false);
const root = ref<HTMLElement | null>(null);
const trigger = ref<HTMLButtonElement | null>(null);

const toggle = (): void => {
  open.value = !open.value;
};

// Containment beats @click.stop here: a stray stopPropagation elsewhere in the
// panel would otherwise leave the popover stuck open.
const onDocumentMouseDown = (event: MouseEvent): void => {
  if (!root.value?.contains(event.target as Node)) open.value = false;
};

const onDocumentKeydown = (event: KeyboardEvent): void => {
  if (event.key !== 'Escape') return;
  open.value = false;
  // Escape must not strand focus on a node that just disappeared.
  trigger.value?.focus();
};

watch(open, (isOpen) => {
  if (isOpen) {
    document.addEventListener('mousedown', onDocumentMouseDown);
    document.addEventListener('keydown', onDocumentKeydown);
  } else {
    document.removeEventListener('mousedown', onDocumentMouseDown);
    document.removeEventListener('keydown', onDocumentKeydown);
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onDocumentMouseDown);
  document.removeEventListener('keydown', onDocumentKeydown);
});
</script>

<style scoped>
.help-popover {
  position: relative;
  display: inline-flex;
  vertical-align: middle;
}

.help-popover__trigger {
  display: inline-flex;
  align-items: center;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  cursor: pointer;
  line-height: 1;
}

.help-popover__trigger:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

.help-popover__icon {
  font-size: 1.6rem !important;
  margin: 0 !important;
}

.help-popover__panel {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 30;
  width: 26rem;
  max-width: 70vw;
  margin-top: 0.4rem;
  padding: 0.8rem 1rem;
  background-color: #ffffff;
  color: #4b4b4b;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 3px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25);
  font-size: 1.3rem;
  font-weight: 400;
  line-height: 1.45;
  text-align: left;
  white-space: normal;
}
</style>
