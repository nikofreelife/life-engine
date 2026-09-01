import DeviceActivity
import ExpoModulesCore
import FamilyControls
import Foundation
import ManagedSettings
import SwiftUI
import UIKit

public class ScreenTimeModule: Module {
  public func definition() -> ModuleDefinition {
    Name("LifeEngineScreenTime")

    Events("onPendingUnlock", "onThresholdReached")

    OnCreate {
      ScreenTimeBridge.shared.module = self
      ScreenTimeBridge.shared.startObservers()
    }

    OnDestroy {
      ScreenTimeBridge.shared.stopObservers()
      ScreenTimeBridge.shared.module = nil
    }

    Function("isNativeAvailable") { () -> Bool in
      true
    }

    AsyncFunction("authorizationStatus") { () -> String in
      Self.statusString(AuthorizationCenter.shared.authorizationStatus)
    }

    AsyncFunction("requestAuthorization") { () -> String in
      do {
        try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
        return Self.statusString(AuthorizationCenter.shared.authorizationStatus)
      } catch {
        throw Exception(name: "ScreenTimeAuth", description: error.localizedDescription)
      }
    }

    AsyncFunction("presentPicker") { (initial: String?) -> [String: Any] in
      let seed = Self.decodeSelection(initial) ?? ScreenTimeStore.loadSelection() ?? FamilyActivitySelection()
      let selection = try await PickerPresenter.present(seed: seed)
      ScreenTimeStore.saveSelection(selection)
      return Self.pack(selection)
    }

    AsyncFunction("applyPolicy") { (policy: [String: Any]) in
      try ScreenTimeBridge.shared.applyPolicy(policy)
    }

    AsyncFunction("clearPolicy") {
      ScreenTimeBridge.shared.stopAll()
      ScreenTimeStore.clearShield()
      ScreenTimeStore.weeklyHit = false
      ScreenTimeStore.defaults.removeObject(forKey: ScreenTimeStore.selectionKey)
      ScreenTimeStore.defaults.removeObject(forKey: ScreenTimeStore.bypassKey)
    }

    AsyncFunction("unlockUntilMidnight") { () -> String in
      let until = ScreenTimeStore.unlockUntilMidnight()
      try ScreenTimeBridge.shared.scheduleBypassRelock(until: until)
      return Self.iso(until)
    }

    AsyncFunction("consumePendingUnlock") { () -> Bool in
      ScreenTimeStore.consumePendingUnlock()
    }

    AsyncFunction("isShielded") { () -> Bool in
      ScreenTimeStore.defaults.bool(forKey: ScreenTimeStore.shieldedKey) && !ScreenTimeStore.isBypassed()
    }

    View(LEUsageReportView.self) {
      Prop("selectionData") { (view: LEUsageReportView, value: String) in
        view.selectionData = value
      }
    }
  }

  static func statusString(_ status: AuthorizationStatus) -> String {
    switch status {
    case .approved: return "approved"
    case .denied: return "denied"
    case .notDetermined: return "notDetermined"
    @unknown default: return "notDetermined"
    }
  }

  static func decodeSelection(_ initial: String?) -> FamilyActivitySelection? {
    guard let initial, let data = Data(base64Encoded: initial) else { return nil }
    return try? PropertyListDecoder().decode(FamilyActivitySelection.self, from: data)
  }

  static func pack(_ selection: FamilyActivitySelection) -> [String: Any] {
    let data = (try? PropertyListEncoder().encode(selection))?.base64EncodedString() ?? ""
    return [
      "selectionData": data,
      "applicationCount": selection.applicationTokens.count,
      "categoryCount": selection.categoryTokens.count,
      "webCount": selection.webDomainTokens.count,
    ]
  }

  static func iso(_ date: Date) -> String {
    let formatter = ISO8601DateFormatter()
    formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    return formatter.string(from: date)
  }
}
