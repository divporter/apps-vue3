<script lang="ts">
import { PropType, defineComponent, inject, computed, ComputedRef } from "vue"

import downloadAttachment from "@/services/download-file"
import { FormTypes } from "@oneblink/types"
import FileCard from "@/components/attachments/FileCard.vue"
import { Attachment } from "@/types/attachments"
import useAttachments from "@/composables/useAttachments"
import { definitionKey } from "@/provider-keys/OneBlinkFormBase"

export default defineComponent({
  components: {
    FileCard,
  },
  emits: ["remove", "changeAttachment"],
  props: {
    element: {
      type: Object as PropType<FormTypes.FilesElement>,
      required: true,
    },
    value: {
      type: Object as PropType<Attachment>,
      required: true,
    },
    disableUpload: Boolean,
  },
  setup(props, { emit }) {
    const computedElement = computed<FormTypes.FilesElement>(
      () => props.element
    )

    const computedValue = computed<Attachment>(() => props.value)

    const computedDisabledUpload = computed<boolean>(() => props.disableUpload)

    const definition = inject(definitionKey) as ComputedRef<FormTypes.Form>

    const {
      isUploading,
      uploadErrorMessage,
      canDownload,
      imageUrl,
      loadImageUrlError,
    } = useAttachments({
      element: computedElement,
      definition,
      value: computedValue,
      disableUpload: computedDisabledUpload,
    })

    function handleRemove() {
      if (!props.value.type) {
        emit("remove", props.value.id)
        return
      }
      emit("remove", props.value._id)
    }

    function handleDownload() {
      downloadAttachment(props.value)
    }

    function handleRetry() {
      if (props.value.type === "ERROR") {
        emit("changeAttachment", {
          id: props.value._id,
          attachment: {
            type: "NEW",
            _id: props.value._id,
            data: props.value.data,
            fileName: props.value.fileName,
            isPrivate: props.value.isPrivate,
          },
        })
      }
    }

    return {
      handleRemove,
      handleDownload,
      handleRetry,
      isUploading,
      uploadErrorMessage,
      canDownload,
      imageUrl,
      loadImageUrlError,
    }
  },
})
</script>

<template>
  <FileCard
    :element="element"
    :isUploading="isUploading"
    :isUploadPaused="disableUpload"
    :uploadErrorMessage="uploadErrorMessage"
    :loadImageUrlError="loadImageUrlError"
    :isLoadingImageUrl="imageUrl === undefined"
    :imageUrl="imageUrl"
    :fileName="value.fileName"
    :canDownload="canDownload"
    @download="handleDownload"
    :canRetry="value && value.type === 'ERROR'"
    @retry="handleRetry"
    @remove="handleRemove"
  />
</template>
