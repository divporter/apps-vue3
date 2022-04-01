<script lang="ts">
import { defineComponent } from "vue"
import { Tippy } from "vue-tippy"

import useIsOffline from "@/composables/useIsOffline"
import OnLoading from "../OnLoading.vue"

export default defineComponent({
  components: {
    OnLoading,
    Tippy,
  },
  setup() {
    const isOffline = useIsOffline()

    return { isOffline }
  },
})
</script>

<template>
  <tippy
    :arrow="true"
    theme="google"
    size="large"
    placement="bottom"
    :content="
      isOffline
        ? 'Upload will start when you connect to the internet'
        : 'Uploading'
    "
  >
    <div class="cypress-attachment-uploading">
      <i v-if="isOffline" class="material-icons has-text-warning">wifi_off</i>
      <OnLoading v-else tiny />
    </div>
  </tippy>
</template>
