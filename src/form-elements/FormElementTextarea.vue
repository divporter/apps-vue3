<script lang="ts">
import { defineComponent, PropType, ref, computed } from "vue"
import { FormTypes } from "@oneblink/types"
import FormElementLabelContainer from "@/components/FormElementLabelContainer.vue"
import LookupButton from "@/components/LookupButton.vue"
import CopyToClipboardButton from "@/components/CopyToClipboardButton.vue"

export default defineComponent({
  components: {
    FormElementLabelContainer,
    LookupButton,
    CopyToClipboardButton,
  },
  emits: ["updateSubmission", "triggerLookup"],
  props: {
    id: { type: String, required: true },
    element: {
      type: Object as PropType<FormTypes.TextareaElement>,
      required: true,
    },
    value: { required: true },
    displayValidationMessage: Boolean,
    validationMessage: { type: String, required: false },
    isLookup: Boolean,
  },
  setup(props, { emit }) {
    const isDirty = ref(false)

    const text = computed<string>(() =>
      typeof props.value === "string" ? props.value : ""
    )

    const isDisplayingValidationMessage = computed<boolean>(() => {
      return (
        (isDirty.value || props.displayValidationMessage) &&
        !!props.validationMessage
      )
    })

    const isDisplayingCopyButton = computed<boolean>(() => {
      return !!props.element.readOnly && !!props.value
    })

    function updateSubmission(event: Event) {
      const target = event.target as HTMLInputElement
      emit("updateSubmission", {
        name: props.element.name,
        value: target.value || undefined,
      })
    }

    function setIsDirty() {
      isDirty.value = true
    }

    function triggerLookup() {
      emit("triggerLookup", props.value)
    }

    return {
      isDirty,
      text,
      isDisplayingValidationMessage,
      isDisplayingCopyButton,
      updateSubmission,
      setIsDirty,
      triggerLookup,
    }
  },
})
</script>

<template>
  <div class="cypress-textarea-element">
    <FormElementLabelContainer
      className="ob-textarea"
      :id="id"
      :element="element"
      :required="element.required"
    >
      <div class="control">
        <textarea
          :placeholder="element.placeholderValue"
          :id="id"
          :name="element.name"
          class="textarea input ob-input cypress-textarea-control"
          :value="text"
          @input="updateSubmission"
          :required="element.required"
          :disabled="element.readOnly"
          @blur="setIsDirty"
        />
      </div>

      <div
        v-if="isDisplayingValidationMessage || !!element.maxLength"
        role="alert"
        class="has-margin-top-8"
      >
        <div class="is-flex is-justify-content-space-between">
          <div
            v-if="isDisplayingValidationMessage"
            class="has-text-danger ob-error__text cypress-validation-message"
          >
            {{ validationMessage }}
          </div>
          <div v-else />

          <div
            v-if="!!element.maxLength"
            :class="{
              'ob-max-length__text': true,
              'cypress-max-length-message': true,
              'has-text-danger': text.length > element.maxLength,
            }"
          >
            {{ text.length }} / {{ element.maxLength }}
          </div>
        </div>
      </div>

      <div
        v-if="isLookup || isDisplayingCopyButton"
        class="buttons ob-buttons has-margin-top-8"
      >
        <CopyToClipboardButton
          v-if="isDisplayingCopyButton"
          className="button ob-button cypress-copy-to-clipboard-button"
          :text="text"
        />
        <LookupButton
          v-if="isLookup"
          :value="value"
          :validationMessage="validationMessage"
          @click="triggerLookup"
        />
      </div>
    </FormElementLabelContainer>
  </div>
</template>
