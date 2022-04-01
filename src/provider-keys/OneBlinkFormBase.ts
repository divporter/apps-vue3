import type { InjectionKey, ComputedRef } from "vue"
import type { FormTypes } from "@oneblink/types"
import type { FormSubmissionModel } from "../types/form"

export const definitionKey = Symbol("definitionKey") as InjectionKey<
  ComputedRef<FormTypes.Form>
>
export const isReadOnlyKey = Symbol("isReadOnlyKey") as InjectionKey<boolean>
export const primaryColorKey = Symbol(
  "executedLookupKey"
) as InjectionKey<string>
export const executedLookupKey = Symbol("definitionKey") as InjectionKey<
  (id: string) => void
>
export const executeLookupFailedKey = Symbol(
  "executeLookupFailedKey"
) as InjectionKey<(id: string) => void>
export const googleMapsApiKeyKey = Symbol(
  "googleMapsApiKeyKey"
) as InjectionKey<string>
export const captchaSiteKeyKey = Symbol(
  "captchaSiteKeyKey"
) as InjectionKey<string>
export const handlePagesLookupResultKey = Symbol(
  "handlePagesLookupResultKey"
) as InjectionKey<
  (
    element: FormTypes.LookupFormElement,
    elementLookupData: FormTypes.PageElement[],
    dataLookupResult?: FormSubmissionModel
  ) => void
>
export const abnLookupAuthenticationGuidKey = Symbol(
  "abnLookupAuthenticationGuidKey"
) as InjectionKey<string>
