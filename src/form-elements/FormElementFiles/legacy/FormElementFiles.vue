<script lang="ts">
import { PropType, defineComponent } from "vue"
import { FormTypes } from "@oneblink/types"
import Files from "@/components/attachments/AttachmentFiles.vue"
import FormElementFile from "./FormElementFile.vue"
import { parseFilesAsAttachmentsLegacy } from "@/services/attachments"
import { FilesElementFile } from "@/types/files"

import useIsDirty from "@/composables/useIsDirty"

export default defineComponent({
  components: {
    Files,
    FormElementFile,
  },
  emits: ["updateSubmission"],
  props: {
    id: { type: String, required: true },
    element: {
      type: Object as PropType<FormTypes.FilesElement>,
      required: true,
    },
    value: Array as PropType<Array<FilesElementFile>>,
    displayValidationMessage: Boolean,
    validationMessage: String,
  },
  setup(props, { emit }) {
    const { isDirty, setIsDirty } = useIsDirty()

    async function addFile(newFiles: File[]) {
      const attachments = await parseFilesAsAttachmentsLegacy(newFiles)
      if (!attachments.length) {
        return
      }
      emit("updateSubmission", [...(props.value || []), ...attachments])
      setIsDirty()
    }

    function handleRemove(index: number) {
      let newValue
      if (props.value) {
        newValue = props.value.filter((file, i) => i !== index)
        if (newValue.length === 0) {
          newValue = undefined
        }
      }
      emit("updateSubmission", newValue)
    }

    return {
      isDirty,
      addFile,
      handleRemove,
    }
  },
})
</script>

<template>
  <Files
    :id="id"
    :element="element"
    :isDirty="isDirty"
    :attachments="value || []"
    :displayValidationMessage="displayValidationMessage"
    :validationMessage="validationMessage"
    @addFiles="addFile"
  >
    <FormElementFile
      v-for="(attachment, index) of value || []"
      :key="index"
      :element="element"
      @remove="handleRemove"
      :file="attachment"
      :index="index"
    />
  </Files>
</template>
