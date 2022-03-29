<script setup lang="ts">
import { defineProps, computed, ref, watchEffect, defineEmits } from "vue"
import { FormTypes } from "@oneblink/types"
import _debounce from "lodash.debounce"

interface Props {
  id: string
  text: string
  value: unknown
  element: FormTypes.NumberElement
}

const props = defineProps<Props>()

const sliderBubbleWidthInPixels = 24

const number = computed<number>(() => {
  return typeof props.value === "number"
    ? props.value
    : parseFloat(props.value as string)
})

const emit = defineEmits<{
  (e: "blur", v: void): void
  (e: "change", v: Event): void
}>()

function onBlur() {
  emit("blur")
}

function onChange(event: Event) {
  emit("change", event)
}

const removeIsDraggingClass = _debounce((outputElement: HTMLOutputElement) => {
  if (outputElement.classList.contains("is-dragging")) {
    outputElement.classList.remove("is-dragging")
  }
}, 500)

const sliderOutputRef = ref<HTMLOutputElement | null>(null)
const sliderInputRef = ref<HTMLOutputElement | null>(null)

watchEffect(() => {
  if (
    Number.isNaN(number.value) ||
    typeof props.element.maxNumber !== "number" ||
    typeof props.element.minNumber !== "number"
  ) {
    return
  }
  if (sliderOutputRef.value !== null && sliderInputRef.value !== null) {
    const range = props.element.maxNumber - props.element.minNumber
    const percentage = (number.value - props.element.minNumber) / range
    const inputWidth = sliderInputRef.value.getBoundingClientRect().width
    const outputWidth = sliderOutputRef.value.getBoundingClientRect().width
    const sliderBubbleOffSetPixels =
      (percentage - 0.5) * -sliderBubbleWidthInPixels

    sliderOutputRef.value.style.left = `${percentage * inputWidth}px`
    sliderOutputRef.value.style.marginLeft = `-${
      outputWidth / 2 - sliderBubbleOffSetPixels
    }px`

    if (!sliderOutputRef.value.classList.contains("is-dragging")) {
      sliderOutputRef.value.classList.add("is-dragging")
    }
    removeIsDraggingClass(sliderOutputRef.value)
  }
})
</script>

<template>
  <div class="control">
    <output
      ref="sliderOutputRef"
      class="ob-number__output cypress-number-output"
      :for="id"
    >
      {{ text }}
    </output>
    <input
      ref="sliderInputRef"
      :id="id"
      :name="element.name"
      class="slider ob-input is-fullwidth cypress-slider-number-control is-large is-circle cypress-number-control"
      :step="element.sliderIncrement ? element.sliderIncrement : 1"
      :min="element.minNumber"
      :max="element.maxNumber"
      :value="text"
      type="range"
      @input="onChange"
      :required="element.required"
      :disabled="element.readOnly"
      @blur="onBlur"
    />
  </div>
</template>
