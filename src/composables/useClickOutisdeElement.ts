import { Ref, onMounted, onUnmounted } from "vue"

export default function useClickOutsideElement(
  ref: Ref<HTMLElement | null>,
  callback: () => void
) {
  //@ts-expect-error allow any
  const handleClickOutside = (event) => {
    if (ref.value && !ref.value.contains(event.target)) {
      callback()
    }
  }

  onMounted(() => document.addEventListener("mousedown", handleClickOutside))
  onUnmounted(() =>
    document.removeEventListener("mousedown", handleClickOutside)
  )
}
