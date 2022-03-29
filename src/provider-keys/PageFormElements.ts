import type { InjectionKey } from "vue"
import type { MergeLookupResults } from "../types/lookups"

type LookupCallback = ({
  submission,
  elements,
}: MergeLookupResults) => MergeLookupResults

export const handleLookupKey = Symbol("handleLookupKey") as InjectionKey<
  (callback: LookupCallback) => void
>
export const isActiveKey = Symbol("isActiveKey") as InjectionKey<boolean>
