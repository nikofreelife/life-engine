import DeviceActivity
import Foundation
import SwiftUI

@main
struct ActivityReportExtension: DeviceActivityReportExtension {
  var body: some DeviceActivityReportScene {
    TotalActivityReport { configuration in
      TotalActivityView(configuration: configuration)
    }
  }
}

extension DeviceActivityReport.Context {
  static let totalActivity = Self("Total Activity")
}

struct TotalActivityConfiguration {
  var dailyMinutes: Int
  var weeklyMinutes: Int
  var dailyCap: Int
  var weeklyCap: Int
}

struct TotalActivityReport: DeviceActivityReportScene {
  let context: DeviceActivityReport.Context = .totalActivity
  let content: (TotalActivityConfiguration) -> TotalActivityView

  func makeConfiguration(
    representing data: DeviceActivityResults<DeviceActivityData>
  ) async -> TotalActivityConfiguration {
    let calendar = Calendar.current
    let now = Date()
    let startOfDay = calendar.startOfDay(for: now)
    let startOfWeek = calendar.date(from: calendar.dateComponents([.yearForWeekOfYear, .weekOfYear], from: now))
      ?? startOfDay

    var daily: TimeInterval = 0
    var weekly: TimeInterval = 0

    for await day in data {
      for await segment in day.activitySegments {
        let duration = segment.totalActivityDuration
        if segment.dateInterval.end >= startOfWeek { weekly += duration }
        if segment.dateInterval.end >= startOfDay { daily += duration }
      }
    }

    return TotalActivityConfiguration(
      dailyMinutes: Int((daily / 60).rounded()),
      weeklyMinutes: Int((weekly / 60).rounded()),
      dailyCap: ScreenTimeStore.todayCapMinutes(now: now),
      weeklyCap: ScreenTimeStore.weeklyCapMinutes()
    )
  }
}

struct TotalActivityView: View {
  var configuration: TotalActivityConfiguration

  var body: some View {
    VStack(alignment: .leading, spacing: 14) {
      Text("DEVICE ACTIVITY")
        .font(.caption.weight(.bold))
        .foregroundStyle(Color(red: 0.55, green: 0.36, blue: 0.96))
      UsageBar(
        title: "Сегодня",
        used: configuration.dailyMinutes,
        cap: configuration.dailyCap
      )
      UsageBar(
        title: "Неделя",
        used: configuration.weeklyMinutes,
        cap: configuration.weeklyCap
      )
    }
    .padding(14)
    .frame(maxWidth: .infinity, alignment: .leading)
    .background(Color(red: 0.05, green: 0.05, blue: 0.07))
  }
}

struct UsageBar: View {
  var title: String
  var used: Int
  var cap: Int

  private var ratio: CGFloat {
    guard cap > 0 else { return used > 0 ? 1 : 0 }
    return min(1, CGFloat(used) / CGFloat(cap))
  }

  var body: some View {
    VStack(alignment: .leading, spacing: 6) {
      HStack {
        Text(title).font(.caption.weight(.semibold)).foregroundStyle(.secondary)
        Spacer()
        Text("\(format(used)) / \(cap > 0 ? format(cap) : "без лимита")")
          .font(.caption.weight(.bold))
          .foregroundStyle(.white)
      }
      GeometryReader { geo in
        ZStack(alignment: .leading) {
          Capsule().fill(Color.white.opacity(0.08))
          Capsule()
            .fill(ratio >= 1 ? Color(red: 0.94, green: 0.27, blue: 0.27) : Color(red: 0.55, green: 0.36, blue: 0.96))
            .frame(width: max(8, geo.size.width * ratio))
        }
      }
      .frame(height: 10)
    }
  }

  private func format(_ minutes: Int) -> String {
    let hours = minutes / 60
    let rest = minutes % 60
    if hours > 0 && rest > 0 { return "\(hours) ч \(rest) мин" }
    if hours > 0 { return "\(hours) ч" }
    return "\(rest) мин"
  }
}
