/** @type {import('@bacons/apple-targets/app.plugin').Config} */
module.exports = {
  type: 'device-activity-monitor',
  name: 'LEDeviceActivityMonitor',
  bundleIdentifier: '.DeviceActivityMonitor',
  deploymentTarget: '16.4',
  frameworks: ['DeviceActivity', 'ManagedSettings', 'FamilyControls'],
  entitlements: {
    'com.apple.developer.family-controls': true,
    'com.apple.security.application-groups': ['group.com.lifeengine.app'],
  },
};
