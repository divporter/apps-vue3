<script lang="ts">
import { PropType, defineComponent, computed, ref } from "vue"

// import ClickOutsideElement from "@/components/ClickOutsideElement.vue"
import useClickOutsideElement from "@/composables/useClickOutisdeElement"
import { FormTypes } from "@oneblink/types"
import FileCardContent from "./FileCardContent.vue"
import AttachmentStatus from "@/components/attachments/AttachmentStatus.vue"
import {
  checkFileNameIsValid,
  checkFileNameExtensionIsValid,
} from "@/services/form-validation"

export default defineComponent({
  components: {
    AttachmentStatus,
    FileCardContent,
  },
  emits: ["retry", "download", "remove"],
  props: {
    element: {
      type: Object as PropType<FormTypes.FilesElement>,
      required: true,
    },
    isUploading: Boolean,
    isUploadPaused: Boolean,
    uploadErrorMessage: String,
    loadImageUrlError: Error,
    isLoadingImageUrl: Boolean,
    imageUrl: String,
    fileName: { type: String, required: true },
    canRetry: Boolean,
    canDownload: Boolean,
  },
  setup(props, { emit }) {
    const isShowingMore = ref<boolean>(false)

    const dropDownRef = ref<HTMLElement | null>(null)

    function handleClickOutside() {
      if (isShowingMore.value) {
        hideMore()
      }
    }

    //@ts-expect-error is a HTMLElement
    useClickOutsideElement(dropDownRef.value, handleClickOutside)

    const uploadError = computed<Error | undefined>(() => {
      if (!checkFileNameIsValid(props.element, props.fileName)) {
        return new Error(
          `${props.fileName.split(".").pop()} files are not allowed`
        )
      }
      if (!checkFileNameExtensionIsValid(props.element, props.fileName)) {
        return new Error(`${props.fileName} must have an extension`)
      }
      if (props.uploadErrorMessage) {
        return new Error(props.uploadErrorMessage)
      }
      return undefined
    })

    function hideMore() {
      isShowingMore.value = false
    }

    function showMore() {
      isShowingMore.value = true
    }

    function handleRetry() {
      hideMore()
      emit("retry")
    }

    function handleDownload() {
      hideMore()
      emit("download")
    }

    function handleRemove() {
      hideMore()
      emit("remove")
    }

    function toggle() {
      isShowingMore.value ? hideMore() : showMore()
    }

    return {
      isShowingMore,
      uploadError,
      handleClickOutside,
      toggle,
      handleRetry,
      handleDownload,
      handleRemove,
      dropDownRef,
    }
  },
})
</script>

<template>
  <div class="column is-one-quarter">
    <div class="ob-files__box">
      <div class="ob-files__content">
        <FileCardContent :imageUrl="imageUrl" />
      </div>

      <div
        :class="{
          dropdown: true,
          'is-right': true,
          'ob-files__menu': true,
          'is-active': isShowingMore,
        }"
        ref="dropDownRef"
      >
        <div class="dropdown-trigger">
          <button
            type="button"
            class="button ob-files__menu-button cypress-file-menu-button"
            aria-haspopup="true"
            aria-controls="dropdown-menu"
            @click="toggle"
          >
            <i class="material-icons ob-files__menu-icon">more_vert</i>
          </button>
        </div>
        <div class="dropdown-menu" role="menu">
          <div class="dropdown-content">
            <a
              v-if="canRetry"
              class="dropdown-item cypress-file-retry-button"
              @click="handleRetry"
            >
              Retry
            </a>

            <a
              v-if="canDownload"
              class="dropdown-item cypress-file-download-button"
              @click="handleDownload"
            >
              Download
            </a>
            <a
              :class="{
                'dropdown-item': true,
                'cypress-file-remove-button': true,
                'ob-files__menu-remove-hidden': element.readOnly,
              }"
              @click="handleRemove"
            >
              Remove
            </a>
          </div>
        </div>
      </div>
      <div class="ob-files__file-name is-size-6">
        <span clas="ob-files__file-name-inner">{{ fileName }}</span>
        <AttachmentStatus
          :element="element"
          :isUploading="isUploading"
          :isUploadPaused="isUploadPaused"
          :uploadError="uploadError"
          :loadImageUrlError="loadImageUrlError"
          :isLoadingImageUrl="isLoadingImageUrl"
          :imageUrl="imageUrl"
        />
      </div>
    </div>
  </div>
</template>
