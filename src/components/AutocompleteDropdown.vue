<script lang="ts">
import {
  defineComponent,
  PropType,
  reactive,
  computed,
  ref,
  watch,
  onBeforeUnmount,
} from "vue"
import { Sentry } from "@oneblink/apps"
import useIsDirty from "@/composables/useIsDirty"

type AutocompleteOption = {
  label: string
  value: string
  data?: unknown
}

interface State {
  currentFocusedOptionIndex: number
  options: AutocompleteOption[]
  error: Error | null
  isFetchingOptions: boolean
  isOpen: boolean
  abortController: AbortController
  timeoutId: number
  ignore: boolean
}

export default defineComponent({
  emits: ["changeLabel", "changeValue"],
  props: {
    id: { type: String, required: true },
    label: { type: String, required: true },
    value: { required: false },
    placeholder: String,
    required: Boolean,
    disabled: Boolean,
    isLoading: Boolean,
    hasError: Boolean,
    validationMessage: String,
    displayValidationMessage: Boolean,
    searchDebounceMs: { type: Number, required: true },
    searchMinCharacters: { type: Number, required: true },
    onSearch: {
      type: Function as PropType<
        (
          label: string,
          abortSignal: AbortSignal
        ) => Promise<AutocompleteOption[]>
      >,
      required: true,
    },
  },
  setup(props, { emit }) {
    const state = reactive<State>({
      currentFocusedOptionIndex: 0,
      options: [],
      error: null,
      isFetchingOptions: false,
      isOpen: false,
      abortController: new AbortController(),
      timeoutId: 0,
      ignore: false,
    })

    const { isDirty, setIsDirty } = useIsDirty()

    const optionsContainerElement = ref<Element | null>(null)

    const isShowingLoading = computed<boolean>(() => {
      return state.isFetchingOptions || !!props.isLoading
    })

    const isShowingValid = computed<boolean>(() => {
      return !isShowingLoading.value && props.value !== undefined
    })

    const isShowingError = computed(() => {
      return !isShowingLoading.value && !!props.hasError
    })

    function selectOption(option: AutocompleteOption) {
      emit("changeLabel", option.label)
      emit("changeValue", option.value, option.data)
      state.isOpen = false
      return
    }

    function clickOption(option: AutocompleteOption) {
      console.log("Selected element option in autocomplete", option)
      selectOption(option)
    }

    function focus() {
      state.currentFocusedOptionIndex = 0
      state.isOpen = true
    }

    function handleBlur() {
      setIsDirty()
      state.error = null
      state.isOpen = false

      if (!props.value && Array.isArray(state.options)) {
        // If there is no option currently selected but the typed in label
        // matches an option's label, set that option as the value, otherwise remove label
        if (props.label) {
          const lowerCase = props.label.toLowerCase()
          const option = state.options.find(
            (option) => option.label.toLowerCase() === lowerCase
          )
          if (option) {
            console.log("Setting value after blurring away from autocomplete")
            selectOption(option)
            return
          }
        }
        console.log("Removing label after blurring away from autocomplete")
        emit("changeLabel", "")
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (!state.options) {
        return
      }
      const enterPressed = event.keyCode === 13
      const upArrowPressed = event.keyCode === 38
      const downArrowPressed = event.keyCode === 40
      if (!upArrowPressed && !downArrowPressed && !enterPressed) {
        return
      }

      event.preventDefault()

      const previousFocusedOptionIndex = state.currentFocusedOptionIndex
      let nextFocusedOptionIndex = state.currentFocusedOptionIndex
      if (upArrowPressed) {
        nextFocusedOptionIndex = Math.max(
          0,
          state.currentFocusedOptionIndex - 1
        )
      } else if (downArrowPressed) {
        nextFocusedOptionIndex = Math.min(
          state.options.length - 1,
          state.currentFocusedOptionIndex + 1
        )
      } else if (enterPressed) {
        const option = state.options[nextFocusedOptionIndex]
        if (option) {
          selectOption(option)
        }
      }

      // If the index has changed, need to ensure the active option is visible
      if (
        previousFocusedOptionIndex !== nextFocusedOptionIndex &&
        optionsContainerElement.value
      ) {
        const activeStepElement = optionsContainerElement.value.querySelector(
          `.ob-autocomplete__drop-down-item-${nextFocusedOptionIndex}`
        )
        if (activeStepElement) {
          activeStepElement.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "start",
          })
        }
        state.currentFocusedOptionIndex = nextFocusedOptionIndex
      }
    }

    function handleChangeLabel(e: Event) {
      const target = e.target as HTMLInputElement
      const newLabel = target.value
      state.isOpen = true
      state.currentFocusedOptionIndex = 0

      // Remove value when changing label
      emit("changeValue", undefined)
      emit("changeLabel", newLabel)
    }

    function search() {
      state.error = null
      clearTimeout(state.timeoutId)
      state.abortController.abort()
      state.ignore = true

      if (!state.isOpen || props.label.length < props.searchMinCharacters) {
        state.isFetchingOptions = false
        return
      }

      state.isFetchingOptions = true

      state.abortController = new AbortController()

      state.ignore = false
      state.timeoutId = setTimeout(async () => {
        let newOptions: AutocompleteOption[] = []
        let newError = null

        try {
          newOptions = await props.onSearch(
            props.label,
            state.abortController.signal
          )
        } catch (error) {
          // Cancelling will throw an error.
          if (!state.abortController.signal.aborted) {
            console.warn("Error while fetching autocomplete options", error)
            Sentry.captureException(error)
            newError = error as Error
          }
        }
        if (!state.ignore) {
          state.error = newError
          state.options = newOptions
          state.isFetchingOptions = false
        }
      }, props.searchDebounceMs)
    }

    function highlightLabel(text: string, phrase: string) {
      if (phrase) {
        text = text.replace(new RegExp("(" + phrase + ")", "gi"), "<b>$1</b>")
      }
      return text
    }

    watch(() => props.label, search)
    watch(() => state.isOpen, search)

    onBeforeUnmount(() => {
      clearTimeout(state.timeoutId)
    })

    return {
      state,
      isDirty,
      isShowingLoading,
      isShowingValid,
      isShowingError,
      handleBlur,
      onKeyDown,
      handleChangeLabel,
      highlightLabel,
      clickOption,
      focus,
    }
  },
})
</script>

<template>
  <div
    :class="{
      dropdown: true,
      'is-active': state.isOpen && Array.isArray(state.options),
    }"
  >
    <div class="field">
      <div
        :class="{
          'cypress-autocomplete-field-control': true,
          control: true,
          'is-expanded': true,
          'is-loading': isShowingLoading,
          'has-icons-right': isShowingValid || isShowingError,
        }"
      >
        <input
          type="text"
          :placeholder="placeholder"
          :id="id"
          autocomplete="off"
          class="cypress-autocomplete-control input ob-input"
          :required="required"
          :value="label"
          :disabled="disabled"
          @focus="focus"
          @blur="handleBlur"
          @keydown="onKeyDown"
          @input="handleChangeLabel"
        />
        <span
          v-if="isShowingValid"
          class="ob-input-icon icon is-small is-right"
        >
          <i class="material-icons is-size-5 has-text-success"> check </i>
        </span>
        <span
          v-if="isShowingError"
          class="ob-input-icon icon is-small is-right"
        >
          <i class="material-icons is-size-5 has-text-danger"> error </i>
        </span>
      </div>
    </div>

    <div class="dropdown-menu">
      <div
        ref="optionsContainerElement"
        class="ob-autocomplete__dropdown-content dropdown-content cypress-autocomplete-dropdown-content"
      >
        <a
          v-if="state.error"
          class="dropdown-item cypress-autocomplete-error ob-autocomplete__drop-down-item-error"
        >
          <span class="has-text-danger">{{ state.error.message }}</span>
        </a>
        <a
          v-else-if="label.length < searchMinCharacters"
          class="dropdown-item cypress-max-characters ob-autocomplete__drop-down-item-max-characters"
        >
          <i>
            Enter at least {{ searchMinCharacters }} character(s) to search
          </i>
        </a>
        <a
          v-else-if="isShowingLoading"
          class="dropdown-item cypress-searching-options ob-autocomplete__drop-down-item-searching"
        >
          <i>Searching...</i>
        </a>

        <template v-else-if="state.options && state.options.length">
          <a
            v-for="(option, index) of state.options"
            :key="option.value"
            :class="{
              'dropdown-item': true,
              'cypress-autocomplete-dropdown-item': true,
              ['ob-autocomplete__drop-down-item-' + index]: true,
              'is-active': state.currentFocusedOptionIndex === index,
            }"
            @mousedown.stop.prevent="() => clickOption(option)"
            v-html="highlightLabel(option.label, label)"
        /></template>
        <a
          v-else
          class="dropdown-item cypress-no-matches-found ob-autocomplete__drop-down-item-no-matches"
        >
          <i>No matches found</i>
        </a>
      </div>
    </div>
  </div>

  <div
    v-if="
      (isDirty || displayValidationMessage) &&
      !!validationMessage &&
      !isShowingLoading
    "
    role="alert"
    class="has-margin-top-8"
  >
    <div class="has-text-danger ob-error__text cypress-validation-message">
      {{ validationMessage }}
    </div>
  </div>
</template>
