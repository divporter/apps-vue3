<script setup lang="ts">
import { ref, computed, defineProps, defineEmits, inject } from "vue"
import { FormTypes } from "@oneblink/types"
import FormElementLabelContainer from "@/components/FormElementLabelContainer.vue"
import LookupButton from "@/components/LookupButton.vue"
import CopyToClipboardButton from "@/components/CopyToClipboardButton.vue"
import SliderControl from "@/components/SliderControl.vue"
import { isActiveKey } from "@/provider-keys/PageFormElements"

interface Props {
  id: string
  element: FormTypes.NumberElement
  value: unknown
  displayValidationMessage: boolean
  validationMessage?: string
  isLookup: boolean
}

const props = defineProps<Props>()

const isPageVisible = inject(isActiveKey)

const isDirty = ref<boolean>(false)

const showSlider = computed<boolean>(() => {
  return (
    props.element.isSlider &&
    !Number.isNaN(props.element.minNumber) &&
    !Number.isNaN(props.element.maxNumber)
  )
})

const text = computed<string>(() =>
  typeof props.value === "number" ? props.value.toString() : ""
)

const emit = defineEmits<{
  (e: "updateSubmission", v: { name: string; value: unknown | undefined }): void
  (e: "triggerLookup", v: unknown): void
}>()

function updateSubmission(event: Event) {
  const target = event.target as HTMLInputElement
  const value = parseFloat(target.value)
  emit("updateSubmission", {
    name: props.element.name,
    value: !Number.isNaN(value) ? value : undefined,
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
  <div class="cypress-number-element">
    <FormElementLabelContainer
      className="ob-number"
      :id="id"
      :element="element"
      :required="element.required"
    >
      <div v-if="!showSlider" class="field has-addons">
        <div class="control is-expanded has-icons-right">
          <input
            ref="htmlInputElementRef"
            type="number"
            :value="text"
            :placeholder="element.placeholderValue"
            :id="id"
            :name="element.name"
            class="input ob-input cypress-number-control"
            @input="updateSubmission"
            :required="element.required"
            :disabled="element.readOnly"
            @blur="setIsDirty"
          />
          <span class="ob-input-icon icon is-small is-right">
            <i class="material-icons is-size-5">tag</i>
          </span>
        </div>
        <div v-if="!!element.readOnly && !!text" class="control">
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
      <SliderControl
        v-if="isPageVisible"
        :id="id"
        :text="text"
        :value="value"
        :element="element"
        @change="updateSubmission"
        @blur="setIsDirty"
      />

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
