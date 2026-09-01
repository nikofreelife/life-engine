/** @type {import('@bacons/apple-targets/app.plugin').Config} */
module.exports = {
  type: 'shield-action',
  name: 'LEShieldAction',
  bundleIdentifier: '.ShieldAction',
  deploymentTarget: '16.4',
  frameworks: ['ManagedSettings', 'FamilyControls'],
  entitlements: {
    'com.apple.developer.family-controls': true,
    'com.apple.security.application-groups': ['group.com.lifeengine.app'],
  },
};
