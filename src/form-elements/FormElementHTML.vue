<script lang="ts">
import { PropType, defineComponent, computed, inject } from "vue"
import { FormTypes } from "@oneblink/types"
import sanitizeHtml from "../services/sanitize-html"

export default defineComponent({
  // TODO this comes from the repeatable set
  // inject: {
  //   index: { default: 0 },
  // },
  props: {
    element: {
      type: Object as PropType<FormTypes.HtmlElement>,
      required: true,
    },
  },
  setup(props) {
    const html = computed<string>(() => {
      return props.element.defaultValue.replace(
        "{INDEX}",
        ""
        // (this.index + 1).toString()
      )
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
