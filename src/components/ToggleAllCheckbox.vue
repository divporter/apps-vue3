<script lang="ts">
import { defineComponent, PropType, computed } from "vue"
import { FormTypes } from "@oneblink/types"

export default defineComponent({
  emits: ["toggleAll"],
  props: {
    id: {
      type: String,
      required: true,
    },
    element: {
      type: Object as PropType<
        FormTypes.CheckboxElement | FormTypes.SelectElement
      >,
      required: true,
    },
    options: {
      type: Array as PropType<FormTypes.ChoiceElementOption[]>,
      required: true,
    },
    selected: {
      type: Array as PropType<Array<string>>,
      required: true,
    },
    disabled: Boolean,
  },
  setup(props, { emit }) {
    const allSelected = computed<boolean>(() => {
      return props.options.every((option) => {
        return props.selected.includes(option.value)
      })
    })

    function handleToggleAll(input: boolean) {
      emit("toggleAll", input)
    }

    return {
      allSelected,
      handleToggleAll,
    }
  },
})
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
