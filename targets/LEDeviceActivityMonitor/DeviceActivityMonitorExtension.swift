import DeviceActivity
import Foundation
import ManagedSettings

@objc(DeviceActivityMonitorExtension)
class DeviceActivityMonitorExtension: DeviceActivityMonitor {
  override func intervalDidStart(for activity: DeviceActivityName) {
    super.intervalDidStart(for: activity)
    ScreenTimeStore.applyIntervalStart(activityRaw: activity.rawValue)
  }

  override func intervalDidEnd(for activity: DeviceActivityName) {
    super.intervalDidEnd(for: activity)
    if activity.rawValue == "le.bypass" {
      ScreenTimeStore.expireBypass()
    }
  }

  override func eventDidReachThreshold(_ event: DeviceActivityEvent.Name, activity: DeviceActivityName) {
    super.eventDidReachThreshold(event, activity: activity)
    ScreenTimeStore.applyThreshold(eventRaw: event.rawValue, activityRaw: activity.rawValue)
  }
}
