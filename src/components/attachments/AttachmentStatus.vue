<script lang="ts">
import { PropType, defineComponent, computed } from "vue"
import { Tippy } from "vue-tippy"

import UploadingAttachment from "./UploadingAttachment.vue"
import { FormTypes } from "@oneblink/types"
import { checkIsUsingLegacyStorage } from "@/services/attachments"

export default defineComponent({
  components: {
    Tippy,
    UploadingAttachment,
  },
  props: {
    element: {
      type: Object as PropType<FormTypes.FormElementBinaryStorage>,
      required: true,
    },
    isUploading: Boolean,
    isUploadPaused: Boolean,
    uploadError: Error,
    loadImageUrlError: Error,
    isLoadingImageUrl: Boolean,
    imageUrl: String,
  },
  setup(props) {
    const tooltip = computed<string>(() => {
      if (props.isLoadingImageUrl && !props.imageUrl) {
        return "Attempting to load file preview. File is synced with submission."
      }
      if (props.loadImageUrlError && !props.imageUrl) {
        return "File preview not available, however file is synced with submission."
      }

      return "Synced with submission."
    })

    return { tooltip, checkIsUsingLegacyStorage }
  },
})
</script>

<template>
  <tippy
    v-if="uploadError"
    :arrow="true"
    theme="google"
    size="large"
    placement="bottom"
    :content="uploadError.message"
  >
    <i class="material-icons has-text-danger"> error </i>
  </tippy>
  <template v-else-if="checkIsUsingLegacyStorage(element)"><!-- --></template>
  <template v-else-if="isUploading">
    <span v-if="isUploadPaused" class="attachment__status-wrapper">
      <i class="material-icons">pause</i>
    </span>
    <UploadingAttachment v-else />
  </template>
  <tippy
    v-else
    :arrow="true"
    theme="google"
    size="large"
    placement="bottom"
    :content="tooltip"
  >
    <span class="attachment__status-wrapper">
      <i class="material-icons has-text-success">check_circle</i>
    </span>
  </tippy>
</template>
