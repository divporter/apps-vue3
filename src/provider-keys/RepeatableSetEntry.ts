import type { InjectionKey, ComputedRef } from "vue"

export const indexKey = Symbol("indexKey") as InjectionKey<ComputedRef<number>>
