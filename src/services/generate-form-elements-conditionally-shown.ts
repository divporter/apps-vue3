import { Sentry } from "@oneblink/apps"
import { FormTypes } from "@oneblink/types"

import conditionallyShowElement, {
  FormElementsCtrl,
} from "./conditionally-show-element"
import conditionallyShowOption from "./conditionally-show-option"
import flattenFormElements from "./flattenFormElements"
import {
  FormElementConditionallyShown,
  FormElementsConditionallyShown,
  FormSubmissionModel,
  RepeatableSetEntryIndex,
} from "../types/form"

const handleConditionallyShowElement = (
  formElementsCtrl: FormElementsCtrl,
  element: FormTypes.FormElement
): {
  conditionallyShowElement: boolean
  error?: Error
} => {
  try {
    return {
      conditionallyShowElement: conditionallyShowElement(
        formElementsCtrl,
        element,
        []
      ),
    }
  } catch (error) {
    console.warn("Error while checking if element is conditional shown", error)
    Sentry.captureException(error)
    return { conditionallyShowElement: false, error: error as Error }
  }
}

const handleConditionallyShowOption = (
  formElementsCtrl: FormElementsCtrl,
  element: FormTypes.FormElementWithOptions,
  option: FormTypes.ChoiceElementOption
) => {
  try {
    return {
      conditionallyShowOption: conditionallyShowOption(
        formElementsCtrl,
        element,
        option,
        []
      ),
    }
  } catch (error) {
    Sentry.captureException(error)
    return { conditionallyShowOption: false, error: error as Error }
  }
}

export default function generateFormElementsConditionallyShown(
  elements: FormTypes.FormElement[],
  model: FormSubmissionModel,
  parentFormElementsCtrl: FormElementsCtrl["parentFormElementsCtrl"]
): {
  formElementsConditionallyShown: FormElementsConditionallyShown
  conditionalLogicError?: Error
} {
  const formElementsCtrl = {
    flattenedElements: flattenFormElements(elements),
    model,
    parentFormElementsCtrl,
  }
  //TODO this only shows the last error (if any)
  let conditionalLogicError: Error | undefined
  const formElementsConditionallyShownResult =
    formElementsCtrl.flattenedElements.reduce<FormElementsConditionallyShown>(
      (formElementsConditionallyShown, element) => {
        switch (element.type) {
          case "section":
          case "page": {
            const formElementConditionallyShown =
              formElementsConditionallyShown[element.id]
            let isHidden = false
            if (formElementConditionallyShown) {
              isHidden = formElementConditionallyShown.isHidden
            } else {
              const { conditionallyShowElement, error } =
                handleConditionallyShowElement(formElementsCtrl, element)
              if (error) {
                conditionalLogicError = error
              }
              isHidden = !conditionallyShowElement
            }
            formElementsConditionallyShown[element.id] = {
              type: "formElement",
              isHidden,
            }

            // If the parent element is hidden, hide all the child elements
            if (isHidden) {
              element.elements.forEach((childElement) => {
                switch (childElement.type) {
                  case "section":
                  case "page": {
                    formElementsConditionallyShown[childElement.id] = {
                      type: "formElement",
                      isHidden: true,
                    }
                    break
                  }
                  default: {
                    formElementsConditionallyShown[childElement.name] = {
                      type: "formElement",
                      isHidden: true,
                    }
                  }
                }
              })
            }
            break
          }
          case "infoPage":
          case "form": {
            if (formElementsConditionallyShown[element.name]) {
              break
            }
            const nestedModel = model[element.name] as
              | FormSubmissionModel
              | undefined
            const { conditionallyShowElement, error } =
              handleConditionallyShowElement(formElementsCtrl, element)
            if (error) {
              conditionalLogicError = error
            }
            const {
              formElementsConditionallyShown: formElements,
              conditionalLogicError: nestedError,
            } = generateFormElementsConditionallyShown(
              element.elements || [],
              nestedModel || {},
              formElementsCtrl
            )
            if (error) {
              conditionalLogicError = nestedError
            }
            formElementsConditionallyShown[element.name] = {
              type: "formElements",
              isHidden: !conditionallyShowElement,
              formElements: formElements,
            }
            break
          }
          case "repeatableSet": {
            if (formElementsConditionallyShown[element.name]) {
              break
            }
            const entries = formElementsCtrl.model[element.name] as
              | Array<FormSubmissionModel>
              | undefined
            const { conditionallyShowElement, error } =
              handleConditionallyShowElement(formElementsCtrl, element)
            if (error) {
              conditionalLogicError = error
            }
            formElementsConditionallyShown[element.name] = {
              type: "repeatableSet",
              isHidden: !conditionallyShowElement,
              entries: (entries || []).reduce(
                (
                  result: Record<
                    RepeatableSetEntryIndex,
                    FormElementsConditionallyShown | undefined
                  >,
                  entry,
                  index
                ) => {
                  const {
                    formElementsConditionallyShown: formElements,
                    conditionalLogicError: nestedError,
                  } = generateFormElementsConditionallyShown(
                    element.elements,
                    entry,
                    formElementsCtrl
                  )
                  if (nestedError) {
                    conditionalLogicError = nestedError
                  }
                  result[index.toString()] = formElements
                  return result
                },
                {}
              ),
            }
            break
          }
          default: {
            if (formElementsConditionallyShown[element.name]) {
              break
            }
            const { conditionallyShowElement, error } =
              handleConditionallyShowElement(formElementsCtrl, element)
            if (error) {
              conditionalLogicError = error
            }
            const formElementConditionallyShown: FormElementConditionallyShown =
              {
                type: "formElement",
                isHidden: !conditionallyShowElement,
              }

            if (!formElementConditionallyShown.isHidden) {
              switch (element.type) {
                case "compliance":
                case "autocomplete":
                case "radio":
                case "checkboxes":
                case "select": {
                  if (
                    element.conditionallyShowOptions &&
                    Array.isArray(element.options)
                  ) {
                    formElementConditionallyShown.options =
                      element.options.filter((option) => {
                        const { conditionallyShowOption, error } =
                          handleConditionallyShowOption(
                            formElementsCtrl,
                            element,
                            option
                          )
                        if (error) {
                          conditionalLogicError = error
                        }
                        return conditionallyShowOption
                      })
                  }
                  break
                }
              }
            }

            formElementsConditionallyShown[element.name] =
              formElementConditionallyShown
          }
        }

        return formElementsConditionallyShown
      },
      {}
    )
  return {
    formElementsConditionallyShown: formElementsConditionallyShownResult,
    conditionalLogicError,
  }
}
