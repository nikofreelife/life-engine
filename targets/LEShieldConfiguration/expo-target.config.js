/** @type {import('@bacons/apple-targets/app.plugin').Config} */
module.exports = {
  type: 'shield-config',
  name: 'LEShieldConfiguration',
  bundleIdentifier: '.ShieldConfiguration',
  deploymentTarget: '16.4',
  frameworks: ['ManagedSettings', 'ManagedSettingsUI'],
  entitlements: {
    'com.apple.developer.family-controls': true,
    'com.apple.security.application-groups': ['group.com.lifeengine.app'],
  },
};
