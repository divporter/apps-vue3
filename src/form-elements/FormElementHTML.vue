<script lang="ts">
import { PropType, defineComponent, computed, inject } from "vue"
import { FormTypes } from "@oneblink/types"
import sanitizeHtml from "../services/sanitize-html"
import { indexKey } from "@/provider-keys/RepeatableSetEntry"

export default defineComponent({
  props: {
    element: {
      type: Object as PropType<FormTypes.HtmlElement>,
      required: true,
    },
  },
  setup(props) {
    const index = inject(indexKey, undefined)

    const html = computed<string>(() => {
      return index?.value !== undefined
        ? props.element.defaultValue.replace(
            "{INDEX}",
            (index.value + 1).toString()
          )
        : props.element.defaultValue
    })

    return {
      html,
      sanitizeHtml,
    }
  },
})
</script>

<template>
  <div class="cypress-html-element">
    <div class="ob-form__element ob-information cypress-html-element">
      <div
        class="cypress-html-element-content ob-information__content ql-editor"
        v-html="sanitizeHtml(html)"
      />
    </div>
  </div>
</template>
