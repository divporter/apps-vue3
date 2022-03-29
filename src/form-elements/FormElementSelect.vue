<script setup lang="ts">
import { defineProps, ref, computed, defineEmits } from "vue"
import { FormTypes } from "@oneblink/types"

import FormElementLabelContainer from "@/components/FormElementLabelContainer.vue"
//TODO
// import ToggleAllCheckbox from "@/components/ToggleAllCheckbox.vue"
import FormElementOptions from "@/components/FormElementOptions.vue"
import LookupButton from "@/components/LookupButton.vue"

interface Props {
  id: string
  element: FormTypes.SelectElement
  value: unknown
  displayValidationMessage?: boolean
  validationMessage?: string
  conditionallyShownOptions?: FormTypes.ChoiceElementOption[]
  isLookup?: boolean
}

const props = defineProps<Props>()

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

const selectedValuesAsArray = computed<string[]>(() => {
  if (Array.isArray(props.value)) {
    return props.value
  }
  if (typeof props.value === "string") {
    return [props.value]
  }
  return []
})

const emit = defineEmits<{
  (e: "updateSubmission", v: { name: string; value?: string | string[] }): void
  (e: "triggerLookup", v: unknown): void
}>()

function updateSubmission(input: string | string[] | undefined) {
  emit("updateSubmission", {
    name: props.element.name,
    value: input || undefined,
  })
}

function setIsDirty() {
  isDirty.value = true
}

function updateSubmissionAndSetDirty(input: string | string[] | undefined) {
  setIsDirty()
  updateSubmission(input)
}

function toggleAll(selectAll: boolean) {
  let newValue
  if (selectAll) {
    newValue = filteredOptions.value.map((option) => option.value)
  }
  updateSubmissionAndSetDirty(newValue)
}

function handleSingle(event: Event) {
  const target = event.target as HTMLSelectElement
  const val = target.value || undefined
  updateSubmissionAndSetDirty(val)
}

function handleMulti(event: Event) {
  const target = event.target as HTMLSelectElement
  const vals = Array.from(target.selectedOptions).map((opt) => opt.value)
  updateSubmissionAndSetDirty(vals)
}

function triggerLookup() {
  emit("triggerLookup", props.value)
}
</script>

<template>
  <div class="cypress-select-element">
    <FormElementLabelContainer
      className="ob-select"
      :id="id"
      :element="element"
      :required="element.required"
    >
      <FormElementOptions :options="element.options || []">
        <!--ToggleAllCheckbox
          v-if="element.multi && element.canToggleAll"
          :id="id"
          :element="element"
          :options="filteredOptions"
          :selected="selectedValuesAsArray"
          :disabled="element.readOnly"
          @toggleAll="toggleAll"
        /-->
        <div v-if="!element.multi" class="field has-addons">
          <div class="control is-expanded">
            <div class="select is-fullwidth">
              <select
                :id="id"
                :name="element.name"
                class="cypress-select-single-control ob-input ob-select__single"
                :value="typeof value === 'string' ? value : ''"
                :required="element.required"
                :disabled="element.readOnly"
                @change="handleSingle"
                @blur="setIsDirty"
              >
                <option value="">Please choose</option>
                <option
                  v-for="{ label, value } of filteredOptions"
                  :key="value"
                  :value="value"
                >
                  {{ label }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <div v-else class="select is-multiple control">
          <select
            multiple
            :id="id"
            :name="element.name"
            class="cypress-select-multiple-control ob-input ob-select__multi"
            @change="handleMulti"
            :required="element.required"
            :disabled="element.readOnly"
            @blur="setIsDirty"
          >
            <option
              v-for="option of filteredOptions"
              :key="option.value"
              :value="option.value"
              :selected="Array.isArray(value) && value.includes(option.value)"
            >
              {{ option.label }}
            </option>
          </select>

          <LookupButton
            v-if="isLookup"
            hasMarginTop
            :value="value"
            :validationMessage="validationMessage"
            @click="triggerLookup"
          />
        </div>

        <div
          v-if="(isDirty || displayValidationMessage) && !!validationMessage"
          role="alert"
          class="has-margin-top-8"
        >
          <div
            class="has-text-danger ob-error__text cypress-validation-message"
          >
            {{ validationMessage }}
          </div>
        </div>
      </FormElementOptions>
    </FormElementLabelContainer>
  </div>
</template>
