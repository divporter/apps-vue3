import type { PossibleFileConfiguration } from "../types/files"
export interface FormElementComplianceValue {
  value?: string
  notes?: string
  files?: PossibleFileConfiguration[]
}
