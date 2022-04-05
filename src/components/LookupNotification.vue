<script lang="ts">
import {
  reactive,
  computed,
  inject,
  defineComponent,
  PropType,
  watch,
} from "vue"
import { FormTypes } from "@oneblink/types"
import { formService, Sentry } from "@oneblink/apps"
import { generateHeaders } from "@oneblink/apps/dist/services/fetch"

import generateDefaultData from "../services/generate-default-data"
import type { FormSubmissionModel } from "../types/form"
import type { MergeLookupResults, LookupCallback } from "../types/lookups"

import useIsOffline from "@/composables/useIsOffline"

import OnLoading from "@/components/OnLoading.vue"

import {
  executedLookupKey,
  executeLookupFailedKey,
  handlePagesLookupResultKey,
  definitionKey,
  isReadOnlyKey,
} from "@/provider-keys/OneBlinkFormBase"

interface State {
  isLookingUp: boolean
  hasLookupFailed: boolean
  hasLookupSucceeded: boolean
  isDisabled: boolean
  isCancellable: boolean
  lookupErrorHTML: string | null
  cancelLookupDisabled: boolean
  abortController: AbortController
}

export default defineComponent({
  components: { OnLoading },
  props: {
    autoLookupValue: {
      required: false,
    },
    stringifyAutoLookupValue: {
      type: Function as PropType<(autoLookupValue: unknown) => string>,
      required: false,
    },
    element: {
      type: Object as PropType<FormTypes.LookupFormElement>,
      required: true,
    },
    validationMessage: { type: String, required: false },
    hasMarginTop: { type: Boolean, required: false },
    isInputButton: { type: Boolean, required: false },
    model: {
      type: Object as PropType<Record<string, unknown>>,
      required: true,
    },
    handleLookup: {
      type: Function as PropType<(callback: LookupCallback) => void>,
      required: true,
    },
  },
  setup(props) {
    const state: State = reactive({
      isLookingUp: false,
      hasLookupFailed: false,
      hasLookupSucceeded: false,
      isDisabled: false,
      isCancellable: false,
      lookupErrorHTML: null,
      cancelLookupDisabled: false,
      abortController: new AbortController(),
    })

    const executedLookup = inject(executedLookupKey) as (id: string) => void
    const executeLookupFailed = inject(executeLookupFailedKey) as (
      id: string
    ) => void
    const handlePagesLookupResult = inject(handlePagesLookupResultKey)
    const definition = inject(definitionKey)
    const formIsReadOnly = inject(isReadOnlyKey)

    const isOffline = useIsOffline()

    const autoLookupValueString = computed<unknown>(() => {
      return props.stringifyAutoLookupValue
        ? props.stringifyAutoLookupValue(props.autoLookupValue)
        : props.autoLookupValue
    })

    const isLookup = computed<boolean>(() => {
      return props.element.isDataLookup || props.element.isElementLookup
    })

    async function fetchLookup(
      formElementLookupId: number | undefined,
      organisationId: string | undefined,
      formsAppEnvironmentId: number | undefined,
      payload: FormSubmissionModel,
      abortSignal: AbortSignal
    ): Promise<unknown> {
      if (
        typeof formElementLookupId !== "number" ||
        !organisationId ||
        typeof formsAppEnvironmentId !== "number"
      ) {
        return
      }

      console.log(
        "Attempting to retrieve form element lookup for id:",
        formElementLookupId
      )
      const formElementLookup = await formService.getFormElementLookupById(
        organisationId,
        formsAppEnvironmentId,
        formElementLookupId
      )

      if (!formElementLookup || !formElementLookup.url) {
        console.log(
          "Could not find URL for form element lookup for id:",
          formElementLookupId,
          formElementLookup
        )
        throw new Error("Could not find element lookup configuration")
      }

      const headers = await generateHeaders()
      console.log(
        `Attempting a ${formElementLookup.type} lookup request to:`,
        formElementLookup.url
      )

      const response = await fetch(formElementLookup.url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: abortSignal,
      })

      const data = await response.json()
      console.log(
        "Response from lookup to: POST",
        formElementLookup.url,
        response.status,
        data
      )

      if (!response.ok) {
        Sentry.captureException(
          new Error(`Received ${response.status} status code from lookup`)
        )
        if (response.status === 400 && data && data.message) {
          throw data.message
        }
        throw new Error("Invalid response from lookup")
      }

      return data
    }

    function mergeLookupData(
      newValue: unknown,
      dataLookupResult: Record<string, unknown>,
      elementLookupResult: FormTypes.FormElement[]
    ): void {
      if (elementLookupResult) {
        if (elementLookupResult[0] && elementLookupResult[0].type === "page") {
          handlePagesLookupResult &&
            handlePagesLookupResult(
              props.element,
              elementLookupResult as FormTypes.PageElement[],
              dataLookupResult
            )

          return
        }
      }

      props.handleLookup(({ submission, elements }: MergeLookupResults) => {
        let allElements = elements
        if (Array.isArray(elementLookupResult)) {
          const indexOfElement = elements.findIndex(
            ({ id }) => id === props.element.id
          )
          if (indexOfElement === -1) {
            console.log("Could not find element", props.element)
          } else {
            // Filter out already injected elements
            allElements = elements.filter(
              // @ts-expect-error Sorry typescript, we need to check a property you don't approve of :(
              (e) => e.injectedByElementId !== this.element.id
            )
            allElements.splice(
              indexOfElement + 1,
              0,
              ...elementLookupResult.map((e) => {
                // @ts-expect-error Sorry typescript, we need to check a property you don't approve of :(
                e.injectedByElementId = this.element.id
                return e
              })
            )
          }
        }

        return {
          elements: allElements,
          submission: generateDefaultData(allElements, {
            ...submission,
            [props.element.name]: newValue,
            ...dataLookupResult,
          }),
        }
      })
    }

    async function triggerLookup(newValue: unknown): Promise<void> {
      // No lookups for read only forms
      if (formIsReadOnly || !isLookup.value) return
      // if the element triggering the lookup has no value..
      // ..return and do nothing
      if (newValue === undefined || newValue === null) return

      state.isLookingUp = true

      if (!window.navigator.onLine) {
        state.hasLookupFailed = true
        return
      }

      executedLookup(props.element.id)

      state.isDisabled = true
      state.isCancellable = false
      state.hasLookupFailed = false
      state.hasLookupSucceeded = false
      state.lookupErrorHTML = null

      // After certain amount of time, show the cancel button
      const isCancellableTimeout = setTimeout(() => {
        state.isCancellable = !state.abortController.signal.aborted
      }, 5000)

      const payload = {
        definition: definition?.value,
        submission: {
          ...props.model,
          [props.element.name]: newValue,
        },
      }

      try {
        const [dataLookupResult, elementLookupResult] = await Promise.all([
          fetchLookup(
            props.element.dataLookupId,
            definition?.value.organisationId,
            definition?.value.formsAppEnvironmentId,
            payload,
            state.abortController.signal
          ),
          fetchLookup(
            props.element.elementLookupId,
            definition?.value.organisationId,
            definition?.value.formsAppEnvironmentId,
            payload,
            state.abortController.signal
          ),
        ])

        mergeLookupData(
          newValue,
          dataLookupResult as Record<string, unknown>,
          elementLookupResult as FormTypes.FormElement[]
        )
        state.hasLookupSucceeded = true

        // After certain amount of time, hide the lookup succeeded message
        await new Promise((resolve) => setTimeout(() => resolve(false), 750))
        state.isLookingUp = false
      } catch (error) {
        executeLookupFailed(props.element.id)

        // Cancelling will throw an error.
        if (state.abortController.signal.aborted) {
          console.log("Fetch aborted")
          state.isLookingUp = false
          return
        }

        state.hasLookupFailed = true
        state.lookupErrorHTML =
          typeof error === "string"
            ? error
            : "It looks like something went wrong.<br/>Please try again.<br />If the issue continues, please contact support."
      } finally {
        clearTimeout(isCancellableTimeout)
        state.isDisabled = false
        state.cancelLookupDisabled = true
      }
    }

    function onCancelLookup(): void {
      if (!state.cancelLookupDisabled) {
        state.abortController.abort()
      }
    }

    watch(
      () => autoLookupValueString.value,
      (newValue: unknown) => {
        if (newValue !== undefined) {
          triggerLookup(newValue)
        }
      },
      { immediate: true }
    )

    return {
      state,
      triggerLookup,
      isLookup,
      isOffline,
      onCancelLookup,
    }
  },
})
</script>

<template>
  <div>
    <slot
      v-bind:triggerLookup="triggerLookup"
      v-bind:isLookup="isLookup"
    ></slot>
    <div
      v-if="isLookup"
      :class="{
        'ob-lookup__notification': true,
        'is-looking-up': state.isLookingUp,
        'is-extended':
          state.hasLookupFailed ||
          (state.isCancellable && !state.hasLookupSucceeded),
      }"
    >
      <div class="notification has-margin-top-7 has-text-centered">
        <template v-if="state.hasLookupFailed">
          <button
            type="button"
            class="delete fade-in"
            @click="() => (state.isLookingUp = false)"
          />

          <div>
            <div v-if="isOffline">
              <i class="material-icons fade-in has-text-warning"> wifi_off </i>
              <p class="fade-in">
                It looks like you&apos;re offline. Please try again when
                connectivity is restored.
              </p>
            </div>

            <div v-else>
              <i class="material-icons fade-in has-text-danger">
                error_outline
              </i>
              <p class="fade-in" v-html="state.lookupErrorHTML || ''" />
            </div>
          </div>
        </template>

        <i
          v-if="state.hasLookupSucceeded"
          class="material-icons has-text-success fade-in"
        >
          check_circle_outline
        </i>
        <OnLoading
          v-if="!state.hasLookupSucceeded && !state.hasLookupFailed"
          small
        />
        <div
          v-if="
            state.isCancellable &&
            !state.hasLookupSucceeded &&
            !state.hasLookupFailed
          "
          class="has-margin-top-5 fade-in"
        >
          <p>Taking longer than expected?</p>
          <button
            type="button"
            class="button has-margin-top-8"
            @click="onCancelLookup"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
