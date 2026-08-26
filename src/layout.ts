import { Platform, useWindowDimensions } from 'react-native';

export const RAIL_WIDTH = 260;

export function useEngineLayout() {
  const { width, height } = useWindowDimensions();
  const isPadDevice = Platform.OS === 'ios' && Platform.isPad;
  const isTablet = isPadDevice || width >= 700;
  const isWide = width >= 1024;
  const sidebar = width >= 900;
  const contentW = sidebar ? Math.max(320, width - RAIL_WIDTH) : width;
  const columns = contentW >= 1100 ? 3 : contentW >= 560 ? 2 : 1;
  const pad = 24;
  const gap = 16;
  const titleSize = 34;
  const tabPad = sidebar ? 32 : isTablet ? 118 : 108;
  const maxContent = contentW;
  const innerW = Math.max(280, contentW - pad * 2);
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
    tabPad,
    maxContent,
  };
}
