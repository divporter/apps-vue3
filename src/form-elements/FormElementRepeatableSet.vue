<script lang="ts">
import { defineComponent, PropType, ref, computed } from "vue"

import generateDefaultData from "../services/generate-default-data"
import { FormTypes } from "@oneblink/types"
import FormElementLabelContainer from "@/components/FormElementLabelContainer.vue"
import {
  FormElementConditionallyShown,
  FormElementsConditionallyShown,
  FormElementsValidation,
  FormElementValidation,
  FormSubmissionModel,
} from "@/types/form"

import { LookupCallback } from "@/types/lookups"

import RepeatableSetEntry from "@/components/RepeatableSetEntry.vue"

interface RepeatableSetValidation {
  type: "repeatableSet"
  set: string | undefined
  entries: Record<string, FormElementsValidation | undefined>
}

export default defineComponent({
  emits: ["updateSubmission"],
  components: {
    FormElementLabelContainer,
    RepeatableSetEntry,
  },
  props: {
    id: { type: String, required: true },
    element: {
      type: Object as PropType<FormTypes.RepeatableSetElement>,
      required: true,
    },
    value: Array as PropType<Array<FormSubmissionModel>>,
    displayValidationMessage: Boolean,
    validationMessage: { type: String, required: false },
    isLookup: Boolean,
    isEven: Boolean,
    formElementConditionallyShown:
      Object as PropType<FormElementConditionallyShown>,
    formElementValidation: Object as PropType<FormElementValidation>,
    handleLookup: {
      type: Function as PropType<(callback: LookupCallback) => void>,
      required: true,
    },
  },
  setup(props, { emit }) {
    const isDirty = ref(false)

    const entries = computed<Array<FormSubmissionModel>>(() => {
      return Array.isArray(props.value) ? props.value : []
    })

    const repeatableSetValidation = computed<
      RepeatableSetValidation | undefined
    >(() => {
      return !props.formElementValidation ||
        typeof props.formElementValidation === "string" ||
        props.formElementValidation.type !== "repeatableSet"
        ? undefined
        : props.formElementValidation
    })

    const repeatableSetEntriesConditionallyShown = computed<
      Record<string, FormElementsConditionallyShown | undefined>
    >(() => {
      return props.formElementConditionallyShown &&
        props.formElementConditionallyShown.type === "repeatableSet"
        ? props.formElementConditionallyShown.entries
        : {}
    })

    function setIsDirty() {
      isDirty.value = true
    }

    function updateSubmission(
      newEntries: Array<Record<string, unknown>>
    ): void {
      emit("updateSubmission", {
        name: props.element.name,
        value: newEntries.length > 0 ? newEntries : undefined,
      })
    }

    function handleAddEntry() {
      const newEntries = [...(props.value || [])]
      const entry = generateDefaultData(props.element.elements, {})
      newEntries.push(entry)
      updateSubmission(newEntries)
      setIsDirty()
    }

    function handleRemoveEntry(index: number) {
      const newEntries = [...(props.value || [])]
      newEntries.splice(index, 1)
      updateSubmission(newEntries)
      setIsDirty()
    }

    function handleNestedChange({
      index,
      element: nestedElement,
      value,
    }: {
      index: number
      element: FormTypes.FormElement
      value: Record<string, unknown>
    }) {
      if (nestedElement.type === "page" || !("name" in nestedElement)) {
        return
      }
      const newEntries = (props.value || []).map((entry, i) => {
        if (i === index) {
          return {
            ...entry,
            ...value,
          }
        } else {
          return entry
        }
      })
      updateSubmission(newEntries)
    }

    return {
      isDirty,
      entries,
      repeatableSetValidation,
      repeatableSetEntriesConditionallyShown,
      handleAddEntry,
      handleRemoveEntry,
      handleNestedChange,
    }
  },
})
</script>

<template>
  <div class="cypress-repeatable-set-element">
    <FormElementLabelContainer
      :className="['ob-repeatable-set', isEven ? 'even' : 'odd'].join(' ')"
      :element="element"
      :id="id"
      :required="!!element.minSetEntries"
    >
      <RepeatableSetEntry
        v-for="(entry, index) of entries"
        :key="index"
        :index="index"
        :id="id"
        :isEven="isEven"
        :entry="entry"
        :element="element"
        @change="handleNestedChange"
        @remove="handleRemoveEntry"
        :formElementsConditionallyShown="
          repeatableSetEntriesConditionallyShown[index.toString()]
        "
        :formElementsValidation="
          repeatableSetValidation &&
          repeatableSetValidation.entries[index.toString()]
        "
        :displayValidationMessages="displayValidationMessage"
        :handleLookup="handleLookup"
      />
      <button
        v-if="!element.maxSetEntries || entries.length < element.maxSetEntries"
        type="button"
        class="button ob-button ob-button__add is-primary cypress-add-repeatable-set"
        @click="handleAddEntry"
        :disabled="element.readOnly"
      >
        <span class="icon">
          <i class="material-icons">add</i>
        </span>
        <span v-if="!!element.addSetEntryLabel">{{
          element.addSetEntryLabel
        }}</span>
      </button>
      <div
        v-if="
          (isDirty || displayValidationMessage) &&
          !!repeatableSetValidation &&
          !!repeatableSetValidation.set
        "
        role="alert"
        class="has-margin-top-8"
      >
        <div class="has-text-danger ob-error__text cypress-validation-message">
          {{ repeatableSetValidation.set }}
        </div>
      </div>
    </FormElementLabelContainer>
  </div>
</template>
