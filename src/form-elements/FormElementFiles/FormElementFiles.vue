<script lang="ts">
import { PropType, defineComponent, computed } from "vue"
import { FormTypes } from "@oneblink/types"

import Files from "@/components/attachments/AttachmentFiles.vue"
import FormElementFile from "./FormElementFile.vue"

import {
  checkFileNameIsValid,
  checkFileNameExtensionIsValid,
} from "@/services/form-validation"
import {
  prepareNewAttachment,
  correctFileOrientation,
} from "@/services/attachments"
import { canvasToBlob } from "@/services/blob-utils"
import { Attachment, AttachmentNew } from "@/types/attachments"

import useIsDirty from "@/composables/useIsDirty"

export default defineComponent({
  components: {
    Files,
    FormElementFile,
  },
  props: {
    id: { type: String, required: true },
    element: {
      type: Object as PropType<FormTypes.FilesElement>,
      required: true,
    },
    value: Array as PropType<Attachment[]>,
    displayValidationMessage: Boolean,
    validationMessage: String,
  },
  setup(props, { emit }) {
    const { isDirty, setIsDirty } = useIsDirty()

    const attachments = computed<Attachment[]>(() => {
      return props.value || []
    })

    function disableUpload(attachment: Attachment): boolean {
      return (
        (!!props.element.maxEntries &&
          attachments.value.length > props.element.maxEntries) ||
        !checkFileNameIsValid(props.element, attachment.fileName) ||
        !checkFileNameExtensionIsValid(props.element, attachment.fileName)
      )
    }

    async function addAttachments(files: File[]) {
      if (!files.length) return
      const newAttachments: AttachmentNew[] = await Promise.all(
        files.map(async (file) => {
          const result = await correctFileOrientation(file)
          if (result instanceof Blob) {
            return prepareNewAttachment(result, file.name, props.element)
          }

          const blob = await canvasToBlob(result)
          return prepareNewAttachment(blob, file.name, props.element)
        })
      )

      if (!Array.isArray(props.value) || !props.value.length) {
        emit("updateSubmission", newAttachments)
        return
      }

      emit("updateSubmission", [...props.value, ...newAttachments])

      setIsDirty()
    }

    function changeAttachment({
      id,
      attachment,
    }: {
      id: string
      attachment: Attachment
    }) {
      if (!props.value) {
        return
      }
      emit(
        "updateSubmission",
        props.value.map((att) => {
          // Can only change attachments that are not uploaded (have a type)
          if (att.type && att._id === id) {
            return attachment
          }
          return att
        })
      )
      setIsDirty()
    }

    function removeAttachment(id: string) {
      if (!props.value) {
        return
      }
      const newAttachments = props.value.filter((att) => {
        if (!att.type) {
          return att.id !== id
        }
        return att._id !== id
      })
      if (newAttachments?.length) {
        emit("updateSubmission", newAttachments)
      }
      setIsDirty()
    }

    function updateSubmission({
      value: payload,
    }: {
      value: {
        id?: string
        attachment?: Attachment
      }
    }) {
      const { id, attachment } = payload
      if (attachment && !attachment.type && props.value) {
        emit(
          "updateSubmission",
          props.value.map((att) => {
            // override attachments with a type with an that are uploaded (do not have a type)
            if (att.type && att._id === id) {
              return attachment
            }
            return att
          })
        )
      }
    }

    return {
      isDirty,
      attachments,
      setIsDirty,
      addAttachments,
      removeAttachment,
      changeAttachment,
      disableUpload,
      updateSubmission,
    }
  },

  methods: {},
})
</script>

<template>
  <Files
    :id="id"
    :isDirty="isDirty"
    :element="element"
    :attachments="attachments"
    :displayValidationMessage="displayValidationMessage"
    :validationMessage="validationMessage"
    @addFiles="addAttachments"
  >
    <FormElementFile
      v-for="(attachment, index) of attachments"
      :key="index"
      :element="element"
      @remove="removeAttachment"
      :value="attachment"
      @changeAttachment="changeAttachment"
      :disableUpload="disableUpload(attachment)"
      @updateSubmission="updateSubmission"
    />
  </Files>
</template>
