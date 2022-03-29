import { FormTypes } from "@oneblink/types"
import { FormSubmissionModel } from "./form"

export type MergeLookupResults = {
  submission: FormSubmissionModel
  elements: FormTypes.FormElement[]
}

export type LookupCallback = ({
  submission,
  elements,
}: MergeLookupResults) => MergeLookupResults
