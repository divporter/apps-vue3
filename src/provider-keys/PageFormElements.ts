import type { InjectionKey, ComputedRef } from "vue"

export const isActiveKey = Symbol("isActiveKey") as InjectionKey<
  ComputedRef<boolean>
>
