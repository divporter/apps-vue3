<script setup lang="ts">
import { defineProps } from "vue"
import { FormTypes } from "@oneblink/types"

import OnLoading from "./OnLoading.vue"

defineProps<{ options: FormTypes.ChoiceElementOption[] }>()
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
