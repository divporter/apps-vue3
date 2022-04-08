<script lang="ts">
import { defineComponent, PropType, computed, ref, watchEffect } from "vue"
import { FormTypes } from "@oneblink/types"
import _debounce from "lodash.debounce"

const sliderBubbleWidthInPixels = 24

export default defineComponent({
  emits: ["blur", "change"],
  props: {
    id: { type: String, required: true },
    text: { type: String, required: true },
    value: { required: true },
    element: {
      type: Object as PropType<FormTypes.NumberElement>,
      required: true,
    },
  },
  setup(props, { emit }) {
    const number = computed<number>(() => {
      return typeof props.value === "number"
        ? props.value
        : parseFloat(props.value as string)
    })

    function onBlur() {
      emit("blur")
    }

    function onChange(event: Event) {
      emit("change", event)
    }

    const removeIsDraggingClass = _debounce(
      (outputElement: HTMLOutputElement) => {
        if (outputElement.classList.contains("is-dragging")) {
          outputElement.classList.remove("is-dragging")
        }
      },
      500
    )

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
        removeIsDraggingClass(sliderOutputRef.value as HTMLOutputElement)
      }
    })

    return {
      number,
      onBlur,
      onChange,
      removeIsDraggingClass,
      sliderOutputRef,
      sliderInputRef,
    }
  },
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
