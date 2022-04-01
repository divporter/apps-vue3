<script lang="ts">
import { defineComponent, computed, PropType } from "vue"
import { FormTypes } from "@oneblink/types"

export default defineComponent({
  props: {
    element: {
      type: Object as PropType<FormTypes.HeadingElement>,
      required: true,
    },
  },
  setup(props) {
    const headingElement = computed<string>(() => {
      switch (props.element.headingType) {
        case 1:
          return "h1"
        case 2:
          return "h2"
        case 3:
          return "h3"
        case 4:
          return "h4"
        case 5:
        default:
          return "h5"
      }
    })

    return { headingElement }
  },
})
</script>
<template>
  <div class="cypress-heading-element">
    <div class="ob-form__element ob-heading">
      <component
        :is="headingElement"
        :class="'ob-heading__text title is-' + element.headingType"
        >{{ element.label }}</component
      >
    </div>
  </div>
</template>
