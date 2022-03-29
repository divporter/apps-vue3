<script lang="ts">
import { defineComponent, PropType } from "vue"
import { FormTypes } from "@oneblink/types"
import { Tippy } from "vue-tippy"

export default defineComponent({
  components: {
    Tippy,
  },
  emits: ["setPageId"],
  props: {
    page: { type: Object as PropType<FormTypes.PageElement>, required: true },
    currentPage: {
      type: Object as PropType<FormTypes.PageElement>,
      required: true,
    },
    currentPageIndex: { type: Number, required: true },
    index: { type: Number, required: true },
    hasErrors: { type: Boolean, required: true },
  },
  setup(props, { emit }) {
    function onClick() {
      if (props.page.id !== props.currentPage.id) {
        emit("setPageId", props.page.id)
      }
    }
    return { onClick }
  },
})
</script>

<template>
  <div
    :id="'steps-navigation-step-' + page.id"
    :class="{
      'step-item': true,
      'cypress-step-item': true,
      'is-active': currentPage.id === page.id,
      'is-completed': currentPageIndex > index,
      'is-error': hasErrors,
    }"
    @click.stop="onClick"
  >
    <div
      class="step-marker step-marker-error ob-step-marker cypress-step-marker"
      :name="'cypress-page-stepper' + (index + 1)"
      :value="index + 1"
    >
      <tippy
        v-if="hasErrors"
        :arrow="true"
        theme="google"
        placement="bottom"
        content="Page has errors"
      >
        <span class="icon tooltip has-tooltip-top cypress-page-error">
          <i class="material-icons has-text-danger is-size-3"> warning </i>
        </span>
      </tippy>
      <span v-else>{{ index + 1 }}</span>
    </div>
    <div class="step-details ob-step-details">
      <p class="step-title ob-step-title cypress-desktop-step-title">
        {{ page.label }}
      </p>
    </div>
  </div>
</template>
