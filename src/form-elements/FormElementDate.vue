<script setup lang="ts">
import {
  defineProps,
  defineEmits,
  reactive,
  computed,
  onMounted,
  ref,
  watchEffect,
  onBeforeUnmount,
} from "vue"
import { localisationService, Sentry } from "@oneblink/apps"
import { FormTypes } from "@oneblink/types"
import Flatpickr from "flatpickr"
import { Options as FlatpickrOptions } from "flatpickr/dist/types/options"
import { Instance as FlatpickrInstance } from "flatpickr/dist/types/instance"

import CopyToClipboardButton from "@/components/CopyToClipboardButton.vue"
import LookupButton from "@/components/LookupButton.vue"
import FormElementLabelContainer from "@/components/FormElementLabelContainer.vue"

import { generateDate, parseDateValue } from "../services/generate-default-data"

import useIsDirty from "@/composables/useIsDirty"

interface Props {
  id: string
  element: FormTypes.DateElement
  value: unknown
  displayValidationMessage: boolean
  validationMessage?: string
  isLookup?: boolean
}

interface State {
  vp: FlatpickrInstance | null
  dateOnly: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: "updateSubmission", v: { name: string; value: string | undefined }): void
  (e: "triggerLookup", v: unknown): void
}>()

const state = reactive<State>({
  vp: null,
  dateOnly: true,
})

const { isDirty, setIsDirty } = useIsDirty()

const text = computed<string | null>(() => {
  if (typeof props.value === "string") {
    const date = generateDate({
      daysOffset: undefined,
      value: props.value,
      dateOnly: true,
    })
    if (date) {
      return localisationService.formatDate(date)
    }
  }
  return null
})

function getDateValue(date: Date | undefined) {
  if (!date) return
  if (state.dateOnly && state.vp) {
    return state.vp.formatDate(date, "Y-m-d")
  }
  return date.toISOString()
}

function updateSubmission(input: string | undefined) {
  if (input !== props.value) {
    emit("updateSubmission", {
      name: props.element.name,
      value: input || undefined,
    })
  }
}

function onChange(selectedDates: Date[]) {
  const date = getDateValue(selectedDates[0])
  updateSubmission(date)
}

function triggerLookup() {
  emit("triggerLookup", props.value)
}

const flatpickrOptions = computed<FlatpickrOptions>(() => {
  return {
    altInput: true,
    dateFormat: "Y-m-d",
    altFormat: localisationService.flatpickrDateFormat,
    allowInput: true,
    altInputClass: "input ob-input cypress-date-control",
    minDate: parseDateValue({
      dateOnly: state.dateOnly,
      daysOffset: props.element.fromDateDaysOffset,
      value: props.element.fromDate,
    }),
    maxDate: parseDateValue({
      dateOnly: state.dateOnly,
      daysOffset: props.element.toDateDaysOffset,
      value: props.element.toDate,
    }),
    defaultDate: undefined,
    allowInvalidPreload: true,
    onClose: setIsDirty,
    static: true,
    onChange: onChange,
  }
})

const htmlDivElementRef = ref<Element | null>(null)

onMounted(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  state.vp = new (Flatpickr as any)(`[id="${props.id}"]`, {
    ...flatpickrOptions.value,
    appendTo: htmlDivElementRef.value,
  })
})

watchEffect(() => {
  if (state.vp && state.vp.selectedDates) {
    const selectedDate = state.vp.selectedDates[0]
    if (!props.value && selectedDate) {
      try {
        state.vp.clear(false)
      } catch (error) {
        Sentry.captureException(new Error("Error clearing value"))
      }
    } else if (
      props.value &&
      typeof props.value === "string" &&
      (!selectedDate || getDateValue(selectedDate) !== props.value)
    ) {
      try {
        state.vp.setDate(props.value, false)
      } catch (error) {
        Sentry.captureException(new Error(`Error setting date: ${props.value}`))
      }
    }
  }
})

onBeforeUnmount(() => {
  if (state.vp) {
    state.vp.destroy()
  }
})
</script>

<template>
  <div class="cypress-date-element" ref="htmlDivElementRef">
    <FormElementLabelContainer
      className="ob-date"
      :id="id"
      :element="element"
      :required="element.required"
    >
      <div class="field has-addons">
        <div class="control is-expanded has-icons-right">
          <input
            type="date"
            :id="id"
            :name="element.name"
            :placeholder="element.placeholderValue"
            :disabled="element.readOnly"
            class="input ob-input"
          />
          <span class="ob-input-icon icon is-small is-right">
            <i class="material-icons is-size-5">event</i>
          </span>
        </div>
        <div v-if="!!element.readOnly && !!text" class="control">
          <CopyToClipboardButton
            className="button is-input-addon cypress-copy-to-clipboard-button"
            isInputButton
            :text="text"
          />
        </div>
        <LookupButton
          v-if="isLookup"
          isInputButton
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
        <div class="has-text-danger ob-error__text cypress-validation-message">
          {{ validationMessage }}
        </div>
      </div>
    </FormElementLabelContainer>
  </div>
</template>
