<script lang="ts">
import { PropType, defineComponent } from "vue"

import { FormTypes } from "@oneblink/types"
import FormElementFilesLegacy from "./legacy/FormElementFiles.vue"
import FormElementFiles from "./FormElementFiles.vue"
import { Attachment } from "@/types/attachments"

import { checkIsUsingLegacyStorage } from "@/services/attachments"

export function stringifyAttachments(value: Attachment[] | undefined): string {
  if (Array.isArray(value) && value?.every((attachment) => !attachment.type)) {
    return JSON.stringify(value)
  }
  return ""
}

export default defineComponent({
  components: {
    FormElementFilesLegacy,
    FormElementFiles,
  },
  emits: ["updateSubmission"],
  props: {
    id: { type: String, required: true },
    element: {
      type: Object as PropType<FormTypes.FilesElement>,
      required: true,
    },
    value: { required: true },
    displayValidationMessage: Boolean,
    validationMessage: String,
  },
  setup(props, { emit }) {
    function updateSubmission(attachments?: Attachment[]) {
      emit("updateSubmission", {
        name: props.element.name,
        value: attachments,
      })
    }

    return {
      checkIsUsingLegacyStorage,
      updateSubmission,
    }
  },
})
</script>

<template>
  <FormElementFilesLegacy
    v-if="checkIsUsingLegacyStorage(element)"
    :id="id"
    :element="element"
    :value="value"
    :validationMessage="validationMessage"
    :displayValidationMessage="displayValidationMessage"
    @updateSubmission="updateSubmission"
  />
  <FormElementFiles
    v-else
    :id="id"
    :element="element"
    :value="value"
    :validationMessage="validationMessage"
    :displayValidationMessage="displayValidationMessage"
    @updateSubmission="updateSubmission"
  />
</template>
