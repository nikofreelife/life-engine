import DeviceActivity
import SwiftUI

@objc(ActivityReportExtension)
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
  var daily: String
  var weekly: String
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
    let startOfWeek = calendar.date(from: calendar.dateComponents([.yearForWeekOfYear, .weekOfYear], from: now)) ?? startOfDay

    var daily: TimeInterval = 0
    var weekly: TimeInterval = 0

    for await day in data {
      for await segment in day.activitySegments {
        let duration = segment.totalActivityDuration
        if segment.dateInterval.end >= startOfWeek { weekly += duration }
        if segment.dateInterval.end >= startOfDay { daily += duration }
      }
    }

    return TotalActivityConfiguration(daily: format(daily), weekly: format(weekly))
  }

  private func format(_ interval: TimeInterval) -> String {
    let total = Int(interval.rounded())
    let hours = total / 3600
    let minutes = (total % 3600) / 60
    if hours > 0 { return "\(hours) ч \(minutes) мин" }
    return "\(minutes) мин"
  }
}

struct TotalActivityView: View {
  var configuration: TotalActivityConfiguration

  var body: some View {
    VStack(alignment: .leading, spacing: 10) {
      Text("НАСТОЯЩЕЕ ВРЕМЯ")
        .font(.caption.weight(.bold))
        .foregroundStyle(Color(red: 0.55, green: 0.36, blue: 0.96))
      HStack(spacing: 16) {
        VStack(alignment: .leading, spacing: 2) {
          Text("Сегодня").font(.caption).foregroundStyle(.secondary)
          Text(configuration.daily).font(.title3.weight(.bold)).foregroundStyle(.white)
        }
        VStack(alignment: .leading, spacing: 2) {
          Text("Неделя").font(.caption).foregroundStyle(.secondary)
          Text(configuration.weekly).font(.title3.weight(.bold)).foregroundStyle(.white)
        }
        Spacer()
      }
    }
    .padding(14)
    .frame(maxWidth: .infinity, alignment: .leading)
    .background(Color(red: 0.08, green: 0.09, blue: 0.12))
  }
}
