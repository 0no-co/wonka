import Typography from 'typography';
import * as theme from './theme';

const typography = new Typography({
  includeNormalize: false,
  baseFontSize: '18px',
  baseLineHeight: 1.5,
  scaleRatio: 46 / 18,
  headerFontFamily: theme.fonts.header,
  headerWeight: '500',
  bodyFontFamily: theme.fonts.body,
  bodyWeight: '400'
});

export default typography;
