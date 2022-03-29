<script lang="ts">
import { defineComponent } from "vue"

export default defineComponent({
  props: {
    className: String,
    small: Boolean,
    large: Boolean,
    tiny: Boolean,
  },
})
</script>

<template>
  <div :class="className">
    <div
      :class="{
        'ob-loading': true,
        'on-loading': true,
        small: small,
        large: large,
        tiny: tiny,
      }"
    />
  </div>
</template>
