<script lang="ts">
import { reactive, computed, defineComponent, PropType } from "vue"
import { FormTypes } from "@oneblink/types"
import FormElementLabelContainer from "@/components/FormElementLabelContainer.vue"
import LookupButton from "@/components/LookupButton.vue"
import CopyToClipboardButton from "@/components/CopyToClipboardButton.vue"

interface State {
  isDirty: boolean
}

export default defineComponent({
  components: {
    FormElementLabelContainer,
    LookupButton,
    CopyToClipboardButton,
  },
  emits: ["updateSubmission", "triggerLookup"],
  props: {
    id: { type: String, required: true },
    element: {
      type: Object as PropType<FormTypes.TextElement>,
      required: true,
    },
    value: { required: true },
    displayValidationMessage: Boolean,
    validationMessage: String,
    isLookup: Boolean,
  },
  setup(props, { emit }) {
    const state: State = reactive({
      isDirty: false,
    })

    const text = computed<string>(() =>
      typeof props.value === "string" ? props.value : ""
    )

    const isDisplayingValidationMessage = computed<boolean | undefined>(() => {
      return (
        (state.isDirty || props.displayValidationMessage) &&
        !!props.validationMessage
      )
    })

    function updateSubmission(event: Event) {
      const target = event.target as HTMLInputElement
      emit("updateSubmission", {
        name: props.element.name,
        value: target.value || undefined,
      })
    }

    function setIsDirty() {
      state.isDirty = true
    }

    function triggerLookup() {
      emit("triggerLookup", props.value)
    }

    return {
      state,
      text,
      isDisplayingValidationMessage,
      updateSubmission,
      setIsDirty,
      triggerLookup,
    }
  },
})
</script>

<template>
  <div class="cypress-text-element">
    <FormElementLabelContainer
      className="ob-text"
      :id="id"
      :element="element"
      :required="element.required"
    >
      <div class="field has-addons">
        <div class="control is-expanded">
          <input
            type="text"
            :placeholder="element.placeholderValue"
            :id="id"
            :name="element.name"
            class="input ob-input cypress-text-control"
            :value="text"
            @input="updateSubmission"
            :required="element.required"
            :disabled="element.readOnly"
            @blur="setIsDirty"
          />
        </div>
        <div class="control" v-if="!!element.readOnly && !!value">
          <CopyToClipboardButton
            className="button is-input-addon cypress-copy-to-clipboard-button"
            isInputButton
            :text="text"
          />
        </div>
        <div class="control">
          <LookupButton
            v-if="isLookup"
            isInputButton
            :value="value"
            :validationMessage="validationMessage"
            @click="triggerLookup"
          />
        </div>
      </div>
      <div
        v-if="isDisplayingValidationMessage || !!element.maxLength"
        role="alert"
        class="has-margin-top-8"
      >
        <div class="is-flex is-justify-content-space-between">
          <div
            v-if="isDisplayingValidationMessage"
            class="has-text-danger ob-error__text cypress-validation-message"
          >
            {{ validationMessage }}
          </div>
          <div v-else></div>

          <div
            v-if="!!element.maxLength"
            :class="{
              'ob-max-length__text': true,
              'cypress-max-length-message': true,
              'has-text-danger': text.length > element.maxLength,
            }"
          >
            {{ text.length }} / {{ element.maxLength }}
          </div>
        </div>
      </div>
    </FormElementLabelContainer>
  </div>
</template>
