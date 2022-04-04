# oneblink-apps-vue [![npm module](https://img.shields.io/npm/v/oneblink-apps-vue3.svg)](https://www.npmjs.com/package/oneblink-apps-vue3)

A faithful re-write of [@oneblink/apps-react](https://www.npmjs.com/package/@oneblink/apps-react) v0.5.5 form components for Vue 3 applications

## Installation

```
npm install oneblink-apps-vue3
```

## Usage

```js
import Vue from "vue"
import OneBlinkFormComponents from "oneblink-apps-vue"
Vue.use(OneBlinkFormComponents)
```

For component definitions and examples see [Components](#Components)

## Styling

In `App.vue` you will need to add the following

```js
import "oneblink-apps-vue/dist/oneblink-apps-vue.css"
```

You can customise the primary colour easily with scss

### SCSS

If you don't have one create a scss file eg `src/styles/custom.scss`

```scss
@use "oneblink-apps-vue/dist/oneblink-apps-vue.scss" with (
  $primary: #ff0000 /* your desired colour here */
);
```

then in `main.js`

```js
import ../styles/custom.scss
```

Note: you will still need to do the above (create a scss file) to import the styles even if you don't change the primary colour eg

```scss
@import "oneblink-apps-vue/dist/oneblink-apps-vue.scss";
```

## Components

- [OneBlinkForm](#OneBlinkForm)
  <!-- - [OneBlinkAutoSaveForm](#OneBlinkAutoSaveForm) -->
  <!-- - [OneBlinkFormControlled](#OneBlinkFormControlled) -->

### `<OneBlinkForm />`

Component for rendering a OneBlink Form. This component will render the submit, cancel and save draft buttons but it is up to the developer to implement what happens when those buttons are clicked.

It is also recommended to import the `css` from this library as well.

```js
import { OneBlinkForm } from "@oneblink/apps-react"
import "@oneblink/apps-react/dist/styles.css"
```

<a id="oneblink-form-props"></a>

#### Props

| Property                      | Type                                            | Required    | Description                                                                                                                                                |
| ----------------------------- | ----------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| `definition`                  | `Form`                                          | Yes         | The OneBlink Form to render                                                                                                                                |
| `initialSubmission`           | `Object`                                        | No          | The initial submission data                                                                                                                                |
| `googleMapsApiKey`            | `string`                                        | Conditional | A [Google Maps API Key](https://developers.google.com/maps/documentation/javascript/get-api-key). Required if the form contains a `location` form element. |
| `abnLookupAuthenticationGuid` | `string`                                        | Conditional | An [ABN Lookup Authentication Guid](https://abr.business.gov.au/Tools/WebServices). Required if the form contains a `abn` form element.                    |     |
| `captchaSiteKey`              | `string`                                        | Conditional | A [reCAPTCHA Site Key](https://developers.google.com/recaptcha/intro). Required if the form contains a `captcha` form element.                             |
| `disabled`                    | `boolean`                                       | No          | Whether the form is currently able to be submitted. False by default.                                                                                      |
| `buttons`                     | [`ButtonsConfiguration`](#buttonsconfiguration) | No          | Change properties for certain buttons on the form.                                                                                                         |
| `primaryColour`               | `string`                                        | No          | Hex colour value for certain inputs (defaults to `#4c8da7`) .                                                                                              |

<a id="oneblink-form-events"></a>

#### Events

| Event       | Type                             | Description                                                                                                                                                                                                  |
| ----------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `submit`    | `(FormSubmissionResult) => void` | Emitted when the user submits the form with valid submission data. See [NewFormSubmission](#newformsubmission) for the structure of the argument.                                                            |
| `cancel`    | `() => void`                     | Emitted when the user cancels the form                                                                                                                                                                       |
| `saveDraft` | `(FormSubmission) => void`       | Emitted when the user wishes to save their submission data as a draft submission. If not specified, drafts cannot be saved. See [NewDraftSubmission](#newdraftsubmission) for the structure of the argument. |

#### ButtonsConfiguration

| Property          | Type                                          | Required | Description                                                |
| ----------------- | --------------------------------------------- | -------- | ---------------------------------------------------------- |
| `submit`          | [`ButtonConfiguration`](#buttonconfiguration) | No       | Change properties for the Submit button                    |
| `cancel`          | [`ButtonConfiguration`](#buttonconfiguration) | No       | Change properties for the Cancel button                    |
| `saveDraft`       | [`ButtonConfiguration`](#buttonconfiguration) | No       | Change properties for the Save Draft button                |
| `cancelPromptYes` | [`ButtonConfiguration`](#buttonconfiguration) | No       | Change properties for the Unsaved Changes - Discard button |
| `cancelPromptNo`  | [`ButtonConfiguration`](#buttonconfiguration) | No       | Change properties for the Unsaved Changes - Back button    |

#### ButtonConfiguration

| Property | Type     | Required | Description                                                                                                                                                                   |
| -------- | -------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `label`  | `string` | No       | Change the text that appears in the button                                                                                                                                    |
| `icon`   | `string` | No       | Add a [Material Icon](https://fonts.google.com/icons?selected=Material+Icons:home) to the button, the string must be the part that goes `<i class="material-icons">HERE</i>`) |

#### FormSubmission

| Property     | Type           | Description                                                                                                                       |
| ------------ | -------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `submission` | `Object`       | The submission data                                                                                                               |
| `definition` | `OneBlinkForm` | The OneBlink Form, this will be different from the `form` prop passed to the Component as it is cloned when the component mounts. |

#### FormSubmissionResult

Inherits properties from [`FormSubmission`](#formsubmission)

| Property        | Type       | Description                                         |
| --------------- | ---------- | --------------------------------------------------- |
| `captchaTokens` | `string[]` | Captcha tokens gathered by a `captcha` Form Element |

#### Example

```html
<script>
  //Form.vue
  import Vue from "vue"
  import { FormTypes } from '@oneblink/types'
  import {
    OneBlinkAppsError,
    draftService,
    submissionService,
  } from '@oneblink/apps'

  export default Vue.extend({
    data(){
      return {
        captchaSiteKey:'ENTER_YOUR_SITE_KEY_HERE',
        googleMapsApiKey: 'ENTER_YOUR_MAPS_API_KEY_HERE',
        formsAppId: 1,
        definition: {
          id: 1,
          name: 'Name of Form',
          description: '',
          organisationId: 'abc123',
          formsAppEnvironmentId: 1,
          formsAppIds: [],
          elements: [],
          isAuthenticated: false,
          isMultiPage: false,
          isInfoPage: false,
          publishStartDate: null,
          publishEndDate: null,
          postSubmissionAction: 'FORMS_LIBRARY',
          submissionEvents: [],
          tags: [],
        },
        isSavingDraft: false,
        saveDraftError: null,
        formSubmissionResult: null,
        isSubmitting: false,
        submitError: null,
      }
    },
    methods: {
      async handleSubmit(newFormSubmission){
        const formSubmission = Object.assign(
          {},
          newFormSubmission,
          {
            formsAppId,
            jobId: null,
            externalId: null,
            draftId: null,
            preFillFormDataId: null,
          },
        )

        this.formSubmissionResult = null
        this.submitError = null
        this.isSubmitting: true

        try {
          const newFormSubmissionResult = await submissionService.submit({
            formSubmission,
          })
          if (
            newFormSubmissionResult.isOffline &&
            !newFormSubmissionResult.isInPendingQueue
          ) {
            throw new OneBlinkAppsError(
              'You cannot submit this form while offline, please try again when connectivity is restored.',
              {
                isOffline: true,
              },
            )
          }

          this.formSubmissionResult = newFormSubmissionResult
          this.isSubmitting = false
          this.submitError = null

        } catch (error) {
          this.formSubmissionResult = null
          this.isSubmitting = false
          this.submitError = error
        }
      },
      async handleSaveDraft(newDraftSubmission){
        const draftSubmission = {
          ...newDraftSubmission,
          formsAppId,
        }

        this.saveDraftError: null
        this.isSavingDraft: true

        try {
          await draftService.addDraft(
            {
              title: this.form.name,
              formId: this.form.id,
              externalId: null,
              jobId: null,
            },
            draftSubmission,
          )

          this.saveDraftError = null
          this.isSavingDraft = false

        } catch (error) {
          this.saveDraftError = error
          this.isSavingDraft = false
        }
      }
    },
    handleCancel(){
      // handle cancel here...
    }
  })
</script>

<template>
  <div>
    <template v-if="isSubmitting">
      <!-- Render submitting animation/loading -->
    </template>
    <template v-else-if="submitError">
      <!-- Render error while submitting -->
    </template>
    <template v-else-if="isSavingDraft">
      <!-- Render saving draft animation/loading -->
    </template>
    <template v-else-if="saveDraftError">
      <!-- Render error while saving draft -->
    </template>
    <template v-else-if="formSubmissionResult">
      <!-- Render submission success -->
    </template>
    <OneBlinkForm
      v-else
      :captchaSiteKey="captchaSiteKey"
      :googleMapsApiKey="googleMapsApiKey"
      :formsAppId="formsAppId"
      :definition="definition"
      @cancel="handleCancel"
      @submit="handleSubmit"
      @saveDraft="handleSaveDraft"
    />
  </div>
</template>
```

## Known Issues

- [Recaptcha element causing browser to crash](https://github.com/google/recaptcha/issues/269)
- [Installing with npm > 6 causes fatal error](https://github.com/npm/cli/issues/3208)

## TODO

- [ ] `<OneBlinkAutoSaveForm />`
- [ ] `<OneBlinkFormControlled />
- [ ] `<OneBlinkReadOnlyForm />`
- [ ] Auto save with controlled form docs
- [ ] Date Element
- [ ] DateTime Element
- [ ] Time Element
- [ ] Form Element
- [ ] Calculation Element
- [ ] Camera Element
- [ ] Signature Element
- [ ] Location Element
- [ ] Captcha Element
- [ ] Summary Element
- [ ] Checklist Element
- [ ] Barcode Scanner Element
- [ ] Geoscape Address Element
- [ ] Point Address Element
- [ ] Civica Name Record Element
- [ ] Civica Street Name Element
- [ ] BSB Element
- [ ] ABN Element
