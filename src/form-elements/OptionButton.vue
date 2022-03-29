<script setup lang="ts">
import { defineProps, defineEmits, computed } from "vue"
import Color from "color"
import { FormTypes } from "@oneblink/types"

interface Props {
  element:
    | FormTypes.RadioButtonElement
    | FormTypes.CheckboxElement
    | FormTypes.ComplianceElement
  option: FormTypes.ChoiceElementOption
  isSelected: boolean
  className?: string
}

const props = defineProps<Props>()

const buttonContrastColor = computed<string>(() => {
  const black = "#000000"
  const white = "#FFFFFF"
  if (!props.option.colour) return white
  const color = Color(props.option.colour)
  return color.isLight() ? black : white
})

const style = computed<Record<string, string> | undefined>(() => {
  return props.option.colour && props.isSelected
    ? {
        backgroundColor: props.option.colour,
        color: buttonContrastColor.value,
      }
    : undefined
})

const emit = defineEmits<{
  (e: "click", v: string | undefined): void
}>()

function onClick() {
  emit("click", props.option.value)
}
</script>

<template>
  <button
    type="button"
    :style="style"
    :disabled="element.readOnly"
    @click="onClick"
  >
    {{ option.label }}
  </button>
</template>
