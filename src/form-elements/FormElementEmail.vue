<script setup lang="ts">
import { defineProps, defineEmits, ref, computed } from "vue"
import CopyToClipboardButton from "@/components/CopyToClipboardButton.vue"
import LookupButton from "@/components/LookupButton.vue"
import { FormTypes } from "@oneblink/types"
import FormElementLabelContainer from "@/components/FormElementLabelContainer.vue"

interface Props {
  id: string
  element: FormTypes.EmailElement
  value: unknown
  displayValidationMessage: boolean
  validationMessage?: string
  isLookup: boolean
}

const props = defineProps<Props>()

const isDirty = ref(false)

const text = computed<string>(() => {
  return typeof props.value === "string" ? props.value : ""
})

const emit = defineEmits<{
  (e: "updateSubmission", v: { name: string; value: unknown | undefined }): void
  (e: "triggerLookup", v: unknown): void
}>()

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
</script>

<template>
  <div class="cypress-email-element">
    <FormElementLabelContainer
      className="ob-email"
      :id="id"
      :element="element"
      :required="element.required"
    >
      <div class="field has-addons">
        <div class="control is-expanded has-icons-right">
          <input
            type="email"
            :placeholder="element.placeholderValue"
            :id="id"
            :name="element.name"
            class="input ob-input cypress-email-control"
            :value="text"
            @input="updateSubmission"
            :required="element.required"
            :disabled="element.readOnly"
            @blur="setIsDirty"
          />
          <span class="ob-input-icon icon is-small is-right">
            <i class="material-icons is-size-5">email</i>
          </span>
        </div>
        <div v-if="!!element.readOnly && !!value" class="control">
          <CopyToClipboardButton
            className="button is-input-addon cypress-copy-to-clipboard-button"
            isInputButton
            :text="text"
          />
        </div>
        <div class="control">
          <LookupButton
            v-if="isLookup"
            isInputButton
            :value="value"
            :validationMessage="validationMessage"
            @click="triggerLookup"
          />
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
