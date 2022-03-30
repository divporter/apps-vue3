<script lang="ts">
import { defineComponent, PropType } from "vue"
import { FormTypes } from "@oneblink/types"

import OnLoading from "./OnLoading.vue"

export default defineComponent({
  components: {
    OnLoading,
  },
  props: {
    options: {
      type: Array as PropType<FormTypes.ChoiceElementOption[]>,
      required: true,
    },
  },
})
</script>

<template>
  <div v-if="!options">
    <OnLoading className="has-text-centered" small></OnLoading>
  </div>
  <div v-else-if="!options.length">
    <div class="has-text-grey is-size-7">
      We were unable to load your options. Please contact your administrator.
    </div>
  </div>
  <slot></slot>
</template>
