import Combine
import DeviceActivity
import ExpoModulesCore
import FamilyControls
import Foundation
import ManagedSettings
import SwiftUI
import UIKit

public class LifeEngineScreenTimeModule: Module {
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
      let seed: FamilyActivitySelection = {
        if let initial, let data = Data(base64Encoded: initial),
           let decoded = try? PropertyListDecoder().decode(FamilyActivitySelection.self, from: data) {
          return decoded
        }
        return ScreenTimeStore.loadSelection() ?? FamilyActivitySelection()
      }()
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
      ScreenTimeStore.defaults.removeObject(forKey: ScreenTimeStore.selectionKey)
    }

    AsyncFunction("unlockUntilMidnight") { () -> String in
      let until = ScreenTimeStore.unlockUntilMidnight()
      try? ScreenTimeBridge.shared.scheduleBypassRelock(until: until)
      let formatter = ISO8601DateFormatter()
      formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
      return formatter.string(from: until)
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

  static func pack(_ selection: FamilyActivitySelection) -> [String: Any] {
    let data = (try? PropertyListEncoder().encode(selection))?.base64EncodedString() ?? ""
    return [
      "selectionData": data,
      "applicationCount": selection.applicationTokens.count,
      "categoryCount": selection.categoryTokens.count,
      "webCount": selection.webDomainTokens.count,
    ]
  }
}

final class ScreenTimeBridge {
  static let shared = ScreenTimeBridge()
  weak var module: LifeEngineScreenTimeModule?
  private var pendingObserver: UnsafeMutableRawPointer?

  func startObservers() {
    let center = CFNotificationCenterGetDarwinNotifyCenter()
    let observer = Unmanaged.passUnretained(self).toOpaque()
    pendingObserver = observer
    CFNotificationCenterAddObserver(
      center,
      observer,
      { _, observer, name, _, _ in
        guard let observer else { return }
        let bridge = Unmanaged<ScreenTimeBridge>.fromOpaque(observer).takeUnretainedValue()
        DispatchQueue.main.async {
          if name?.rawValue == ScreenTimeStore.darwinPending {
            bridge.module?.sendEvent("onPendingUnlock", [:])
          } else {
            bridge.module?.sendEvent("onThresholdReached", [:])
          }
        }
      },
      ScreenTimeStore.darwinPending,
      nil,
      .deliverImmediately
    )
    CFNotificationCenterAddObserver(
      center,
      observer,
      { _, observer, _, _, _ in
        guard let observer else { return }
        let bridge = Unmanaged<ScreenTimeBridge>.fromOpaque(observer).takeUnretainedValue()
        DispatchQueue.main.async {
          bridge.module?.sendEvent("onThresholdReached", [:])
        }
      },
      ScreenTimeStore.darwinThreshold,
      nil,
      .deliverImmediately
    )
  }

  func stopObservers() {
    if let pendingObserver {
      CFNotificationCenterRemoveEveryObserver(CFNotificationCenterGetDarwinNotifyCenter(), pendingObserver)
    }
  }

  func stopAll() {
    DeviceActivityCenter().stopMonitoring()
  }

  func applyPolicy(_ policy: [String: Any]) throws {
    if let raw = policy["selectionData"] as? String, let data = Data(base64Encoded: raw),
       let selection = try? PropertyListDecoder().decode(FamilyActivitySelection.self, from: data) {
      ScreenTimeStore.saveSelection(selection)
    }
    let weekly = Int(policy["weeklyLimitMin"] as? Double ?? Double(policy["weeklyLimitMin"] as? Int ?? 120))
    let daily = Int(policy["dailyCapMin"] as? Double ?? Double(policy["dailyCapMin"] as? Int ?? 30))
    let grid = policy["useDayGrid"] as? Bool ?? false
    let daysRaw = policy["dayLimitsMin"] as? [Any] ?? []
    let days = (0..<7).map { index in
      if index < daysRaw.count {
        if let n = daysRaw[index] as? Int { return max(0, n) }
        if let n = daysRaw[index] as? Double { return max(0, Int(n)) }
      }
      return daily
    }
    var bypass: Date?
    if let iso = policy["bypassUntil"] as? String {
      let formatter = ISO8601DateFormatter()
      formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
      bypass = formatter.date(from: iso) ?? ISO8601DateFormatter().date(from: iso)
    }
    ScreenTimeStore.savePolicy(weekly: weekly, daily: daily, grid: grid, days: days, bypassUntil: bypass)

    if ScreenTimeStore.isBypassed() {
      ScreenTimeStore.clearShield()
    } else if daily == 0 || weekly == 0 {
      ScreenTimeStore.applyShield()
    } else {
      ScreenTimeStore.clearShield()
    }

    try startMonitors(weekly: weekly, daily: daily, grid: grid, days: days)
  }

  func startMonitors(weekly: Int, daily: Int, grid: Bool, days: [Int]) throws {
    let center = DeviceActivityCenter()
    center.stopMonitoring()
    guard let selection = ScreenTimeStore.loadSelection() else { return }

    for weekday in 1...7 {
      let mondayIndex = (weekday + 5) % 7
      let cap = grid ? days[mondayIndex] : daily
      let name = DeviceActivityName("le.day.\(weekday)")
      let schedule = DeviceActivitySchedule(
        intervalStart: DateComponents(hour: 0, minute: 0, weekday: weekday),
        intervalEnd: DateComponents(hour: 23, minute: 59, weekday: weekday),
        repeats: true
      )
      var events: [DeviceActivityEvent.Name: DeviceActivityEvent] = [:]
      if cap > 0 {
        events[DeviceActivityEvent.Name("le.cap")] = DeviceActivityEvent(
          applications: selection.applicationTokens,
          categories: selection.categoryTokens,
          webDomains: selection.webDomainTokens,
          threshold: DateComponents(minute: cap)
        )
      }
      try center.startMonitoring(name, during: schedule, events: events)
    }

    if weekly > 0 {
      let week = DeviceActivityName("le.week")
      let schedule = DeviceActivitySchedule(
        intervalStart: DateComponents(hour: 0, minute: 0, weekday: 2),
        intervalEnd: DateComponents(hour: 23, minute: 59, weekday: 1),
        repeats: true
      )
      let events: [DeviceActivityEvent.Name: DeviceActivityEvent] = [
        DeviceActivityEvent.Name("le.week.cap"): DeviceActivityEvent(
          applications: selection.applicationTokens,
          categories: selection.categoryTokens,
          webDomains: selection.webDomainTokens,
          threshold: DateComponents(minute: weekly)
        ),
      ]
      try center.startMonitoring(week, during: schedule, events: events)
    }
  }

  func scheduleBypassRelock(until: Date) throws {
    let calendar = Calendar.current
    let start = calendar.dateComponents([.hour, .minute, .second], from: Date())
    let end = calendar.dateComponents([.hour, .minute, .second], from: until)
    let schedule = DeviceActivitySchedule(intervalStart: start, intervalEnd: end, repeats: false)
    try DeviceActivityCenter().startMonitoring(DeviceActivityName("le.bypass"), during: schedule, events: [:])
  }
}

enum PickerPresenter {
  @MainActor
  static func present(seed: FamilyActivitySelection) async throws -> FamilyActivitySelection {
    guard let presenter = topController() else {
      throw Exception(name: "ScreenTimePicker", description: "No root view controller")
    }
    return try await withCheckedThrowingContinuation { continuation in
      let host = PickerHostController(selection: seed) { result in
        continuation.resume(with: result)
      }
      host.modalPresentationStyle = .formSheet
      presenter.present(host, animated: true)
    }
  }

  @MainActor
  static func topController() -> UIViewController? {
    let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
    let window = scenes.flatMap { $0.windows }.first { $0.isKeyWindow } ?? scenes.first?.windows.first
    var top = window?.rootViewController
    while let presented = top?.presentedViewController { top = presented }
    return top
  }
}

final class PickerModel: ObservableObject {
  @Published var selection: FamilyActivitySelection
  init(_ selection: FamilyActivitySelection) { self.selection = selection }
}

final class PickerHostController: UIHostingController<PickerSheet> {
  private let model: PickerModel
  private var finished = false
  private let finish: (Result<FamilyActivitySelection, Error>) -> Void

  init(selection: FamilyActivitySelection, finish: @escaping (Result<FamilyActivitySelection, Error>) -> Void) {
    let model = PickerModel(selection)
    self.model = model
    self.finish = finish
    super.init(rootView: PickerSheet(model: model, onDone: { _ in }, onCancel: {}))
    rootView = PickerSheet(
      model: model,
      onDone: { [weak self] value in self?.complete(.success(value)) },
      onCancel: { [weak self] in self?.complete(.success(selection)) }
    )
  }

  private func complete(_ result: Result<FamilyActivitySelection, Error>) {
    guard !finished else { return }
    finished = true
    finish(result)
    if presentingViewController != nil { dismiss(animated: true) }
  }

  override func viewDidDisappear(_ animated: Bool) {
    super.viewDidDisappear(animated)
    if isBeingDismissed { complete(.success(model.selection)) }
  }

  @MainActor required dynamic init?(coder aDecoder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }
}

struct PickerSheet: View {
  @ObservedObject var model: PickerModel
  var onDone: (FamilyActivitySelection) -> Void
  var onCancel: () -> Void

  var body: some View {
    NavigationStack {
      FamilyActivityPicker(selection: $model.selection)
        .navigationTitle("Приложения")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
          ToolbarItem(placement: .cancellationAction) {
            Button("Отмена") { onCancel() }
          }
          ToolbarItem(placement: .confirmationAction) {
            Button("Готово") { onDone(model.selection) }
          }
        }
    }
  }
}

final class LEUsageReportView: ExpoView {
  private let host = UIHostingController(rootView: UsageReportHost(selectionData: nil))

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    clipsToBounds = true
    host.view.backgroundColor = .clear
    addSubview(host.view)
  }

  var selectionData: String = "" {
    didSet { host.rootView = UsageReportHost(selectionData: selectionData.isEmpty ? nil : selectionData) }
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    host.view.frame = bounds
  }
}

struct UsageReportHost: View {
  var selectionData: String?

  var body: some View {
    if let filter = makeFilter() {
      DeviceActivityReport(DeviceActivityReport.Context("Total Activity"), filter: filter)
    } else {
      Text("Выбери приложения — DeviceActivity покажет день и неделю.")
        .font(.footnote)
        .foregroundStyle(.secondary)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .center)
        .padding()
    }
  }

  private func makeFilter() -> DeviceActivityFilter? {
    guard let selectionData, let data = Data(base64Encoded: selectionData),
          let selection = try? PropertyListDecoder().decode(FamilyActivitySelection.self, from: data)
    else { return nil }
    let now = Date()
    let calendar = Calendar.current
    let startOfWeek = calendar.dateInterval(of: .weekOfYear, for: now)?.start
      ?? calendar.startOfDay(for: now)
    return DeviceActivityFilter(
      segment: .daily(during: DateInterval(start: startOfWeek, end: now)),
      applications: selection.applicationTokens,
      categories: selection.categoryTokens,
      webDomains: selection.webDomainTokens
    )
  }
}
