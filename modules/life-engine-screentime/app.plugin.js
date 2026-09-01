const APP_GROUP = 'group.com.lifeengine.app';

function withFamilyControls(config) {
  config.ios = config.ios ?? {};
  config.ios.infoPlist = {
    ...(config.ios.infoPlist ?? {}),
    NSFamilyControlsUsageDescription:
      'Life Engine использует Экранное время Apple, чтобы ты выбирал установленные приложения и блокировал их на уровне системы, когда лимит исчерпан.',
  };
  config.ios.entitlements = {
    ...(config.ios.entitlements ?? {}),
    'com.apple.developer.family-controls': true,
    'com.apple.security.application-groups': [APP_GROUP],
  };
  const extra = config.extra ?? {};
  const eas = extra.eas ?? {};
  const build = eas.build ?? {};
  const experimental = build.experimental ?? {};
  const ios = experimental.ios ?? {};
  const appExtensions = [
    {
      targetName: 'LEDeviceActivityMonitor',
      bundleIdentifier: 'com.lifeengine.app.DeviceActivityMonitor',
      entitlements: {
        'com.apple.developer.family-controls': true,
        'com.apple.security.application-groups': [APP_GROUP],
      },
    },
    {
      targetName: 'LEShieldAction',
      bundleIdentifier: 'com.lifeengine.app.ShieldAction',
      entitlements: {
        'com.apple.developer.family-controls': true,
        'com.apple.security.application-groups': [APP_GROUP],
      },
    },
    {
      targetName: 'LEShieldConfiguration',
      bundleIdentifier: 'com.lifeengine.app.ShieldConfiguration',
      entitlements: {
        'com.apple.developer.family-controls': true,
        'com.apple.security.application-groups': [APP_GROUP],
      },
    },
    {
      targetName: 'LEActivityReport',
      bundleIdentifier: 'com.lifeengine.app.ActivityReport',
      entitlements: {
        'com.apple.developer.family-controls': true,
        'com.apple.security.application-groups': [APP_GROUP],
      },
    },
  ];
  config.extra = {
    ...extra,
    eas: {
      ...eas,
      build: {
        ...build,
        experimental: {
          ...experimental,
          ios: {
            ...ios,
            appExtensions: [...(ios.appExtensions ?? []), ...appExtensions],
          },
        },
      },
    },
  };
  return config;
}

module.exports = withFamilyControls;
