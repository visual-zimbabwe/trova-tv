import { Dimensions, PixelRatio } from 'react-native';

const { width: RAW_W, height: RAW_H } = Dimensions.get('window');
// Always treat TV viewport as 16:9 landscape
const SCREEN_WIDTH = Math.max(RAW_W || 960, RAW_H || 540);
const SCREEN_HEIGHT = Math.min(RAW_W || 960, RAW_H || 540);

// 10-foot Android TV baseline dimensions (1920x1080 @ 2.0x density = 960x540 dp)
const guidelineBaseWidth = 960;
const guidelineBaseHeight = 540;

export const scale = (size) => Math.round((SCREEN_WIDTH / guidelineBaseWidth) * size);

export const verticalScale = (size) => Math.round((SCREEN_HEIGHT / guidelineBaseHeight) * size);

export const moderateScale = (size, factor = 0.5) =>
  Math.round(size + (scale(size) - size) * factor);

export const scaleFont = (size) => {
  const newSize = size * (SCREEN_WIDTH / guidelineBaseWidth);
  return Math.max(11, Math.round(PixelRatio.roundToNearestPixel(newSize)));
};

export const isTablet = () => true;
export const isTV = () => true;

export const screenWidth = SCREEN_WIDTH;
export const screenHeight = SCREEN_HEIGHT;
