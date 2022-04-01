import {
  reactive,
  onBeforeUnmount,
  computed,
  getCurrentInstance,
  watch,
  ComputedRef,
  ref,
} from "vue"
import { FormTypes } from "@oneblink/types"
import { authService, submissionService } from "@oneblink/apps"
import { checkIfContentTypeIsImage } from "@/services/attachments"
//TODO
// import useAuth from "../../hooks/useAuth"
import { urlToBlobAsync } from "../services/blob-utils"
import useIsOffline from "@/composables/useIsOffline"

import {
  AttachmentNew,
  FormElementBinaryStorageValue,
} from "../types/attachments"

interface State {
  isPrivate: boolean
  abortControllerUpload: AbortController
  ignoreUpload: boolean
  abortControllerDownload: AbortController
  ignoreDownload: boolean
}

export default function useAttachments(props: {
  definition: ComputedRef<FormTypes.Form>
  element: ComputedRef<
    FormTypes.CameraElement | FormTypes.DrawElement | FormTypes.FilesElement
  >
  value?: ComputedRef<FormElementBinaryStorageValue>
  disableUpload: ComputedRef<boolean>
}) {
  const state: State = reactive({
    isPrivate: props.element.value.storageType === "private",
    abortControllerUpload: new AbortController(),
    ignoreUpload: false,
    abortControllerDownload: new AbortController(),
    ignoreDownload: false,
  })

  const imageUrl = ref<string | null>(null)
  const loadImageUrlError = ref<Error | null>(null)

  const isOffline = useIsOffline()

  const formId = computed<number>(() => props.definition.value.id)

  const isLoggedIn = computed<boolean>(() => authService.isLoggedIn())

  const isUsingFormsKey = computed<boolean>(() => {
    //TODO need to pass down from top
    return false
  })

  const isAuthenticated = computed<boolean>(() => {
    return isLoggedIn.value || isUsingFormsKey.value
  })

  const isUploading = computed<boolean>(() => {
    return !!(
      props.value &&
      props.value.value &&
      typeof props.value.value !== "string" &&
      props.value.value.type &&
      props.value.value.type === "NEW"
    )
  })

  const uploadErrorMessage = computed<string | null>(() => {
    if (
      props.value &&
      props.value.value &&
      typeof props.value.value !== "string" &&
      props.value.value.type &&
      props.value.value.type === "ERROR"
    ) {
      return props.value.value.errorMessage
    }
    return null
  })

  const canDownload = computed<boolean>(() => {
    return (
      !!props.value &&
      !!props.value.value &&
      (typeof props.value.value === "string" ||
        !!props.value.value.type ||
        !props.value.value.isPrivate ||
        isAuthenticated.value)
    )
  })

  //@ts-expect-error boss it
  const { emit } = getCurrentInstance()

  function updateSubmission({
    id,
    attachment,
  }: {
    id?: string
    attachment?: FormElementBinaryStorageValue
  }) {
    emit("updateSubmission", {
      name: props.element.value.name,
      value: { id, attachment },
    })
  }

  function triggerUpload() {
    state.abortControllerUpload.abort()
    state.ignoreUpload = true

    if (
      isOffline.value ||
      props.disableUpload.value ||
      !formId.value ||
      !props.value ||
      typeof props.value.value !== "object" ||
      props.value.value.type !== "NEW"
    ) {
      return
    }

    const newAttachment = props.value.value as AttachmentNew

    state.ignoreUpload = false
    const abortController = new AbortController()

    const effect = async () => {
      try {
        console.log(
          "Attempting to upload attachment...",
          newAttachment.fileName
        )
        const upload = await submissionService.uploadAttachment(
          {
            formId: formId.value,
            fileName: newAttachment.fileName,
            contentType: newAttachment.data.type,
            data: newAttachment.data,
            isPrivate: state.isPrivate,
          },
          abortController.signal
        )
        if (state.ignoreUpload) {
          return
        }

        console.log("Successfully Uploaded attachment!", upload)

        // UPDATE ATTACHMENT
        updateSubmission({ id: newAttachment._id, attachment: upload })
      } catch (error) {
        if (state.ignoreUpload) {
          return
        }

        console.warn(
          "Failed to upload attachment...",
          newAttachment.fileName,
          error
        )
        updateSubmission({
          id: newAttachment._id,
          attachment: {
            ...newAttachment,
            type: "ERROR",
            errorMessage: (error as Error).message,
          },
        })
      }
    }

    effect()
  }

  function triggerDownload() {
    state.ignoreDownload = true
    state.abortControllerDownload.abort()
    if (!props.value || !props.value.value) {
      return
    }

    // If the value is string we will assume a base64 data uri
    if (typeof props.value.value === "string") {
      imageUrl.value = props.value.value
      loadImageUrlError.value = null
      return
    }

    if (props.value.value.type) {
      if (!checkIfContentTypeIsImage(props.value.value.data.type)) {
        // Not an image which we will represent as null
        imageUrl.value = null
        loadImageUrlError.value = null
        return
      }

      const _imageUrl = URL.createObjectURL(props.value.value.data)
      console.log("Created object url from blob for image", _imageUrl)
      imageUrl.value = _imageUrl
      loadImageUrlError.value = null
      return
    }

    if (!checkIfContentTypeIsImage(props.value.value.contentType)) {
      // Not an image which we will represent as null
      imageUrl.value = null
      loadImageUrlError.value = null
      return
    }

    // If the file is a public url we can finish here and just use that
    if (!props.value.value.isPrivate) {
      imageUrl.value = props.value.value.url
      loadImageUrlError.value = null
      return
    }

    // If user is not logged in, we can't download private images.
    // Luckily, the imageUrl should already be set as the blob
    // url from when they uploaded it. Same applies if they are offline.
    if (!isAuthenticated.value || isOffline.value) {
      imageUrl.value = imageUrl.value || null
      loadImageUrlError.value = null
      return
    }

    state.ignoreDownload = false
    const abortController = new AbortController()
    const privateImageUrl = props.value.value.url

    const effect = async () => {
      try {
        const blob = await urlToBlobAsync(
          privateImageUrl,
          true,
          abortController.signal
        )
        if (state.ignoreDownload) {
          return
        }

        const _imageUrl = URL.createObjectURL(blob)
        console.log(
          "Created object url from private attachment for image",
          _imageUrl
        )
        imageUrl.value = _imageUrl
        loadImageUrlError.value = null
      } catch (error) {
        if (state.ignoreDownload) {
          return
        }
        console.warn("Error loading file:", error)
        loadImageUrlError.value = error as Error
      }
    }
    effect()
  }

  onBeforeUnmount(() => {
    if (imageUrl.value && imageUrl.value.startsWith("blob:")) {
      console.log("revoking image url:", imageUrl)
      URL.revokeObjectURL(imageUrl.value)
    }
  })

  watch(() => props.disableUpload, triggerUpload)
  watch(formId, triggerUpload)
  watch(isOffline, () => {
    triggerUpload()
    triggerDownload()
  })
  watch(() => state.isPrivate, triggerUpload)
  watch(
    () => props.value,
    () => {
      triggerUpload()
      triggerDownload()
    },
    { immediate: true }
  )
  watch(isAuthenticated, triggerDownload)

  return {
    isUploading,
    uploadErrorMessage,
    canDownload,
    imageUrl,
    loadImageUrlError,
  }
}
