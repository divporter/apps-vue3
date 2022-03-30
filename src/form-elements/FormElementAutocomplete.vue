<script lang="ts">
import { defineComponent, PropType, ref, computed, watch } from "vue"
import { FormTypes } from "@oneblink/types"
import { formElementsService } from "@oneblink/sdk-core"
import { generateHeaders } from "@oneblink/apps/dist/services/fetch"

import FormElementLabelContainer from "@/components/FormElementLabelContainer.vue"
import FormElementOptions from "@/components/FormElementOptions.vue"
import AutocompleteDropdown from "@/components/AutocompleteDropdown.vue"

export default defineComponent({
  components: {
    FormElementLabelContainer,
    FormElementOptions,
    AutocompleteDropdown,
  },
  emits: ["updateSubmission"],
  props: {
    id: { type: String, required: true },
    element: {
      type: Object as PropType<FormTypes.AutoCompleteElement>,
      required: true,
    },
    value: { required: true },
    displayValidationMessage: Boolean,
    validationMessage: { type: String, required: false },
    conditionallyShownOptions: Array as PropType<
      FormTypes.ChoiceElementOption[]
    >,
  },
  setup(props, { emit }) {
    const label = ref("")

    async function handleSearchFetch(search: string, abortSignal: AbortSignal) {
      if (!props.element.searchUrl) {
        return []
      }
      const headers = await generateHeaders()
      const url = new URL(props.element.searchUrl)
      url.searchParams.append("value", search)
      const response = await fetch(url.href, {
        headers,
        signal: abortSignal,
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text)
      }

      const data = await response.json()
      return formElementsService.parseFormElementOptionsSet(data)
    }

    function setLabel(newLabel: string) {
      label.value = newLabel
    }

    function onFilter(option: FormTypes.ChoiceElementOption) {
      // If the user has typed nothing in, display all options
      if (!label.value) {
        return true
      }
      const lowerCase = label.value.toLowerCase()
      return option.label.toLowerCase().includes(lowerCase)
    }

    function updateSubmission(input: string | undefined) {
      emit("updateSubmission", {
        name: props.element.name,
        value: input || undefined,
      })
    }

    const filteredOptions = computed<FormTypes.ChoiceElementOption[]>(() => {
      if (!props.element.options) {
        return []
      }
      if (!props.conditionallyShownOptions && !onFilter) {
        return props.element.options
      }
      return props.element.options.filter((option) => {
        return (
          (!props.conditionallyShownOptions ||
            props.conditionallyShownOptions.some(
              ({ id }) => id === option.id
            )) &&
          (!onFilter || onFilter(option))
        )
      })
    })

    async function handleSearch() {
      return filteredOptions.value
    }

    watch(
      () => label.value,
      (newValue: string) => {
        if (!newValue && typeof props.value === "string") {
          label.value = props.value
        }
      }
    )

    watch(
      () => props.value,
      (newValue: unknown) => {
        if (props.element.optionsType === "SEARCH") {
          return
        }
        if (!Array.isArray(props.element.options)) {
          return
        }
        const option = props.element.options.find(
          (option) => option.value === newValue
        )
        if (option && label.value !== option.label) {
          setLabel(option.label)
        }
      }
    )

    return {
      label,
      updateSubmission,
      setLabel,
      handleSearchFetch,
      handleSearch,
    }
  },
})
</script>

<template>
  <div
    v-if="element.optionsType === 'SEARCH' && element.searchUrl"
    class="cypress-autocomplete-search-element"
  >
    <FormElementLabelContainer
      className="ob-autocomplete"
      :element="element"
      :id="id"
      :required="element.required"
    >
      <AutocompleteDropdown
        :id="id"
        :label="label"
        :disabled="element.readOnly"
        :placeholder="element.placeholderValue"
        :required="element.required"
        :value="value"
        :validationMessage="validationMessage"
        :displayValidationMessage="displayValidationMessage"
        @changeValue="updateSubmission"
        @changeLabel="setLabel"
        :searchDebounceMs="750"
        :searchMinCharacters="1"
        :onSearch="handleSearchFetch"
      />
    </FormElementLabelContainer>
  </div>

  <div v-else class="cypress-autocomplete-filter-element">
    <FormElementLabelContainer
      className="ob-autocomplete"
      :element="element"
      :id="id"
      :required="element.required"
    >
      <FormElementOptions :options="element.options || []">
        <AutocompleteDropdown
          :id="id"
          :label="label"
          :disabled="element.readOnly"
          :placeholder="element.placeholderValue"
          :required="element.required"
          :value="value"
          :validationMessage="validationMessage"
          :displayValidationMessage="displayValidationMessage"
          @changeValue="updateSubmission"
          @changeLabel="setLabel"
          :searchDebounceMs="0"
          :searchMinCharacters="0"
          :onSearch="handleSearch"
        />
      </FormElementOptions>
    </FormElementLabelContainer>
  </div>
</template>
