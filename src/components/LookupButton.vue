<script lang="ts">
import { reactive, defineComponent, inject } from "vue"
import { lookupValidationMessage } from "@/services/form-validation"
import { isReadOnlyKey } from "@/provider-keys/OneBlinkFormBase"

interface State {
  lookupValidationMessage: string
}

export default defineComponent({
  emits: ["click"],
  props: {
    value: { required: false },
    validationMessage: String,
    hasMarginTop: Boolean,
    isInputButton: Boolean,
    isDisabled: Boolean,
  },
  setup(props, { emit }) {
    const state: State = reactive({
      lookupValidationMessage,
    })

    function handleClick() {
      emit("click")
    }

    const formIsReadOnly = inject(isReadOnlyKey) as boolean
    return {
      state,
      handleClick,
      formIsReadOnly,
    }
  },
})
</script>

<template>
  <button
    type="button"
    :class="{
      button: true,
      'is-primary': true,
      'ob-lookup__button': true,
      'cypress-lookup-button': true,
      'is-input-addon': isInputButton,
      'ob-button': !isInputButton,
      'has-margin-top-8': hasMarginTop,
    }"
    :disabled="
      formIsReadOnly ||
      isDisabled ||
      value === undefined ||
      (!!validationMessage &&
        validationMessage !== state.lookupValidationMessage)
    "
    @click="handleClick"
  >
    <span v-if="isInputButton"></span>
    <span class="icon">
      <i class="material-icons">search</i>
    </span>
    <span :class="{ 'is-hidden-mobile': isInputButton }"> &nbsp;Lookup </span>
  </button>
</template>
