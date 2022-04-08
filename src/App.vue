<script lang="ts">
import "tippy.js/dist/tippy.css" // optional for styling
</script>

<template>
  <div>
    <router-link to="one">One</router-link>
    <router-link to="two">Two</router-link>
    <router-view></router-view>
  </div>
</template>

<style lang="scss">
$primary: #ff0000;
@import "@/styles/oneblink-apps-vue3.scss";

.ob-input-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
