<script lang="ts">
import { defineComponent } from "vue"

export default defineComponent({
  props: {
    label: String,
    icon: String,
  },
})
</script>

<template>
  <span class="ob-customisable-button-inner">
    <i v-if="!!icon" class="material-icons">{{ icon }}</i>
    <span>{{ label }}</span>
  </span>
</template>
