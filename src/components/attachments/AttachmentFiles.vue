<script lang="ts">
import { PropType, defineComponent, ref } from "vue"
import { FormTypes } from "@oneblink/types"

import FormElementLabelContainer from "../FormElementLabelContainer.vue"

export default defineComponent({
  components: {
    FormElementLabelContainer,
  },
  emits: ["addFiles"],
  props: {
    id: { type: String, required: true },
    element: {
      type: Object as PropType<FormTypes.FilesElement>,
      required: true,
    },
    isDirty: Boolean,
    attachments: { type: Array, required: true },
    displayValidationMessage: Boolean,
    validationMessage: String,
  },
  setup(props, { emit }) {
    const inputRef = ref<HTMLInputElement | null>(null)

    function handleAdd() {
      if (!inputRef.value) return // RESET HTML FILE INPUT VALUE SO FILES PREVIOUSLY ADDED AND REMOVED ARE RECOGNISED
      inputRef.value.value = ""
      inputRef.value.click()
    }

    function handleChange(event: Event) {
      const target = event.target as HTMLInputElement
      emit("addFiles", target.files ? Array.from(target.files) : [])
    }

    return {
      inputRef,
      handleAdd,
      handleChange,
    }
  },
})
</script>

<template>
  <div class="cypress-files-element">
    <FormElementLabelContainer
      className="ob-files"
      :element="element"
      :id="id"
      :required="!!element.minEntries"
    >
      <input
        ref="inputRef"
        type="file"
        :name="element.name"
        :id="id"
        class="file-input ob-input"
        :multiple="element.maxEntries !== 1"
        :disabled="element.readOnly"
        @change="handleChange"
      />
      <div class="control cypress-files-control">
        <div class="columns is-multiline">
          <slot></slot>
          <div
            v-if="
              !element.readOnly &&
              (!element.maxEntries || attachments.length < element.maxEntries)
            "
            class="column is-one-quarter"
          >
            <button
              type="button"
              class="button ob-files__add-new-button"
              @click="handleAdd"
            >
              <i class="material-icons icon-x-large">add</i>
            </button>
          </div>
        </div>
      </div>

      <div
        v-if="(isDirty || displayValidationMessage) && !!validationMessage"
        role="alert"
        class="has-margin-top-8"
      >
        <div class="has-text-danger ob-error__text cypress-validation-message">
          {{ validationMessage }}
        </div>
      </div>
    </FormElementLabelContainer>
  </div>
</template>
