import { EventBus } from 'quasar'
import { boot } from 'quasar/wrappers'
let $bus = null
export default boot(({ app }) => {
  $bus = new EventBus()

  // for Options API
  app.config.globalProperties.$bus = $bus

  // for Composition API
  app.provide('bus', $bus)
})

export { $bus }