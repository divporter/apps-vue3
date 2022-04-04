import type { App } from "vue"
import OneBlinkForm from "./OneBlinkFormUncontrolled.vue"
// import OneBlinkAutoSaveForm from "./OneBlinkAutoSaveForm.vue"
// import OneBlinkFormControlled from "./OneBlinkFormControlled.vue"
// import OneBlinkReadOnlyForm from "./OneBlinkReadOnlyForm"

import UiFormField from "balm-ui/components/form-field"
import UiRadio from "balm-ui/components/radio"
import UiCheckbox from "balm-ui/components/checkbox"
import UiSwitch from "balm-ui/components/switch"
import UiCollapse from "balm-ui/components/collapse"
import vRipple from "balm-ui/directives/ripple"

import "tippy.js/dist/tippy.css" // optional for styling
import "./styles/oneblink-apps-vue3.scss"

export default {
  install(app: App) {
    //balm ui components
    app.use(UiFormField)
    app.use(UiRadio)
    app.use(UiCheckbox)
    app.use(UiSwitch)
    app.use(UiCollapse)
    app.directive(vRipple.name, vRipple)

    app.component("OneBlinkForm", OneBlinkForm)
    // Vue.component("OneBlinkAutoSaveForm", OneBlinkAutoSaveForm)
    // Vue.component("OneBlinkFormControlled", OneBlinkFormControlled)
    // Vue.component("OneBlinkReadOnlyForm", OneBlinkReadOnlyForm)
  },
}
