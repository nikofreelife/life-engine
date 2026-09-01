package expo.modules.lifeenginescreentime

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class LifeEngineScreenTimeModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("LifeEngineScreenTime")
    Function("isNativeAvailable") { false }
    AsyncFunction("authorizationStatus") { "unavailable" }
    AsyncFunction("requestAuthorization") { "unavailable" }
    AsyncFunction("presentPicker") { _: String? ->
      mapOf(
        "selectionData" to "",
        "applicationCount" to 0,
        "categoryCount" to 0,
        "webCount" to 0,
      )
    }
    AsyncFunction("applyPolicy") { _: Map<String, Any?> -> }
    AsyncFunction("clearPolicy") { }
    AsyncFunction("unlockUntilMidnight") { "" }
    AsyncFunction("consumePendingUnlock") { false }
    AsyncFunction("isShielded") { false }
  }
}
