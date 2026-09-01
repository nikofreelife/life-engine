import FamilyControls
import Foundation
import ManagedSettings

enum ScreenTimeStore {
  static let appGroup = "group.com.lifeengine.app"
  static let selectionKey = "le.st.selection"
  static let weeklyKey = "le.st.weeklyMin"
  static let dailyKey = "le.st.dailyMin"
  static let gridKey = "le.st.useGrid"
  static let daysKey = "le.st.daysMin"
  static let bypassKey = "le.st.bypassUntil"
  static let pendingUnlockKey = "le.st.pendingUnlock"
  static let shieldedKey = "le.st.shielded"
  static let weeklyHitKey = "le.st.weeklyHit"
  static let darwinPending = "com.lifeengine.app.screentime.pendingUnlock" as CFString
  static let darwinThreshold = "com.lifeengine.app.screentime.threshold" as CFString

  static var defaults: UserDefaults {
    UserDefaults(suiteName: appGroup) ?? .standard
  }

  static func saveSelection(_ selection: FamilyActivitySelection) {
    if let data = try? PropertyListEncoder().encode(selection) {
      defaults.set(data, forKey: selectionKey)
    }
  }

  static func loadSelection() -> FamilyActivitySelection? {
    guard let data = defaults.data(forKey: selectionKey) else { return nil }
    return try? PropertyListDecoder().decode(FamilyActivitySelection.self, from: data)
  }

  static func savePolicy(weekly: Int, daily: Int, grid: Bool, days: [Int], bypassUntil: Date?) {
    defaults.set(weekly, forKey: weeklyKey)
    defaults.set(daily, forKey: dailyKey)
    defaults.set(grid, forKey: gridKey)
    defaults.set(days, forKey: daysKey)
    if let bypassUntil {
      defaults.set(bypassUntil.timeIntervalSince1970, forKey: bypassKey)
    } else {
      defaults.removeObject(forKey: bypassKey)
    }
  }

  static func isBypassed(now: Date = Date()) -> Bool {
    let until = defaults.double(forKey: bypassKey)
    return until > now.timeIntervalSince1970
  }

  static func todayCapMinutes(now: Date = Date()) -> Int {
    let grid = defaults.bool(forKey: gridKey)
    if grid, let days = defaults.array(forKey: daysKey) as? [Int], days.count == 7 {
      let mondayIndex = (Calendar.current.component(.weekday, from: now) + 5) % 7
      return max(0, days[mondayIndex])
    }
    return max(0, defaults.integer(forKey: dailyKey))
  }

  static func weeklyCapMinutes() -> Int {
    max(0, defaults.integer(forKey: weeklyKey))
  }

  static var weeklyHit: Bool {
    get { defaults.bool(forKey: weeklyHitKey) }
    set { defaults.set(newValue, forKey: weeklyHitKey) }
  }

  static func applyShield() {
    if isBypassed() {
      clearShield()
      return
    }
    guard let selection = loadSelection() else {
      clearShield()
      return
    }
    let store = ManagedSettingsStore()
    store.shield.applications = selection.applicationTokens.isEmpty ? nil : selection.applicationTokens
    store.shield.applicationCategories = selection.categoryTokens.isEmpty
      ? nil
      : .specific(selection.categoryTokens)
    store.shield.webDomains = selection.webDomainTokens.isEmpty ? nil : selection.webDomainTokens
    defaults.set(true, forKey: shieldedKey)
  }

  static func clearShield() {
    let store = ManagedSettingsStore()
    store.shield.applications = nil
    store.shield.applicationCategories = nil
    store.shield.webDomains = nil
    defaults.set(false, forKey: shieldedKey)
  }

  static func markPendingUnlock() {
    defaults.set(true, forKey: pendingUnlockKey)
    CFNotificationCenterPostNotification(
      CFNotificationCenterGetDarwinNotifyCenter(),
      CFNotificationName(darwinPending),
      nil,
      nil,
      true
    )
  }

  static func consumePendingUnlock() -> Bool {
    let pending = defaults.bool(forKey: pendingUnlockKey)
    if pending { defaults.set(false, forKey: pendingUnlockKey) }
    return pending
  }

  static func endOfToday(now: Date = Date()) -> Date {
    Calendar.current.nextDate(
      after: now,
      matching: DateComponents(hour: 0, minute: 0, second: 0),
      matchingPolicy: .nextTime
    ) ?? now.addingTimeInterval(3600)
  }

  static func unlockUntilMidnight() -> Date {
    let until = endOfToday().addingTimeInterval(-1)
    defaults.set(until.timeIntervalSince1970, forKey: bypassKey)
    defaults.set(false, forKey: pendingUnlockKey)
    clearShield()
    return until
  }

  static func expireBypass() {
    defaults.removeObject(forKey: bypassKey)
    applyShield()
  }

  static func applyIntervalStart(activityRaw: String) {
    if activityRaw == "le.bypass" { return }
    if activityRaw == "le.week" { weeklyHit = false }
    if isBypassed() {
      clearShield()
      return
    }
    if todayCapMinutes() == 0 || weeklyCapMinutes() == 0 || weeklyHit {
      applyShield()
      return
    }
    clearShield()
  }

  static func applyThreshold(eventRaw: String, activityRaw: String) {
    if activityRaw == "le.week" || eventRaw == "le.week.cap" {
      weeklyHit = true
    }
    applyShield()
    markPendingUnlock()
    CFNotificationCenterPostNotification(
      CFNotificationCenterGetDarwinNotifyCenter(),
      CFNotificationName(darwinThreshold),
      nil,
      nil,
      true
    )
  }
}
