import { ref, onMounted, onUnmounted } from "vue"

export default function useIsOffline() {
  const isOffline = ref(window.navigator && !window.navigator.onLine)

  function update() {
    isOffline.value = window.navigator && !window.navigator.onLine
  }

  onMounted(() => {
    window.addEventListener("online", update)

    window.addEventListener("offline", update)
  })

  onUnmounted(() => {
    window.removeEventListener("online", update)
    window.removeEventListener("offline", update)
  })
  return isOffline
}
