<script lang="ts">
import { defineComponent, PropType, provide, computed } from "vue"
import { FormTypes } from "@oneblink/types"
import type {
  FormElementConditionallyShown,
  FormElementsValidation,
} from "../types/form"
import type { MergeLookupResults } from "../types/lookups"
import { handleLookupKey, isActiveKey } from "@/provider-keys/PageFormElements"

import OneBlinkFormElements from "@/components/OneBlinkFormElements.vue"

export default defineComponent({
  components: { OneBlinkFormElements },
  emits: ["updateSubmission", "updateDefinition"],
  props: {
    isActive: { type: Boolean, required: true },
    definition: { type: Object as PropType<FormTypes.Form>, required: true },
    pageElement: {
      type: Object as PropType<FormTypes.PageElement>,
      required: true,
    },
    model: {
      type: Object as PropType<Record<string, unknown>>,
      required: true,
    },
    formElementsConditionallyShown: {
      type: Object as PropType<Record<string, FormElementConditionallyShown>>,
      required: true,
    },
    formElementsValidation: {
      type: Object as PropType<FormElementsValidation>,
      required: false,
    },
    displayValidationMessages: Boolean,
  },
  setup(props, { emit }) {
    function updateSubmission({
      newSubmission,
    }: {
      newSubmission: Record<string, unknown>
    }): void {
      emit("updateSubmission", newSubmission)
    }

    function updateDefinition(newDefinition: FormTypes.Form): void {
      emit("updateDefinition", newDefinition)
    }

    function handleLookup(
      mergeLookupResults: ({
        submission,
        elements,
      }: MergeLookupResults) => MergeLookupResults
    ): void {
      const { submission, elements } = mergeLookupResults({
        elements: props.pageElement.elements,
        submission: props.model,
      })

      const definition = props.definition
      if (props.pageElement.id === props.definition.id.toString()) {
        definition.elements = elements
      } else {
        definition.elements = props.definition.elements.map((formElement) => {
          if (
            formElement.id === props.pageElement.id &&
            formElement.type === "page"
          ) {
            return {
              ...formElement,
              elements,
            }
          } else {
            return formElement
          }
        })
      }
      updateSubmission({ newSubmission: submission })
      updateDefinition(definition)
    }

    const isActive = computed<boolean>(() => props.isActive)

    provide(handleLookupKey, handleLookup)
    provide(isActiveKey, isActive)

    return {
      updateSubmission,
    }
  },
})
</script>

<template>
  <div
    :key="pageElement.id"
    :class="{
      'ob-page': true,
      'step-content': true,
      'is-active': true,
      'cypress-page': true,
      'is-invisible': !isActive,
    }"
  >
    <OneBlinkFormElements
      :elements="pageElement.elements"
      :model="model"
      :formElementsConditionallyShown="formElementsConditionallyShown"
      :formElementsValidation="formElementsValidation"
      :displayValidationMessages="displayValidationMessages"
      idPrefix=""
      @updateSubmission="updateSubmission"
    />
  </div>
</template>
