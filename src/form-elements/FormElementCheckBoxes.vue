<script setup lang="ts">
import { ref, computed, defineProps, defineEmits } from "vue"
import { FormTypes } from "@oneblink/types"
import FormElementLabelContainer from "@/components/FormElementLabelContainer.vue"
import LookupButton from "@/components/LookupButton.vue"
import OptionButton from "@/form-elements/OptionButton.vue"
import ToggleAllCheckbox from "@/components/ToggleAllCheckbox.vue"
import FormElementOptions from "@/components/FormElementOptions.vue"

interface Props {
  id: string
  element: FormTypes.CheckboxElement
  value: unknown
  displayValidationMessage: boolean
  validationMessage?: string
  conditionallyShownOptions?: FormTypes.ChoiceElementOption[]
  isLookup: boolean
}

const props = defineProps<Props>()

console.log(props)

const isDirty = ref(false)

const filteredOptions = computed<FormTypes.ChoiceElementOption[]>(() => {
  if (!props.element.options) {
    return []
  }
  if (!props.conditionallyShownOptions) {
    return props.element.options
  }
  return props.element.options.filter((option) => {
    return (
      !props.conditionallyShownOptions ||
      props.conditionallyShownOptions.some(({ id }) => id === option.id)
    )
  })
})

const selectedValues = computed<string[]>(() => {
  if (!Array.isArray(props.value)) {
    return []
  }
  return props.value
})

const emit = defineEmits<{
  (e: "updateSubmission", v: { name: string; value: unknown | undefined }): void
  (e: "triggerLookup", v: unknown): void
}>()

function updateSubmission(input: string[] | undefined) {
  emit("updateSubmission", {
    name: props.element.name,
    value: input || undefined,
  })
}

function setIsDirty() {
  isDirty.value = true
}

function updateSubmissionAndSetDirty(input: string[] | undefined) {
  setIsDirty()
  updateSubmission(input)
}

function triggerLookup() {
  emit("triggerLookup", props.value)
}

function toggleAll(selectAll: boolean) {
  let newValue
  if (selectAll) {
    newValue = filteredOptions.value.map((option) => option.value)
  }
  updateSubmissionAndSetDirty(newValue)
}

function changeValues(toggledValue: string, hasSelectedValue: boolean) {
  let newValue: string[]
  if (hasSelectedValue) {
    const existingValue = Array.isArray(props.value) ? props.value : []
    newValue = existingValue.filter((value) => value !== toggledValue)
  } else {
    newValue = Array.isArray(props.value) ? [...props.value] : []
    newValue.push(toggledValue)
  }
  updateSubmissionAndSetDirty(newValue)
}
</script>

<template>
  <div class="cypress-checkbox-element">
    <FormElementLabelContainer
      className="ob-checkbox"
      :id="id"
      :element="element"
      :required="element.required"
    >
      <FormElementOptions :options="element.options || []">
        <ToggleAllCheckbox
          v-if="element.canToggleAll"
          :id="id"
          :element="element"
          :options="filteredOptions"
          :selected="selectedValues"
          :disabled="element.readOnly"
          @toggleAll="toggleAll"
        />
        <div v-if="element.buttons" class="ob-button-radio-container">
          <div class="buttons ob-buttons ob-buttons-radio">
            <OptionButton
              v-for="(option, index) of filteredOptions"
              :key="index"
              :element="element"
              :option="option"
              :isSelected="selectedValues.includes(option.value)"
              @click="
                () =>
                  changeValues(
                    option.value,
                    selectedValues.includes(option.value)
                  )
              "
              :class="{
                button: true,
                'ob-button': true,
                'ob-button__input': true,
                'ob-checkbox__button': true,
                'cypress-checkbox-button-control': true,
                'is-primary': selectedValues.includes(option.value),
                'is-light': !selectedValues.includes(option.value),
              }"
            />
          </div>
        </div>
        <div v-else>
          <div
            class="control"
            :key="index"
            v-for="(option, index) of filteredOptions"
          >
            <ui-form-field>
              <label
                class="checkbox ob-checkbox__input-label cypress-checkbox-label"
              >
                <ui-checkbox
                  :class="{
                    'ob-checkbox__input': true,
                    'cypress-checkbox-control': true,
                    'ob-checkbox__input-checked': selectedValues.includes(
                      option.value
                    ),
                  }"
                  :value="option.value"
                  :modelValue="value || []"
                  :disabled="element.readOnly"
                  @update:modelValue="updateSubmissionAndSetDirty"
                />
                {{ option.label }}
              </label>
            </ui-form-field>
          </div>
        </div>
        <LookupButton
          v-if="isLookup"
          hasMarginTop
          :value="value"
          :validationMessage="validationMessage"
          @click="triggerLookup"
        />
      </FormElementOptions>
      <div
        v-if="displayValidationMessage && !!validationMessage"
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

<style scoped>
.mdc-checkbox :deep(.mdc-checkbox__background) {
  left: 0;
  top: 0;
  animation: none;
}

.mdc-checkbox :deep(.mdc-checkbox__background path),
.mdc-checkbox :deep(.mdc-checkbox__background .mdc-checkbox__mixedmark) {
  animation: none;
  transition: none;
}

.ob-checkbox__input:hover,
.ob-checkbox__input:active,
.ob-checkbox__input:focus {
  background-color: none;
}

.mdc-checkbox :deep(.mdc-checkbox__ripple) {
  opacity: 0;
}
</style>
