import ManagedSettings

@objc(ShieldActionExtension)
class ShieldActionExtension: ShieldActionDelegate {
  override func handle(
    action: ShieldAction,
    for application: ApplicationToken,
    completionHandler: @escaping (ShieldActionResponse) -> Void
  ) {
    respond(action, completionHandler)
  }

  override func handle(
    action: ShieldAction,
    for webDomain: WebDomainToken,
    completionHandler: @escaping (ShieldActionResponse) -> Void
  ) {
    respond(action, completionHandler)
  }

  override func handle(
    action: ShieldAction,
    for category: ActivityCategoryToken,
    completionHandler: @escaping (ShieldActionResponse) -> Void
  ) {
    respond(action, completionHandler)
  }

  private func respond(_ action: ShieldAction, _ completionHandler: @escaping (ShieldActionResponse) -> Void) {
    switch action {
    case .primaryButtonPressed:
      ScreenTimeStore.markPendingUnlock()
      completionHandler(.defer)
    case .secondaryButtonPressed:
      completionHandler(.close)
    @unknown default:
      completionHandler(.close)
    }
  }
}
