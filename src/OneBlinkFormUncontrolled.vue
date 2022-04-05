<script lang="ts">
import {
  defineComponent,
  reactive,
  computed,
  useAttrs,
  provide,
  PropType,
} from "vue"
import type { FormTypes, FormsAppsTypes } from "@oneblink/types"
import type { submissionService as SubmissionService } from "@oneblink/apps"

import OneBlinkFormBase from "./OneBlinkFormBase.vue"
import generateDefaultData from "./services/generate-default-data"
import _cloneDeep from "lodash.clonedeep"

import type { FormSubmissionModel } from "@/types/form"
import { submissionKey } from "./provider-keys/OneBlinkForm"

interface State {
  submission: Record<string, unknown>
  clonedDefinition: FormTypes.Form
}

export default defineComponent({
  components: {
    OneBlinkFormBase,
  },
  emits: ["updateSubmission", "saveDraft", "cancel", "submit"],
  props: {
    definition: { type: Object as PropType<FormTypes.Form>, required: true },
    isReadOnly: Boolean,
    googleMapsApiKey: String,
    captchaSiteKey: String,
    isPreview: Boolean,
    disabled: Boolean,
    buttons: Object as PropType<FormsAppsTypes.FormsListStyles["buttons"]>,
    initialSubmission: {
      type: Object as PropType<FormSubmissionModel>,
      required: false,
    },
    primaryColor: String,
    abnLookupAuthenticationGuid: String,
  },
  setup(props, { emit }) {
    const state = reactive<State>({
      submission: generateDefaultData(
        props.definition.elements,
        props.initialSubmission || {}
      ),
      clonedDefinition: _cloneDeep(props.definition),
    })

    const attrs = useAttrs()

    const showSaveDraft = computed(() => attrs && !!attrs["onSaveDraft"])

    function updateSubmission(newSubmission: Record<string, unknown>) {
      if (process.env.NODE_ENV === "development") {
        console.log(
          JSON.stringify({ ...state.submission, ...newSubmission }, null, 2)
        )
      }

      state.submission = { ...state.submission, ...newSubmission }
    }

    function updateDefinition(newDefinition: FormTypes.Form) {
      state.clonedDefinition = newDefinition
    }

    function handleCancel() {
      emit("cancel")
    }

    function handleSaveDraft(evt: SubmissionService.NewDraftSubmission) {
      emit("saveDraft", evt)
    }
    function handleSubmit(evt: SubmissionService.NewFormSubmission) {
      emit("submit", evt)
    }

    provide(submissionKey, state.submission)

    return {
      state,
      showSaveDraft,
      updateSubmission,
      updateDefinition,
      handleCancel,
      handleSaveDraft,
      handleSubmit,
    }
  },
})
</script>

<template>
  <OneBlinkFormBase
    :definition="state.clonedDefinition"
    @updateDefinition="updateDefinition"
    :submission="state.submission"
    @updateSubmission="updateSubmission"
    :isReadOnly="isReadOnly"
    :googleMapsApiKey="googleMapsApiKey"
    :captchaSiteKey="captchaSiteKey"
    :isPreview="isPreview"
    :disabled="disabled"
    :buttons="buttons"
    @cancel="handleCancel"
    @saveDraft="handleSaveDraft"
    @submit="handleSubmit"
    :showSaveDraft="showSaveDraft"
    :primaryColor="primaryColor"
    :abnLookupAuthenticationGuid="abnLookupAuthenticationGuid"
  />
</template>
