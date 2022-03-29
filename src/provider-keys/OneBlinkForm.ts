import type { InjectionKey } from "vue"

export const submissionKey = Symbol("submissionKey") as InjectionKey<
  Record<string, unknown>
>
