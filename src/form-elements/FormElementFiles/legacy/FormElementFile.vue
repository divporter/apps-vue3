<script lang="ts">
import { PropType, defineComponent, computed } from "vue"
import { FormTypes } from "@oneblink/types"
import { FilesElementFile } from "@/types/files"
import { checkIfContentTypeIsImage } from "../../../services/attachments"
import { downloadFileLegacy } from "../../../services/download-file"
import FileCard from "@/components/attachments/FileCard.vue"

export default defineComponent({
  components: {
    FileCard,
  },
  emits: ["remove"],
  props: {
    file: { type: Object as PropType<FilesElementFile>, required: true },
    element: {
      type: Object as PropType<FormTypes.FilesElement>,
      required: true,
    },
    index: { type: Number, required: true },
  },
  setup(props, { emit }) {
    const isImageType = computed<boolean>(() => {
      const matches = props.file.data.match(/data:(\w*\/\w*);base64/)
      if (!matches) {
        return false
      }
      return checkIfContentTypeIsImage(matches[1])
    })

    function handleRemove() {
      emit("remove", props.index)
    }

    function handleDownload() {
      downloadFileLegacy(props.file.data, props.file.fileName)
    }

    return {
      isImageType,
      handleRemove,
      handleDownload,
    }
  },
})
</script>

<template>
  <FileCard
    :element="element"
    :imageUrl="isImageType ? file.data : undefined"
    :fileName="file.fileName"
    canDownload
    @download="handleDownload"
    @remove="handleRemove"
  />
</template>
