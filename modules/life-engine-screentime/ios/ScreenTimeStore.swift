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
  static let weeklyHitWeekKey = "le.st.weeklyHitWeek"
  static let dailyHitDayKey = "le.st.dailyHitDay"
  static let weekIntervalIdKey = "le.st.weekIntervalId"
  static let dayIntervalIdKey = "le.st.dayIntervalId"
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

  /// Local calendar day `YYYY-MM-DD`. Keep in sync with `dayId` usage in src/screentime-interval.ts.
  static func dayId(_ now: Date = Date()) -> String {
    let comps = Calendar.current.dateComponents([.year, .month, .day], from: now)
    return String(format: "%04d-%02d-%02d", comps.year ?? 0, comps.month ?? 0, comps.day ?? 0)
  }

  /// Monday of the DeviceActivity week (Mon 00:00 … Sun 23:59).
  static func weekId(_ now: Date = Date()) -> String {
    let calendar = Calendar.current
    let weekday = calendar.component(.weekday, from: now)
    let daysFromMonday = (weekday + 5) % 7
    let monday = calendar.date(byAdding: .day, value: -daysFromMonday, to: calendar.startOfDay(for: now)) ?? now
    return dayId(monday)
  }

  static func expireStaleLatches(now: Date = Date()) {
    guard weeklyHit else { return }
    let week = weekId(now)
    if let stored = defaults.string(forKey: weeklyHitWeekKey) {
      if stored != week { weeklyHit = false }
    } else {
      defaults.set(week, forKey: weeklyHitWeekKey)
    }
  }

  static func clearPeriodLatches() {
    weeklyHit = false
    defaults.removeObject(forKey: weeklyHitWeekKey)
    defaults.removeObject(forKey: dailyHitDayKey)
    defaults.removeObject(forKey: weekIntervalIdKey)
    defaults.removeObject(forKey: dayIntervalIdKey)
  }

  /// Returns true on a real week boundary. First bind and same-week re-registration are false.
  static func markWeekInterval(now: Date = Date()) -> Bool {
    let week = weekId(now)
    let prev = defaults.string(forKey: weekIntervalIdKey)
    defaults.set(week, forKey: weekIntervalIdKey)
    if prev == nil { return false }
    if prev == week { return false }
    weeklyHit = false
    return true
  }

  /// Returns true on a real local-midnight boundary. First bind and same-day re-registration are false.
  static func markDayInterval(now: Date = Date()) -> Bool {
    let day = dayId(now)
    let prev = defaults.string(forKey: dayIntervalIdKey)
    defaults.set(day, forKey: dayIntervalIdKey)
    if prev == nil { return false }
    return prev != day
  }

  static func applyCurrentShield(now: Date = Date(), allowClear: Bool) {
    expireStaleLatches(now: now)
    if isBypassed(now: now) {
      clearShield()
      return
    }
    let dailyHit = defaults.string(forKey: dailyHitDayKey) == dayId(now)
    if todayCapMinutes(now: now) == 0 || weeklyCapMinutes() == 0 || weeklyHit || dailyHit {
      applyShield()
      return
    }
    if !allowClear && defaults.bool(forKey: shieldedKey) {
      applyShield()
      return
    }
    clearShield()
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

  static func applyIntervalStart(activityRaw: String, now: Date = Date()) {
    if activityRaw == "le.bypass" { return }
    expireStaleLatches(now: now)
    var allowClear = false
    if activityRaw == "le.week" {
      allowClear = markWeekInterval(now: now)
    } else if activityRaw.hasPrefix("le.day.") {
      allowClear = markDayInterval(now: now)
    }
    applyCurrentShield(now: now, allowClear: allowClear)
  }

  static func applyThreshold(eventRaw: String, activityRaw: String, now: Date = Date()) {
    expireStaleLatches(now: now)
    if activityRaw == "le.week" || eventRaw == "le.week.cap" {
      weeklyHit = true
      defaults.set(weekId(now), forKey: weeklyHitWeekKey)
    } else {
      defaults.set(dayId(now), forKey: dailyHitDayKey)
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
