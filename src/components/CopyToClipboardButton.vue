<script lang="ts">
import { defineComponent } from "vue"
import utilsService from "@/services/utils-service"

export default defineComponent({
  props: {
    text: { type: String, required: true },
    className: String,
    isInputButton: Boolean,
  },
  methods: {
    copy() {
      utilsService.copyToClipboard(this.text)
    },
  },
})
</script>

<template>
  <button @click="copy" :class="className" type="button">
    <span></span>
    <span class="icon">
      <i class="material-icons">file_copy</i>
    </span>
    <span :class="{ 'is-hidden-mobile': isInputButton }"> &nbsp;Copy </span>
  </button>
</template>
