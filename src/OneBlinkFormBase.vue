<script lang="ts">
import {
  defineComponent,
  reactive,
  onMounted,
  computed,
  ref,
  provide,
  onUnmounted,
  watch,
  getCurrentInstance,
  PropType,
} from "vue"

import { useRoute, onBeforeRouteLeave } from "vue-router"

import { FormTypes, FormsAppsTypes } from "@oneblink/types"
import { localisationService, formService } from "@oneblink/apps"
import { formElementsService } from "@oneblink/sdk-core"
import * as bulmaToast from "bulma-toast"
import _cloneDeep from "lodash.clonedeep"

import PageFormElements from "@/components/PageFormElements.vue"
import NavigationStep from "@/components/NavigationStep.vue"
// import CustomisableButtonInner from "@/components/CustomisableButtonInner.vue"
//TODO
// import Modal from "@/components/Modal.vue"
// import OneBlinkAppsErrorOriginalMessage from "@/components/OneBlinkAppsErrorOriginalMessage.vue"

import generateFormElementsConditionallyShown from "./services/generate-form-elements-conditionally-shown"
import {
  validateSubmission,
  generateValidationSchema,
  checkSectionValidity,
} from "./services/form-validation"
import cleanFormSubmissionModel from "./services/cleanFormSubmissionModel"
import checkIfAttachmentsAreUploading from "./services/checkIfAttachmentsAreUploading"
import generateDefaultData from "./services/generate-default-data"
import checkBsbsAreInvalid from "./services/checkBsbsAreInvalid"
import checkIfBsbsAreValidating from "./services/checkIfBsbsAreValidating"

import type {
  FormElementsValidation,
  FormElementsConditionallyShown,
  FormSubmissionModel,
} from "./types/form"

import useIsOffline from "@/composables/useIsOffline"

import {
  definitionKey,
  isReadOnlyKey,
  primaryColorKey,
  executedLookupKey,
  executeLookupFailedKey,
  googleMapsApiKeyKey,
  captchaSiteKeyKey,
  handlePagesLookupResultKey,
  abnLookupAuthenticationGuidKey,
} from "@/provider-keys/OneBlinkFormBase"

interface State {
  currentPageId?: string
  isStepsHeaderActive: boolean
  visitedPageIds: string[]
  hasAttemptedSubmit: boolean
  elementIdsWithLookupsExecuted: string[]
  isDirty: boolean
  hasConfirmedNavigation: boolean | null
  isNavigationAllowed: boolean
  goToLocation: ((value: unknown) => void) | null
  loadDynamicOptionsState: formService.LoadFormElementOptionsResult | null
  abortController: AbortController
}

export default defineComponent({
  components: {
    PageFormElements,
    NavigationStep,
    // CustomisableButtonInner,
  },
  props: {
    definition: { type: Object as PropType<FormTypes.Form>, required: true },
    submission: {
      type: Object as PropType<Record<string, unknown>>,
      required: true,
    },
    isReadOnly: Boolean,
    primaryColor: String,
    googleMapsApiKey: String,
    captchaSiteKey: String,
    showSaveDraft: Boolean,
    isPreview: Boolean,
    disabled: Boolean,
    buttons: Object as PropType<FormsAppsTypes.FormsListStyles["buttons"]>,
    abnLookupAuthenticationGuid: String,
  },
  emits: [
    "updateSubmission",
    "updateDefinition",
    "saveDraft",
    "cancel",
    "submit",
  ],
  setup(props, { emit }) {
    const state = reactive<State>({
      currentPageId: undefined,
      isStepsHeaderActive: false,
      visitedPageIds: [],
      hasAttemptedSubmit: false,
      elementIdsWithLookupsExecuted: [],
      isDirty: false,
      hasConfirmedNavigation: null,
      isNavigationAllowed: false,
      goToLocation: null,
      loadDynamicOptionsState: null,
      abortController: new AbortController(),
    })

    //composables

    const isOffline = useIsOffline()

    //template refs

    const scrollToTopOfPageHTMLElementRef = ref<Element | null>(null)

    //methods

    function checkDisplayPageError(page: FormTypes.PageElement) {
      // If we have not visited the page yet, we will not display errors
      if (!state.visitedPageIds.includes(page.id)) {
        return false
      }

      return checkSectionValidity(page, formElementsValidation.value)
    }

    function setIsDirty() {
      state.isDirty = true
    }

    function updateSubmission(newSubmission: Record<string, unknown>) {
      setIsDirty()
      emit("updateSubmission", newSubmission)
    }

    function updateDefinition(newDefinition: FormTypes.Form) {
      setIsDirty()
      emit("updateDefinition", newDefinition)
    }

    function toggleStepsNavigation() {
      state.isStepsHeaderActive = !state.isStepsHeaderActive
    }

    function setPageId(pageId: string) {
      if (
        state.currentPageId &&
        !state.visitedPageIds.includes(state.currentPageId)
      ) {
        state.visitedPageIds = [...state.visitedPageIds, state.currentPageId]
      }
      state.currentPageId = pageId
      state.isStepsHeaderActive = false
      if (
        isShowingMultiplePages.value &&
        scrollToTopOfPageHTMLElementRef.value
      ) {
        window.requestAnimationFrame(() => {
          if (scrollToTopOfPageHTMLElementRef.value instanceof Element)
            scrollToTopOfPageHTMLElementRef.value.scrollIntoView({
              block: "start",
              behavior: "smooth",
            })
        })
      }
    }

    function showDialog() {
      state.hasConfirmedNavigation = false
      return new Promise((resolve) => {
        state.goToLocation = resolve
      })
    }

    function goToPreviousPage() {
      const prevPage = visiblePages.value[currentPageIndex.value - 1]
      if (prevPage) {
        setPageId(prevPage.id)
      }
    }

    function goToNextPage() {
      const nextPage = visiblePages.value[currentPageIndex.value + 1]
      if (nextPage) {
        setPageId(nextPage.id)
      }
    }

    //TODO see if I need to do this
    const formatDatetimeLong = localisationService.formatDatetimeLong

    function executedLookup(id: string) {
      if (!state.elementIdsWithLookupsExecuted.includes(id)) {
        state.elementIdsWithLookupsExecuted.push(id)
      }
    }

    function executeLookupFailed(id: string) {
      state.elementIdsWithLookupsExecuted =
        state.elementIdsWithLookupsExecuted.filter(
          (elementId) => elementId === id
        )
    }

    function checkAttachmentsCanBeSubmitted(submission: FormSubmissionModel) {
      // Prevent submission until all attachment uploads are finished
      // Unless the user is offline, in which case, the uploads will
      // be taken care of by a pending queue...hopefully.
      if (isOffline.value) {
        return true
      }

      if (checkIfAttachmentsAreUploading(props.definition, submission)) {
        //TODO install bulma
        bulmaToast.toast({
          message:
            "Attachments are still uploading, please wait for them to finish before trying again.",
          // @ts-expect-error bulma sets this string as a class, so we are hacking in our own classes
          type: "ob-toast is-primary cypress-still-uploading-toast",
          duration: 4000,
          pauseOnHover: true,
          closeOnClick: true,
        })
        return false
      }

      return true
    }

    function getCurrentSubmissionData(stripBinaryData: boolean) {
      const { model, captchaTokens } = cleanFormSubmissionModel(
        props.submission,
        props.definition.elements,
        formElementsConditionallyShown.value,
        stripBinaryData
      )
      return {
        submission: model,
        captchaTokens,
      }
    }

    function checkBsbsCanBeSubmitted(submission: FormSubmissionModel) {
      return !checkBsbsAreInvalid(props.definition, submission)
    }

    function checkBsbAreValidating(submission: FormSubmissionModel) {
      if (checkIfBsbsAreValidating(props.definition, submission)) {
        bulmaToast.toast({
          message:
            "Bsb(s) are still being validated, please wait for them to finish before trying again.",
          // @ts-expect-error bulma sets this string as a class, so we are hacking in our own classes
          type: "ob-toast is-primary cypress-still-validating-toast",
          duration: 4000,
          pauseOnHover: true,
          closeOnClick: true,
        })
        return false
      }

      return true
    }

    function handleSaveDraft() {
      if (props.disabled) return
      if (props.showSaveDraft) {
        state.isNavigationAllowed = true

        // For drafts we don't need to save the captcha tokens,
        // they will need to prove they are not robot again
        const { submission } = getCurrentSubmissionData(false)

        if (!checkBsbAreValidating(submission)) {
          return
        }
        if (!checkAttachmentsCanBeSubmitted(submission)) {
          return
        }

        emit("saveDraft", { definition: props.definition, submission })
      }
    }

    function handleKeepGoing() {
      state.goToLocation = null
      state.hasConfirmedNavigation = null
    }

    async function handleDiscardUnsavedChanges() {
      state.isNavigationAllowed = true
      state.hasConfirmedNavigation = true
    }

    function handleCancel() {
      if (state.isDirty) {
        state.hasConfirmedNavigation = false
      } else {
        emit("cancel")
      }
    }

    function handlePagesLookupResult(
      element: FormTypes.LookupFormElement,
      elementLookupData: FormTypes.PageElement[],
      dataLookupResult?: FormSubmissionModel
    ) {
      const newPageElements = elementLookupData.map((e) => ({
        ...e,
        injectedByElementId: element.id,
      }))

      const definition = {
        ...props.definition,
        isMultiPage: true,
      }

      if (!props.definition.isMultiPage) {
        definition.elements = [
          {
            id: definition.id.toString(),
            type: "page",
            label: "Page 1",
            elements: props.definition.elements,
            conditionallyShow: false,
            requiresAllConditionallyShowPredicates: false,
          },
          ...newPageElements,
        ]
      } else {
        const indexOfPage = props.definition.elements.findIndex(
          (pageElement: FormTypes.FormElement) => {
            if (pageElement.type === "page") {
              return formElementsService.findFormElement(
                pageElement.elements,
                (el) => el.id === element.id
              )
            }
          }
        )
        if (indexOfPage === -1) {
          return
        }
        definition.elements = props.definition.elements.reduce(
          (
            partialPageElements: FormTypes.FormElement[],
            pageElement: FormTypes.FormElement,
            index: number
          ) => {
            // @ts-expect-error Sorry typescript, we need to add a property you don't approve of :(
            if (pageElement.injectedByElementId !== element.id) {
              partialPageElements.push(pageElement)
            }
            if (index === indexOfPage) {
              partialPageElements.push(...newPageElements)
            }
            return partialPageElements
          },
          []
        )
      }

      const submission = generateDefaultData(definition.elements, {
        ...props.submission,
        ...dataLookupResult,
      })
      updateSubmission(submission)
      updateDefinition(definition)
    }

    //computed props

    const pages = computed<FormTypes.PageElement[]>(() => {
      if (props.definition.isMultiPage) {
        return props.definition.elements.reduce(
          (
            pageElements: FormTypes.PageElement[],
            formElement: FormTypes.FormElement
          ) => {
            if (formElement.type === "page") {
              pageElements.push(formElement)
            }
            return pageElements
          },
          []
        )
      } else {
        return [
          {
            type: "page",
            id: props.definition.id.toString(),
            label: props.definition.name,
            elements: props.definition.elements,
            conditionallyShow: false,
            requiresAllConditionallyShowPredicates: false,
          },
        ]
      }
    })

    const formElementsConditionallyShownResult = computed<{
      formElementsConditionallyShown: FormElementsConditionallyShown
      conditionalLogicError?: Error
    }>(() =>
      generateFormElementsConditionallyShown(
        props.definition.elements,
        props.submission,
        undefined
      )
    )

    const formElementsConditionallyShown =
      computed<FormElementsConditionallyShown>(
        () =>
          formElementsConditionallyShownResult.value
            .formElementsConditionallyShown
      )

    const conditionalLogicError = computed<Error | undefined>(
      () => formElementsConditionallyShownResult.value.conditionalLogicError
    )

    const visiblePages = computed<FormTypes.PageElement[]>(() =>
      pages.value.filter(
        (pageElement) =>
          !formElementsConditionallyShown.value[pageElement.id]?.isHidden
      )
    )

    const firstVisiblePage = computed<FormTypes.PageElement>(
      () => visiblePages.value[0]
    )

    const lastVisiblePage = computed<FormTypes.PageElement>(
      () => visiblePages.value[visiblePages.value.length - 1]
    )

    const currentPage = computed<FormTypes.PageElement>(() => {
      const currentPageById = visiblePages.value.find((pageElement) => {
        return pageElement.id === state.currentPageId
      })
      if (currentPageById) {
        return currentPageById
      } else {
        return visiblePages.value[0]
      }
    })

    const currentPageIndex = computed<number>(() =>
      visiblePages.value.indexOf(currentPage.value)
    )

    const currentPageNumber = computed<number | undefined>(() => {
      if (currentPage.value) {
        return visiblePages.value.indexOf(currentPage.value) + 1
      }
      return undefined
    })

    const isShowingMultiplePages = computed<boolean>(
      () => visiblePages.value.length > 1
    )

    const validationSchema = computed<Record<string, unknown>>(() =>
      generateValidationSchema(pages.value, state.elementIdsWithLookupsExecuted)
    )

    const formElementsValidation = computed<FormElementsValidation | undefined>(
      () =>
        validateSubmission(
          validationSchema.value,
          props.submission,
          formElementsConditionallyShown.value
        )
    )

    const isDisplayingCurrentPageError = computed<boolean>(() =>
      checkDisplayPageError(currentPage.value)
    )

    //handle submit

    function handleSubmit() {
      if (props.disabled || props.isReadOnly) return
      state.hasAttemptedSubmit = true

      const submissionData = getCurrentSubmissionData(false)
      if (!checkBsbAreValidating(submissionData.submission)) {
        return
      }

      if (formElementsValidation.value) {
        console.log("Validation errors", formElementsValidation.value)
        bulmaToast.toast({
          message: "Please fix validation errors",
          // @ts-expect-error bulma sets this string as a class, so we are hacking in our own classes
          type: "ob-toast is-danger cypress-invalid-submit-attempt",
          duration: 4000,
          pauseOnHover: true,
          closeOnClick: true,
        })
        return
      }

      if (!checkAttachmentsCanBeSubmitted(submissionData.submission)) {
        return
      }

      if (!checkBsbsCanBeSubmitted(submissionData.submission)) {
        return
      }

      state.isNavigationAllowed = true

      emit("submit", {
        definition: props.definition,
        submission: submissionData.submission,
        captchaTokens: submissionData.captchaTokens,
      })
    }

    //watchers

    watch(
      () => state.hasConfirmedNavigation,
      () => {
        if (state.hasConfirmedNavigation) {
          // Navigate to the previous blocked location with your navigate function
          if (state.goToLocation) {
            state.goToLocation({})
          } else {
            emit("cancel", undefined)
          }
        }
      }
    )

    //lifecycle

    onMounted(() => {
      if (props.primaryColor) {
        //TODO theming
        // this.$theme.secondary = this.primaryColor
      }

      state.currentPageId = visiblePages.value[0].id
      if (state.loadDynamicOptionsState) {
        return
      }

      state.abortController = new AbortController()
      ;(async () => {
        const optionsByElementId =
          await formService.getFormElementDynamicOptions(props.definition)

        if (
          state.abortController.signal.aborted ||
          !optionsByElementId.length
        ) {
          return
        }

        const nonOkResponse = optionsByElementId.find(
          (optionsForElementId) => !optionsForElementId.ok
        )
        if (nonOkResponse && !nonOkResponse.ok) {
          state.loadDynamicOptionsState = nonOkResponse
          return
        }

        const clonedForm: FormTypes.Form = _cloneDeep(props.definition)
        for (const optionsForElementId of optionsByElementId) {
          if (optionsForElementId.ok) {
            formElementsService.forEachFormElementWithOptions(
              clonedForm.elements,
              (formElement) => {
                if (formElement.id === optionsForElementId.elementId) {
                  formElement.options = optionsForElementId.options
                }
              }
            )
          }
        }

        updateDefinition(clonedForm)
      })()
    })

    //TODO test with a router
    if (getCurrentInstance()?.appContext.config.globalProperties.$router) {
      const route = useRoute()
      if (route) {
        onBeforeRouteLeave((to, from, next) => {
          if (state.isDirty && !state.isNavigationAllowed) {
            showDialog().then(next)
          }
        })
      }
    }

    onUnmounted(() => {
      state.abortController.abort()
    })

    const computedDefinition = computed<FormTypes.Form>(() => props.definition)

    provide(definitionKey, computedDefinition)
    provide(isReadOnlyKey, props.isReadOnly)
    provide(primaryColorKey, props.primaryColor)
    provide(executedLookupKey, executedLookup)
    provide(executeLookupFailedKey, executeLookupFailed)
    provide(googleMapsApiKeyKey, props.googleMapsApiKey)
    provide(captchaSiteKeyKey, props.captchaSiteKey)
    provide(handlePagesLookupResultKey, handlePagesLookupResult)
    provide(abnLookupAuthenticationGuidKey, props.abnLookupAuthenticationGuid)

    return {
      state,
      conditionalLogicError,
      formatDatetimeLong,
      currentPageIndex,
      handleSubmit,
      isShowingMultiplePages,
      toggleStepsNavigation,
      isDisplayingCurrentPageError,
      currentPageNumber,
      currentPage,
      visiblePages,
      pages,
      checkDisplayPageError,
      setPageId,
      formElementsConditionallyShown,
      formElementsValidation,
      updateSubmission,
      updateDefinition,
      goToPreviousPage,
      firstVisiblePage,
      goToNextPage,
      lastVisiblePage,
      handleSaveDraft,
      handleCancel,
    }
  },
})
</script>

<template>
  <div v-if="conditionalLogicError" class="has-text-centered">
    <i class="material-icons has-text-warning icon-x-large">error</i>
    <h3 class="title is-3">Bad Form Configuration</h3>
    <p class="cypress-conditional-logic-error-message">
      {{ conditionalLogicError.message }}
    </p>
    <p class="has-text-grey">
      {{ formatDatetimeLong(new Date()) }}
    </p>
  </div>
  <template
    v-if="state.loadDynamicOptionsState && !state.loadDynamicOptionsState.ok"
  >
    <div class="has-text-centered">
      <i class="material-icons has-text-warning icon-x-large">error</i>
      <h3 class="title is-3">
        {{ state.loadDynamicOptionsState.error.title }}
      </h3>
      <p>
        {{ state.loadDynamicOptionsState.error.message }}
      </p>
      <p class="has-text-grey">
        {{ formatDatetimeLong(new Date()) }}
      </p>
    </div>

    <!--OneBlinkAppsErrorOriginalMessage
      :error="loadDynamicOptionsState.error.originalError"
    /-->
  </template>
  <div class="ob-form-container" ref="obFormContainerHTMLElementRef">
    <form
      name="obForm"
      :class="[
        'ob-form',
        'cypress-ob-form',
        'ob-form__page' + (currentPageIndex + 1),
      ]"
      noValidate
      @submit.prevent="handleSubmit"
    >
      <div>
        <div ref="scrollToTopOfPageHTMLElementRef" />
        <div
          v-if="isShowingMultiplePages"
          :class="{
            'ob-steps-navigation': true,
            'is-active': state.isStepsHeaderActive,
          }"
        >
          <div
            :class="{
              'ob-steps-navigation__header': true,
              'is-active': state.isStepsHeaderActive,
            }"
            @click="toggleStepsNavigation"
          >
            <span class="icon is-invisible">
              <i class="material-icons">keyboard_arrow_down</i>
            </span>
            <div class="steps-header-active-page">
              <span v-if="isDisplayingCurrentPageError" class="icon">
                <i class="material-icons has-text-danger is-size-4">
                  warning
                </i>
              </span>

              <span v-else class="steps-header-active-page-icon">
                {{ currentPageNumber }}
              </span>
              <span
                class="steps-header-active-page-label cypress-tablet-step-title"
              >
                {{ currentPage ? currentPage.label : "" }}
              </span>
            </div>
            <span class="dropdown icon">
              <i class="material-icons">keyboard_arrow_down</i>
            </span>
          </div>
          <!-- navigation steps in here -->
          <div
            :class="{
              'ob-steps-navigation__steps': true,
              'is-active': state.isStepsHeaderActive,
            }"
          >
            <div class="steps is-small is-horizontal-tablet cypress-steps">
              <NavigationStep
                v-for="(page, index) of visiblePages"
                :key="page.id"
                :page="page"
                :currentPage="currentPage"
                :currentPageIndex="currentPageIndex"
                :index="index"
                :hasErrors="checkDisplayPageError(page)"
                @setPageId="setPageId"
              />
            </div>
          </div>
        </div>
        <div
          :class="{
            'ob-steps-navigation__background': true,
            'is-active': state.isStepsHeaderActive,
          }"
          @click="
            {
              toggleStepsNavigation
            }
          "
        />
        <div class="steps">
          <div
            :class="{
              'steps-content': true,
              'is-single-step': !isShowingMultiplePages,
            }"
          >
            <PageFormElements
              v-for="page of pages"
              :key="page.id"
              :definition="definition"
              :pageElement="page"
              :model="submission"
              :isActive="page.id === state.currentPageId"
              :formElementsConditionallyShown="formElementsConditionallyShown"
              :formElementsValidation="formElementsValidation"
              :displayValidationMessages="
                state.hasAttemptedSubmit || isDisplayingCurrentPageError
              "
              @updateSubmission="updateSubmission"
              @updateDefintion="updateDefinition"
            />
          </div>
          <div v-if="isShowingMultiplePages" class="steps-actions">
            <div class="steps-action">
              <button
                type="button"
                @click="goToPreviousPage"
                :disabled="state.currentPageId === firstVisiblePage.id"
                class="button is-light cypress-pages-previous"
              >
                <span class="icon">
                  <i class="material-icons">keyboard_arrow_left</i>
                </span>
                <span>Back</span>
              </button>
            </div>
            <!--TODO styles come down in the API :S -->
            <div class="step-progress-mobile cypress-steps-mobile">
              <div
                v-for="page of visiblePages"
                :key="page.id"
                :class="{
                  'step-progress-mobile-dot': true,
                  'is-active': currentPage.id === page.id,
                  'has-background-danger':
                    currentPage.id !== page.id && checkDisplayPageError(page),
                }"
              />
            </div>
            <div class="steps-action">
              <button
                type="button"
                @click="goToNextPage"
                :disabled="state.currentPageId === lastVisiblePage.id"
                class="button is-light cypress-pages-next"
              >
                <span>Next</span>
                <span class="icon">
                  <i class="material-icons">keyboard_arrow_right</i>
                </span>
              </button>
            </div>
          </div>
        </div>
        <div v-if="!isReadOnly" class="buttons ob-buttons ob-buttons-submit">
          <button
            v-if="showSaveDraft && !definition.isInfoPage"
            type="button"
            class="button ob-button is-primary ob-button-save-draft cypress-save-draft-form"
            @click="handleSaveDraft"
            :disabled="isPreview || disabled"
          >
            <!--CustomisableButtonInner
              :label="
                buttons && buttons.saveDraft
                  ? buttons.saveDraft.label
                  : 'Save Draft'
              "
              :icon="
                buttons && buttons.saveDraft
                  ? buttons.saveDraft.icon
                  : undefined
              "
            /-->
          </button>
          <span class="ob-buttons-submit__spacer"></span>
          <button
            v-if="!definition.isInfoPage"
            type="button"
            class="button ob-button is-light ob-button-submit-cancel cypress-cancel-form"
            @click="handleCancel"
            :disabled="isPreview || disabled"
          >
            <!--CustomisableButtonInner
              :label="
                buttons && buttons.cancel ? buttons.cancel.label : 'Cancel'
              "
              :icon="
                buttons && buttons.cancel ? buttons.cancel.icon : undefined
              "
            /-->
          </button>
          <button
            v-if="state.currentPageId === lastVisiblePage.id"
            type="submit"
            class="button ob-button is-success ob-button-submit cypress-submit-form-button cypress-submit-form"
            :disabled="isPreview || disabled"
          >
            <!--CustomisableButtonInner
              :label="
                definition.isInfoPage
                  ? 'Done'
                  : buttons && buttons.submit
                  ? buttons.submit.label
                  : 'Submit'
              "
              :icon="
                buttons && buttons.submit ? buttons.submit.icon : undefined
              "
            /-->
          </button>
        </div>
      </div>
    </form>

    <!-- TODO -->
    <!--Modal
      :isOpen="!isReadOnly && hasConfirmedNavigation === false"
      title="Unsaved Changes"
      cardClassName="cypress-cancel-confirm"
      titleClassName="cypress-cancel-confirm-title"
      bodyClassName="cypress-cancel-confirm-body"
    >
      <template v-slot:actions>
        <button
          v-if="showSaveDraft"
          type="button"
          class="button ob-button is-success cypress-cancel-confirm-save-draft"
          @click="handleSaveDraft"
        >
          <CustomisableButtonInner
            :label="
              buttons && buttons.saveDraft
                ? buttons.saveDraft.label
                : 'Save Draft'
            "
            :icon="
              buttons && buttons.saveDraft ? buttons.saveDraft.icon : undefined
            "
          />
        </button>

        <span style="flex: 1"></span>

        <button
          type="button"
          class="button ob-button is-light cypress-cancel-confirm-back"
          @click="handleKeepGoing"
        >
          <CustomisableButtonInner
            :label="
              buttons && buttons.cancelPromptNo
                ? buttons.cancelPromptNo.label
                : 'Back'
            "
            :icon="
              buttons && buttons.cancelPromptNo
                ? buttons.cancelPromptNo.icon
                : undefined
            "
          />
        </button>
        <button
          type="button"
          class="button ob-button is-primary cypress-cancel-confirm-discard"
          @click="handleDiscardUnsavedChanges"
        >
          <CustomisableButtonInner
            :label="
              buttons && buttons.cancelPromptYes
                ? buttons.cancelPromptYes.label
                : 'Discard'
            "
            :icon="
              buttons && buttons.cancelPromptYes
                ? buttons.cancelPromptYes.icon
                : undefined
            "
          />
        </button>
      </template>
      <p>You have unsaved changes, are you sure you want discard them?</p>
    </Modal-->
  </div>
</template>
