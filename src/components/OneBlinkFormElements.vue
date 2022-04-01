<script lang="ts">
import { defineComponent, PropType } from "vue"
import { FormTypes } from "@oneblink/types"
import type {
  FormElementsValidation,
  FormElementsConditionallyShown,
} from "../types/form"
import type { LookupCallback } from "../types/lookups"

import FormElement from "@/components/FormElement.vue"
import FormElementSection from "@/form-elements/FormElementSection.vue"

export default defineComponent({
  components: {
    FormElement,
    FormElementSection,
  },
  emits: ["updateSubmission"],
  props: {
    elements: {
      type: Array as PropType<FormTypes.FormElement[]>,
      required: true,
    },
    model: {
      type: Object as PropType<Record<string, unknown>>,
      required: true,
    },
    formElementsValidation: {
      type: Object as PropType<FormElementsValidation>,
      required: false,
    },
    displayValidationMessages: Boolean,
    formElementsConditionallyShown: {
      type: Object as PropType<FormElementsConditionallyShown>,
      required: false,
    },
    idPrefix: { type: String, required: true },
    isEven: { type: Boolean, required: false },
    handleLookup: {
      type: Function as PropType<(callback: LookupCallback) => void>,
      required: true,
    },
  },
  setup(props, { emit }) {
    function updateSubmission({
      newSubmission,
      element,
    }: {
      newSubmission: Record<string, unknown>
      element: FormTypes.FormElement
    }) {
      emit("updateSubmission", { newSubmission, element })
    }

    return {
      updateSubmission,
    }
  },
})
</script>

<template>
  <template v-for="element of elements">
    <div
      :key="element.id"
      v-if="
        element.type === 'section' &&
        !formElementsConditionallyShown?.[element.id]?.isHidden
      "
      class="ob-element cypress-element-container"
    >
      <FormElementSection
        :element="element"
        :displayValidationMessages="displayValidationMessages"
        :idPrefix="idPrefix"
        :formElementsConditionallyShown="formElementsConditionallyShown"
        :formElementsValidation="formElementsValidation"
        :model="model"
        @updateSubmission="updateSubmission"
        :handleLookup="handleLookup"
      />
    </div>

    <FormElement
      :key="element.id"
      v-if="
        element.type !== 'section' &&
        element.type !== 'page' &&
        !formElementsConditionallyShown?.[element.name]?.isHidden
      "
      :element="element"
      :model="model"
      :value="model[element.name]"
      :name="element.name"
      :id="idPrefix + element.name"
      :formElementValidation="
        formElementsValidation
          ? formElementsValidation[element.name]
          : undefined
      "
      :formElementConditionallyShown="
        formElementsConditionallyShown
          ? formElementsConditionallyShown[element.name]
          : undefined
      "
      :displayValidationMessage="displayValidationMessages"
      @updateSubmission="updateSubmission"
      :handleLookup="handleLookup"
    >
    </FormElement>
  </template>
</template>
