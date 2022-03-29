<script setup lang="ts">
import {
  defineProps,
  reactive,
  computed,
  defineEmits,
  ref,
  watchEffect,
} from "vue"
import { FormTypes } from "@oneblink/types"
import { Tippy } from "vue-tippy"
import { checkSectionValidity } from "@/services/form-validation"
import {
  FormElementsValidation,
  FormElementsConditionallyShown,
} from "@/types/form"

interface Props {
  element: FormTypes.SectionElement
  model: Record<string, unknown>
  displayValidationMessages: boolean
  formElementsValidation?: FormElementsValidation
  formElementsConditionallyShown?: FormElementsConditionallyShown
  idPrefix: string
}

interface State {
  isDisplayingError: boolean
  expanded: boolean
  wrapperSize: string
}

const props = defineProps<Props>()

const state = reactive<State>({
  isDisplayingError: props.element.isCollapsed,
  expanded: !props.element.isCollapsed,
  wrapperSize: "auto",
})

const displayValidationMessage = computed<boolean>(() => {
  return props.displayValidationMessages || state.isDisplayingError
})

const isInvalid = computed<boolean>(() => {
  return (
    displayValidationMessage.value &&
    checkSectionValidity(props.element, props.formElementsValidation)
  )
})

const isCollapsed = computed<boolean>(() => {
  return !state.expanded
})

const emit = defineEmits<{
  (
    e: "updateSubmission",
    v: {
      newSubmission: Record<string, unknown>
      element: FormTypes.FormElement
    }
  ): void
}>()

const section = ref<HTMLDivElement | null>(null)

function updateSubmission(event: {
  newSubmission: Record<string, unknown>
  element: FormTypes.FormElement
}): void {
  emit("updateSubmission", event)
}

function setWrapperSize() {
  // await Vue.nextTick()
  let wrapperSize = 0
  if (section.value) {
    wrapperSize = section.value.clientHeight
  }
  state.wrapperSize = `${wrapperSize}px`
}

function transitionEnd() {
  if (!isCollapsed.value) {
    state.wrapperSize = "auto"
  }
}

watchEffect(() => {
  if (isCollapsed.value && !state.isDisplayingError) {
    state.isDisplayingError = true
  }

  if (isCollapsed.value) {
    state.wrapperSize = "0px"
  } else {
    setWrapperSize()
  }
})
</script>

<template>
  <div :class="{ 'ob-section': true, 'ob-section__invalid': isInvalid }">
    <ui-collapse v-model="state.expanded">
      <template v-slot:toggle>
        <div>
          <div class="ob-section__header cypress-section-header">
            <h3 class="ob-section__header-text title is-3">
              {{ element.label }}
              <tippy
                v-if="element.label && element.hint"
                arrow
                theme="google"
                size="large"
                placement="bottom"
                :content="element.hint"
              >
                <i class="material-icons has-text-grey-light ob-label__hint">
                  info
                </i>
              </tippy>
            </h3>
            <div class="ob-section__header-icon-container">
              <tippy
                v-if="isInvalid"
                arrow
                theme="google"
                size="large"
                placement="bottom"
                content="Section has errors"
              >
                <i
                  class="material-icons has-text-danger cypress-section-invalid-icon section-invalid-icon fade-in"
                >
                  warning
                </i>
              </tippy>
              <i
                :class="{
                  'ob-section__header-icon': true,
                  'material-icons': true,
                  'is-rotated': !isCollapsed,
                }"
              >
                expand_more
              </i>
            </div>
          </div>
          <hr class="ob-section__divider" />
        </div>
      </template>
    </ui-collapse>
    <div
      :style="{
        height: state.wrapperSize,
        //@ts-expect-error is ok
        '--wrapper-size': state.wrapperSize,
        'min-height': '0px',
        overflow: 'hidden',
      }"
      :class="{
        'ob-section__content': true,
        'ob-section__expanded': !isCollapsed,
        'ob-section__collapsed': isCollapsed,
      }"
      @transitionend="transitionEnd"
    >
      <div ref="section">
        <OneBlinkFormElements
          :model="model"
          :formElementsConditionallyShown="formElementsConditionallyShown"
          :formElementsValidation="formElementsValidation"
          :displayValidationMessages="displayValidationMessage"
          :elements="element.elements"
          :idPrefix="idPrefix"
          @updateSubmission="updateSubmission"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.mdc-collapse :deep(.mdc-collapse__header),
.mdc-collapse :deep(.mdc-collapse__title) {
  width: 100%;
}

.mdc-collapse :deep(.mdc-collapse__content) {
  display: none;
}

.ob-section__content {
  transition: height 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
}
</style>
