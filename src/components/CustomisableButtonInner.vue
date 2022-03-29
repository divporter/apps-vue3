<script setup lang="ts">
import { defineProps } from "vue"

interface Props {
  label?: string
  icon?: string
}

defineProps<Props>()
</script>

<template>
  <span class="ob-customisable-button-inner">
    <i v-if="!!icon" class="material-icons">{{ icon }}</i>
    <span>{{ label }}</span>
  </span>
</template>
