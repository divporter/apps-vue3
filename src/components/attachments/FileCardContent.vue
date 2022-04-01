<script lang="ts">
import { defineComponent } from "vue"

export default defineComponent({
  props: {
    imageUrl: String,
  },
})
</script>

<template>
  <div v-if="imageUrl" class="ob-files__content-image">
    <img class="ob-files__image" :src="imageUrl" />
  </div>
  <div v-else class="ob-files__content-file has-text-centered">
    <i class="material-icons icon-large ob-files__attach-icon has-text-grey">
      attach_file
    </i>
  </div>
</template>
