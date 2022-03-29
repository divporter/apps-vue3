import { createApp } from "vue"
import App from "./App.vue"
import UiFormField from "balm-ui/components/form-field"
import UiRadio from "balm-ui/components/radio"
import UiCheckbox from "balm-ui/components/checkbox"
import UiCollapse from "balm-ui/components/collapse"
import vRipple from "balm-ui/directives/ripple"

import OneBlinkFormElements from "@/components/OneBlinkFormElements.vue"
import FormElementSection from "@/form-elements/FormElementSection.vue"

const app = createApp(App)
app.use(UiFormField)
app.use(UiRadio)
app.use(UiCheckbox)
app.use(UiCollapse)
app.directive(vRipple.name, vRipple)
app.component("OneBlinkFormElements", OneBlinkFormElements)
app.component("FormElementSection", FormElementSection)

app.mount("#app")
