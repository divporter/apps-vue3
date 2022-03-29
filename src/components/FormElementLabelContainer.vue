<script lang="ts">
import { defineComponent, PropType } from "vue"
import { FormTypes } from "@oneblink/types"
import { Tippy } from "vue-tippy"

export default defineComponent({
  components: {
    Tippy,
  },
  props: {
    className: String,
    element: {
      type: Object as PropType<FormTypes.FormElementBase>,
      required: true,
    },
    id: { type: String, required: true },
    required: Boolean,
  },
})
</script>

<template>
  <div :class="['ob-form__element', className]">
    <div class="label ob-label__container">
      <slot name="leading"></slot>
      <label
        :class="{
          'ob-label': true,
          'ob-label__required': required,
          'is-required': required,
        }"
        :for="id"
      >
        {{ element.label }}
      </label>
      <tippy
        v-if="element.hint"
        arrow
        theme="google"
        placement="bottom"
        :content="element.hint"
      >
        <i class="material-icons has-text-grey-light ob-label__hint"> info </i>
      </tippy>
    </div>
    <slot></slot>
  </div>
</template>
