<script lang="ts">
import { PropType, defineComponent, computed, provide, ref } from "vue"
import OneBlinkModal from "@/components/OneBlinkModal.vue"

import { FormTypes } from "@oneblink/types"
import { MergeLookupResults, LookupCallback } from "@/types/lookups"

import {
  FormElementsConditionallyShown,
  FormElementsValidation,
  FormSubmissionModel,
} from "@/types/form"

import { indexKey } from "@/provider-keys/RepeatableSetEntry"

export default defineComponent({
  components: {
    OneBlinkModal,
  },
  emits: ["change", "remove"],
  props: {
    id: { type: String, required: true },
    index: { type: Number, required: true },
    isEven: Boolean,
    entry: {
      type: Object as PropType<FormSubmissionModel>,
      required: true,
    },
    element: {
      type: Object as PropType<FormTypes.RepeatableSetElement>,
      required: true,
    },
    formElementsConditionallyShown:
      Object as PropType<FormElementsConditionallyShown>,
    formElementsValidation: Object as PropType<FormElementsValidation>,
    displayValidationMessages: Boolean,
    handleLookup: {
      type: Function as PropType<(callback: LookupCallback) => void>,
      required: true,
    },
  },
  setup(props, { emit }) {
    const isConfirmingRemove = ref(false)

    const indexComputed = computed<number>(() => props.index)

    provide(indexKey, indexComputed)

    function handleChange({
      newSubmission,
      element: nestedElement,
    }: {
      newSubmission: Record<string, unknown>
      element: FormTypes.FormElement
    }) {
      console.log("emitting like crazy")
      console.log(newSubmission)
      emit("change", {
        index: props.index,
        element: nestedElement,
        value: newSubmission,
      })
    }

    function handleRemove() {
      emit("remove", props.index)
    }

    function handleYes() {
      isConfirmingRemove.value = false
      handleRemove()
    }

    function handleLookupInternal(
      mergeLookupResults: ({
        submission,
        elements,
      }: MergeLookupResults) => MergeLookupResults
    ): void {
      props.handleLookup((currentFormSubmission) => {
        let newEntry = {}
        const entries = currentFormSubmission.submission[
          props.element.name
        ] as Array<FormSubmissionModel>
        const elements = currentFormSubmission.elements.map((formElement) => {
          if (
            formElement.type === "repeatableSet" &&
            formElement.name === props.element.name
          ) {
            const { elements, submission } = mergeLookupResults({
              elements: formElement.elements,
              submission: entries[props.index],
            })
            newEntry = submission
            return {
              ...formElement,
              elements,
            }
          }
          return formElement
        })

        const submission = {
          ...currentFormSubmission.submission,
          [props.element.name]: entries.map((entry, i) => {
            if (i === props.index) {
              return newEntry
            }
            return entry
          }),
        }

        return {
          elements,
          submission,
        }
      })
    }
    return { isConfirmingRemove, handleYes, handleChange, handleLookupInternal }
  },
  created() {
    if (this.$options.components) {
      this.$options.components.OneBlinkFormElements =
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require("./OneBlinkFormElements.vue").default
    }
  },
})
</script>

<template>
  <OneBlinkModal
    :isOpen="isConfirmingRemove"
    className="cypress-repeatable-set-prompt"
    titleClassName="cypress-repeatable-set-remove-entry-header"
    :title="element.removeSetEntryLabel || 'Remove Entry'"
  >
    <template v-slot:default>
      Are you sure you want to remove this entry?
    </template>
    <template v-slot:actions>
      <button
        type="button"
        class="button ob-button is-light cypress-cancel-repeatable-set"
        @click="isConfirmingRemove = false"
      >
        Cancel
      </button>
      <button
        type="button"
        class="button ob-button is-primary cypress-confirm-repeatable-set"
        @click="handleYes"
      >
        Yes
      </button>
    </template>
  </OneBlinkModal>

  <div
    :key="index"
    class="ob-repeatable-set__container cypress-repeatable-set-container"
  >
    <button
      type="button"
      class="button ob-button ob-button_remove is-light cypress-remove-repeatable-set-entry"
      @click="() => (isConfirmingRemove = true)"
      :disabled="element.readOnly"
    >
      <span class="icon">
        <i class="material-icons">delete_outline</i>
      </span>
      <span v-if="!!element.removeSetEntryLabel">{{
        element.removeSetEntryLabel
      }}</span>
    </button>

    <OneBlinkFormElements
      :idPrefix="id + '_entry-' + index + '_'"
      :isEven="isEven"
      :formElementsValidation="formElementsValidation"
      :displayValidationMessages="displayValidationMessages"
      :elements="element.elements"
      @updateSubmission="handleChange"
      :model="entry"
      :formElementsConditionallyShown="formElementsConditionallyShown"
      :handleLookup="handleLookupInternal"
    />
  </div>
</template>
