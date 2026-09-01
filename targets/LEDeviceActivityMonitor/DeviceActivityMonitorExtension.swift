import DeviceActivity
import Foundation
import ManagedSettings

@objc(DeviceActivityMonitorExtension)
class DeviceActivityMonitorExtension: DeviceActivityMonitor {
  override func intervalDidStart(for activity: DeviceActivityName) {
    super.intervalDidStart(for: activity)
    if activity.rawValue == "le.bypass" { return }
    if ScreenTimeStore.isBypassed() {
      ScreenTimeStore.clearShield()
      return
    }
    if ScreenTimeStore.todayCapMinutes() == 0 || ScreenTimeStore.weeklyCapMinutes() == 0 {
      ScreenTimeStore.applyShield()
    }
  }

  override func intervalDidEnd(for activity: DeviceActivityName) {
    super.intervalDidEnd(for: activity)
    if activity.rawValue == "le.bypass" {
      ScreenTimeStore.defaults.removeObject(forKey: ScreenTimeStore.bypassKey)
    }
  }

  override func eventDidReachThreshold(_ event: DeviceActivityEvent.Name, activity: DeviceActivityName) {
    super.eventDidReachThreshold(event, activity: activity)
    CFNotificationCenterPostNotification(
      CFNotificationCenterGetDarwinNotifyCenter(),
      CFNotificationName(ScreenTimeStore.darwinThreshold),
      nil,
      nil,
      true
    )
    ScreenTimeStore.applyShield()
    ScreenTimeStore.markPendingUnlock()
  }
}
