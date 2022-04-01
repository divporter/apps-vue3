<script lang="ts">
import { defineComponent, PropType } from "vue"
import { FormTypes } from "@oneblink/types"

export default defineComponent({
  props: {
    element: {
      type: Object as PropType<FormTypes.ImageElement>,
      required: true,
    },
  },
})
</script>

<template>
  <div class="ob-form__element ob-image cypress-image-element">
    <img
      class="ob-image__content cypress-image-element-content"
      :src="element.defaultValue"
      :alt="element.label"
    />
  </div>
</template>
