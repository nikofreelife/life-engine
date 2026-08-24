import { Platform, useWindowDimensions } from 'react-native';

export function useEngineLayout() {
  const { width, height } = useWindowDimensions();
  const isPadDevice = Platform.OS === 'ios' && Platform.isPad;
  const isTablet = isPadDevice || width >= 700;
  const isWide = width >= 1024;
  const sidebar = width >= 900;
  const contentW = sidebar ? width - 248 : width;
  const columns = contentW >= 1100 ? 3 : contentW >= 560 ? 2 : 1;
  const pad = isTablet ? 44 : 24;
  const gap = isTablet ? 22 : 18;
  const titleSize = isTablet ? 34 : 26;
  const maxContent = isWide ? 1280 : 960;
  const innerW = Math.max(280, Math.min(maxContent, contentW) - pad * 2);
  const cardWidth = columns === 1 ? innerW : (innerW - gap * (columns - 1)) / columns;

  return {
    width,
    height,
    isPadDevice,
    isTablet,
    isWide,
    columns,
    pad,
    gap,
    cardWidth,
    sidebar,
    titleSize,
    maxContent,
  };
}
