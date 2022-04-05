<script lang="ts">
import { defineComponent, PropType, ref, computed, watch } from "vue"
import { FormTypes } from "@oneblink/types"
import FormElementLabelContainer from "@/components/FormElementLabelContainer.vue"
import FormElementOptions from "@/components/FormElementOptions.vue"
import OptionButton from "@/form-elements/OptionButton.vue"

export default defineComponent({
  components: {
    FormElementLabelContainer,
    FormElementOptions,
    OptionButton,
  },
  emits: ["updateSubmission"],
  props: {
    id: { type: String, required: true },
    element: {
      type: Object as PropType<FormTypes.RadioButtonElement>,
      required: true,
    },
    value: { required: true },
    displayValidationMessage: Boolean,
    validationMessage: { type: String, required: false },
    conditionallyShownOptions: Array as PropType<
      FormTypes.ChoiceElementOption[]
    >,
  },
  setup(props, { emit }) {
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

    function updateSubmission(input: string | undefined) {
      emit("updateSubmission", {
        name: props.element.name,
        value: input || undefined,
      })
    }

    function setIsDirty() {
      isDirty.value = true
    }

    function updateSubmissionAndSetDirty(input: string | undefined) {
      setIsDirty()
      updateSubmission(input)
    }

    watch(
      () => props.value,
      (newValue) => {
        if (!props.element.options) {
          return
        }
        if (
          typeof newValue === "string" &&
          newValue &&
          !filteredOptions.value.some((option) => newValue === option.value)
        ) {
          updateSubmission(undefined)
          return
        }
      }
    )

    return {
      isDirty,
      filteredOptions,
      updateSubmission,
      setIsDirty,
      updateSubmissionAndSetDirty,
    }
  },
})
</script>

<template>
  <div class="cypress-radio-element">
    <FormElementLabelContainer
      className="ob-radio"
      :id="id"
      :element="element"
      :required="element.required"
    >
      <FormElementOptions :options="element.options || []">
        <div v-if="!element.buttons">
          <div
            v-for="option of filteredOptions"
            class="control"
            :key="option.value"
          >
            <ui-form-field>
              <label class="radio ob-radio__input-label cypress-radio-label">
                <ui-radio
                  :modelValue="value"
                  :value="option.value"
                  :class="[
                    'ob-radio__input',
                    'cypress-radio-control',
                    value === option.value ? 'ob-radio__input-checked' : '',
                  ]"
                  :disabled="element.readOnly"
                  @update:modelValue="updateSubmissionAndSetDirty"
                />
                {{ option.label }}
              </label>
            </ui-form-field>
          </div>
        </div>

        <div
          v-else
          class="buttons ob-buttons ob-buttons-radio cypress-radio-button-group"
        >
          <div
            v-for="option of filteredOptions"
            class="ob-button-radio-container"
            :key="option.value"
          >
            <OptionButton
              :element="element"
              :option="option"
              :isSelected="value === option.value"
              @click="updateSubmissionAndSetDirty"
              :class="{
                button: true,
                'ob-button': true,
                'ob-button__input': true,
                'ob-radio__button': true,
                'cypress-radio-button-control': true,
                'is-primary': value === option.value,
                'is-light': value !== option.value,
              }"
            />
          </div>
        </div>
      </FormElementOptions>

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

<style scoped>
.mdc-radio .mdc-radio__background:before {
  background-color: unset;
}

.mdc-radio .mdc-radio__ripple:before {
  background-color: unset;
}

.mdc-radio .mdc-radio__ripple:after {
  background-color: unset;
}
</style>
