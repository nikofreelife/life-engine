/** @type {import('@bacons/apple-targets/app.plugin').Config} */
module.exports = {
  type: 'device-activity-monitor',
  name: 'LEActivityReport',
  bundleIdentifier: '.ActivityReport',
  deploymentTarget: '16.4',
  frameworks: ['DeviceActivity', 'SwiftUI', 'FamilyControls'],
  entitlements: {
    'com.apple.developer.family-controls': true,
    'com.apple.security.application-groups': ['group.com.lifeengine.app'],
  },
};
