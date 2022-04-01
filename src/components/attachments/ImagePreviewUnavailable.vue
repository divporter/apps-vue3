<script lang="ts">
import { defineComponent } from "vue"
import useIsOffline from "@/composables/useIsOffline"

export default defineComponent({
  setup() {
    const isOffline = useIsOffline()
    return {
      isOffline,
    }
  },
})
</script>

<template>
  <template v-if="isOffline">
    <i class="material-icons has-text-warning icon-large has-margin-bottom-6">
      wifi_off
    </i>
    <p>
      It looks like you&apos;re offline. Image preview will be available when
      connectivity is restored.
    </p>
  </template>
  <template v-else>
    <i class="material-icons has-text-grey icon-large has-margin-bottom-6">
      attach_file
    </i>
    <p>
      You do not have access to preview this image, however, it will be included
      with your submission.
    </p>
  </template>
</template>
