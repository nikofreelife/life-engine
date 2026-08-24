import { Platform, useWindowDimensions } from 'react-native';

export function useEngineLayout() {
  const { width, height } = useWindowDimensions();
  const isPadDevice = Platform.OS === 'ios' && Platform.isPad;
  const isTablet = isPadDevice || width >= 700;
  const isWide = width >= 1024;
  const sidebar = width >= 900;
  const contentW = sidebar ? width - 248 : width;
  const columns = contentW >= 1100 ? 3 : contentW >= 560 ? 2 : 1;
  const pad = isTablet ? 36 : 20;
  const titleSize = isTablet ? 34 : 26;
  const maxContent = isWide ? 1280 : 960;

  return {
    width,
    height,
    isPadDevice,
    isTablet,
    isWide,
    columns,
    pad,
    sidebar,
    titleSize,
    maxContent,
    slot: {
      flexGrow: 1,
      flexShrink: 1,
      flexBasis: columns === 1 ? '100%' : columns === 2 ? 260 : 240,
      maxWidth: columns === 1 ? '100%' : columns === 2 ? '50%' : '33.33%',
      minWidth: columns === 1 ? '100%' : 240,
    } as const,
  };
}
