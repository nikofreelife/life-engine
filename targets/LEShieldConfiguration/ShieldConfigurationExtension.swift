import Foundation
import ManagedSettings
import ManagedSettingsUI
import UIKit

@objc(ShieldConfigurationExtension)
class ShieldConfigurationExtension: ShieldConfigurationDataSource {
  private var config: ShieldConfiguration {
    ShieldConfiguration(
      backgroundBlurStyle: .systemUltraThinMaterialDark,
      backgroundColor: UIColor(red: 0.04, green: 0.05, blue: 0.07, alpha: 1),
      icon: UIImage(systemName: "hourglass"),
      title: ShieldConfiguration.Label(text: "Лимит исчерпан", color: .white),
      subtitle: ShieldConfiguration.Label(
        text: "Единственный обход — дисциплинарная фраза в Life Engine.",
        color: UIColor(white: 0.72, alpha: 1)
      ),
      primaryButtonLabel: ShieldConfiguration.Label(text: "Открыть Life Engine", color: .white),
      primaryButtonBackgroundColor: UIColor(red: 0.94, green: 0.27, blue: 0.27, alpha: 1),
      secondaryButtonLabel: ShieldConfiguration.Label(text: "Закрыть", color: UIColor(white: 0.7, alpha: 1))
    )
  }

  override func configuration(shielding application: Application) -> ShieldConfiguration { config }
  override func configuration(shielding application: Application, in category: ActivityCategory) -> ShieldConfiguration { config }
  override func configuration(shielding webDomain: WebDomain) -> ShieldConfiguration { config }
  override func configuration(shielding webDomain: WebDomain, in category: ActivityCategory) -> ShieldConfiguration { config }
}
