<script setup lang="ts">
import {
  defineProps,
  defineEmits,
  onMounted,
  onBeforeUnmount,
  ref,
  computed,
  watch,
  watchEffect,
} from "vue"
import { localisationService, Sentry } from "@oneblink/apps"
import { FormTypes } from "@oneblink/types"
import Flatpickr from "flatpickr"
import { Options as FlatpickrOptions } from "flatpickr/dist/types/options"
import { Instance as FlatpickrInstance } from "flatpickr/dist/types/instance"

import CopyToClipboardButton from "@/components/CopyToClipboardButton.vue"
import LookupButton from "@/components/LookupButton.vue"
import FormElementLabelContainer from "@/components/FormElementLabelContainer.vue"

import useIsDirty from "@/composables/useIsDirty"

interface Props {
  id: string
  element: FormTypes.TimeElement
  value: unknown
  displayValidationMessage: boolean
  validationMessage?: string
  isLookup?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: "updateSubmission", v: { name: string; value: string | undefined }): void
  (e: "triggerLookup", v: unknown): void
}>()

const vp = ref<FlatpickrInstance | null>(null)

const { isDirty, setIsDirty } = useIsDirty()

const text = computed<string | null>(() => {
  if (typeof props.value !== "string") {
    return null
  }
  return localisationService.formatTime(new Date(props.value))
})

const valueAndVp = computed<{ value?: unknown; vp: FlatpickrInstance | null }>(
  () => {
    return {
      value: props.value,
      vp: vp.value,
    }
  }
)

function getDateValue(date: Date | undefined) {
  if (!date) return
  return date.toISOString()
}

function onChange(selectedDates: Date[]) {
  const date = getDateValue(selectedDates[0])
  updateSubmission(date)
}

function triggerLookup() {
  emit("triggerLookup", props.value)
}

function updateSubmission(input: string | undefined) {
  if (input !== props.value) {
    emit("updateSubmission", {
      name: props.element.name,
      value: input || undefined,
    })
  }
}

const flatpickrOptions = computed<FlatpickrOptions>(() => {
  return {
    altInput: true,
    dateFormat: "H:i",
    altFormat: localisationService.flatpickrTimeFormat,
    allowInput: false,
    altInputClass: "input ob-input cypress-time-control",
    minDate: undefined,
    maxDate: undefined,
    defaultDate: undefined,
    enableTime: true,
    noCalendar: true,
    time_24hr: false,
    onClose: setIsDirty,
    static: true,
    onChange: onChange,
  }
})

const htmlDivElementRef = ref<Element | null>(null)

onMounted(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vp.value = new (Flatpickr as any)(`[id="${props.id}"]`, {
    ...flatpickrOptions.value,
    appendTo: htmlDivElementRef.value,
  })
})

watchEffect(() => {
  if (vp.value && vp.value.selectedDates) {
    const selectedDate = vp.value.selectedDates[0]
    if (!props.value && selectedDate) {
      try {
        vp.value.clear(false)
      } catch (error) {
        Sentry.captureException(new Error("Error clearing value"))
      }
    } else if (
      props.value &&
      typeof props.value === "string" &&
      (!selectedDate || getDateValue(selectedDate) !== props.value)
    ) {
      try {
        vp.value.setDate(props.value, false)
      } catch (error) {
        Sentry.captureException(new Error(`Error setting date: ${props.value}`))
      }
    }
  }
})

onBeforeUnmount(() => {
  if (vp.value) {
    vp.value.destroy()
  }
})
</script>

<template>
  <div class="cypress-time-element" ref="htmlDivElementRef">
    <FormElementLabelContainer
      className="ob-time"
      :id="id"
      :element="element"
      :required="element.required"
    >
      <div class="field has-addons">
        <div class="control is-expanded has-icons-right">
          <input
            type="time"
            :id="id"
            :name="element.name"
            :placeholder="element.placeholderValue"
            :disabled="element.readOnly"
            class="input ob-input"
          />
          <span class="ob-input-icon icon is-small is-right">
            <i class="material-icons is-size-5">schedule</i>
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
