<script lang="ts">
import { defineComponent } from "vue"
import { OneBlinkAppsError } from "@oneblink/apps"

export default defineComponent({
  name: "OneBlinkAppsErrorOriginalMessage",
  props: {
    error: Error,
  },
  computed: {
    isOneBlinkAppsError() {
      return this.error instanceof OneBlinkAppsError
    },
  },
})
</script>

<template>
  <div v-if="error" class="content has-margin-top-6">
    <pre>{{ error.message }}</pre>
  </div>
  <OneBlinkAppsErrorOriginalMessage
    v-if="error && isOneBlinkAppsError"
    :error="error.originalError"
  />
</template>
