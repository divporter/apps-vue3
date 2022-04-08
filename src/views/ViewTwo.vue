<script lang="ts">
import { reactive, computed, onMounted, defineComponent } from "vue"

// import OneBlinkAutoSaveForm from "./OneBlinkAutoSaveForm.vue"
import OneBlinkForm from "../OneBlinkFormUncontrolled.vue"
// import OneBlinkFormControlled from "./OneBlinkFormControlled.vue"
// import OneBlinkReadOnlyForm from "./OneBlinkReadOnlyForm.vue"
import { formService, submissionService } from "@oneblink/apps"
import type { FormTypes } from "@oneblink/types"
import type { FormSubmissionModel } from "@/types/form"

const GOOGLE_MAPS_API_KEY = process.env.VUE_APP_GOOGLE_MAPS_API_KEY
const CAPTCHA_SITE_KEY = process.env.VUE_APP_CAPTCHA_SITE_KEY

interface State {
  definition: FormTypes.Form | null
  loading: boolean
  submission: FormSubmissionModel
  formType: "uncontrolled" | "controlled" | "autoSave" | "readOnly"
}

export default defineComponent({
  components: {
    OneBlinkForm,
  },
  setup() {
    const state = reactive<State>({
      definition: null,
      loading: false,
      submission: {
        TField1: "bye",
        Number: 2,
        Email: "david@oneblink.io",
      },
      formType: "uncontrolled",
    })

    const googleMapsApiKey = computed<string>(() => GOOGLE_MAPS_API_KEY || "")
    const captchaSiteKey = computed<string>(() => CAPTCHA_SITE_KEY || "")

    function onSaveDraft(
      newDraftSubmission: submissionService.NewDraftSubmission
    ) {
      console.log(newDraftSubmission)
    }

    function onSubmit(newFormSubmission: submissionService.NewFormSubmission) {
      console.log(newFormSubmission)
    }

    function onCancel() {
      console.log("canchel")
    }

    function updateSubmission({
      submission: newSubmission,
      definition,
    }: {
      submission: FormSubmissionModel
      definition: FormTypes.Form
    }) {
      console.log(JSON.stringify(newSubmission, null, 2))
      if (newSubmission.TField1 === "four") {
        newSubmission.Number = 4
      }
      //@ts-expect-error bossing it
      definition.elements[0].elements[2].readOnly =
        newSubmission.TField1 === "four"
      state.submission = newSubmission
      state.definition = definition
    }

    function removeCaptchaElement(definition: FormTypes.Form) {
      const page = definition.elements.find(
        (el) => el.type === "page" && el.label === "Advanced"
      ) as FormTypes.PageElement
      if (!page) {
        return definition
      }
      const index = page.elements.findIndex(
        (el) => "name" in el && el.name === "Recaptcha"
      )
      if (index === -1) {
        return definition
      }
      page.elements.splice(index, 1)
      return definition
    }

    onMounted(async () => {
      state.loading = true
      const definition = await formService.getForm(9050, 992)
      state.definition = removeCaptchaElement(definition)
      state.loading = false
    })

    return {
      state,
      googleMapsApiKey,
      captchaSiteKey,
      onSaveDraft,
      onSubmit,
      onCancel,
    }
  },
})
</script>

<template>
  <OneBlinkForm
    v-if="state.formType === 'uncontrolled' && state.definition"
    :definition="state.definition"
    :googleMapsApiKey="googleMapsApiKey"
    :captchaSiteKey="captchaSiteKey"
    :initialSubmission="{
      TField1: 'bye',
      Number: 2,
      Email: 'david@oneblink.io',
    }"
    @saveDraft="onSaveDraft"
    @submit="onSubmit"
    @cancel="onCancel"
  />
</template>
