<script lang="ts">
import { defineComponent } from "vue"

export default defineComponent({
  props: {
    isOpen: Boolean,
    title: { type: String, required: true },
    className: String,
    cardClassName: String,
    titleClassName: String,
    bodyClassName: String,
  },
})
</script>

<template>
  <div
    :class="['modal', 'ob-modal', className || '', isOpen ? 'is-active' : '']"
  >
    <div class="modal-background-faded"></div>
    <div :class="['modal-card', cardClassName || '']">
      <header class="modal-card-head">
        <p :class="['modal-card-title', titleClassName || '']">
          {{ title }}
        </p>
      </header>
      <section :class="['modal-card-body', bodyClassName || '']">
        <slot></slot>
      </section>
      <footer v-if="$slots.actions" class="modal-card-foot">
        <slot name="actions"></slot>
      </footer>
    </div>
  </div>
</template>
