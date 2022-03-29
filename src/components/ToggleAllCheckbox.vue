<script setup lang="ts">
import { defineProps, computed, defineEmits } from "vue"
import { FormTypes } from "@oneblink/types"

interface Props {
  id: string
  element: FormTypes.CheckboxElement
  options: FormTypes.ChoiceElementOption[]
  selected: string[]
  disabled?: boolean
}

const props = defineProps<Props>()

const allSelected = computed<boolean>(() => {
  return props.options.every((option) => {
    return props.selected.includes(option.value)
  })
})

const emit = defineEmits<{
  (e: "toggleAll", v: boolean): void
}>()

function handleToggleAll(input: boolean) {
  emit("toggleAll", input)
}
</script>

<template>
  <ui-form-field>
    <label
      class="checkbox ob-checkbox__input-label cypress-checkbox-label"
      :for="id + '_select-all'"
      :style="{ fontStyle: 'italic', marginBottom: '1.25rem' }"
    >
      <ui-checkbox
        :class="{
          'ob-checkbox__input-checked': allSelected,
          'ob-checkbox__input': true,
          'cypress-checkbox-control': true,
        }"
        :id="id + '_select-all'"
        :model="allSelected"
        :indeterminate="!!selected.length && !allSelected"
        @change="handleToggleAll"
        :disabled="disabled"
      />
      {{ allSelected ? "Deselect All" : "Select All" }}
    </label>
  </ui-form-field>
</template>

<style scoped>
.mdc-checkbox :deep(.mdc-checkbox__background) {
  left: 0;
  top: 0;
  animation: none;
  transition: none;
}

.mdc-checkbox :deep(.mdc-checkbox__background path),
.mdc-checkbox :deep(.mdc-checkbox__background svg),
.mdc-checkbox :deep(.mdc-checkbox__background .mdc-checkbox__mixedmark) {
  animation: none;
  transition: none;
}

.ob-checkbox__input-checked :deep(.mdc-checkbox__background),
.mdc-checkbox--selected :deep(.mdc-checkbox__background) {
  background: rgba(0, 0, 0, 0.54) !important;
  border-color: transparent !important;
}

.mdc-checkbox :deep(.mdc-checkbox__background .mdc-checkbox__mixedmark) {
  background-color: #fff;
}

.ob-checkbox__input:hover,
.ob-checkbox__input:active,
.ob-checkbox__input:focus {
  background-color: unset;
}

.mdc-checkbox :deep(.mdc-checkbox__ripple) {
  opacity: 0;
}
</style>
