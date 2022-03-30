<script lang="ts">
import { defineComponent, PropType, ref, computed } from "vue"
import CopyToClipboardButton from "@/components/CopyToClipboardButton.vue"
import LookupButton from "@/components/LookupButton.vue"
import { FormTypes } from "@oneblink/types"
import FormElementLabelContainer from "@/components/FormElementLabelContainer.vue"

export default defineComponent({
  components: {
    CopyToClipboardButton,
    LookupButton,
    FormElementLabelContainer,
  },
  emits: ["updateSubmission", "triggerLookup"],
  props: {
    id: { type: String, required: true },
    element: {
      type: Object as PropType<FormTypes.EmailElement>,
      required: true,
    },
    value: { required: true },
    displayValidationMessage: Boolean,
    validationMessage: { type: String, required: false },
    isLookup: Boolean,
  },
  setup(props, { emit }) {
    const isDirty = ref(false)

    const text = computed<string>(() => {
      return typeof props.value === "string" ? props.value : ""
    })

    function updateSubmission(event: Event) {
      const target = event.target as HTMLInputElement
      emit("updateSubmission", {
        name: props.element.name,
        value: target.value || undefined,
      })
    }

    function setIsDirty() {
      isDirty.value = true
    }

    function triggerLookup() {
      emit("triggerLookup", props.value)
    }

    return {
      isDirty,
      text,
      updateSubmission,
      setIsDirty,
      triggerLookup,
    }
  },
})
</script>

<template>
  <div class="cypress-email-element">
    <FormElementLabelContainer
      className="ob-email"
      :id="id"
      :element="element"
      :required="element.required"
    >
      <div class="field has-addons">
        <div class="control is-expanded has-icons-right">
          <input
            type="email"
            :placeholder="element.placeholderValue"
            :id="id"
            :name="element.name"
            class="input ob-input cypress-email-control"
            :value="text"
            @input="updateSubmission"
            :required="element.required"
            :disabled="element.readOnly"
            @blur="setIsDirty"
          />
          <span class="ob-input-icon icon is-small is-right">
            <i class="material-icons is-size-5">email</i>
          </span>
        </div>
        <div v-if="!!element.readOnly && !!value" class="control">
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
