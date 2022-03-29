import { ref } from "vue"

export default function useIsDirty() {
  const isDirty = ref(false)

  function setIsDirty() {
    isDirty.value = true
  }

  return { isDirty, setIsDirty }
}
