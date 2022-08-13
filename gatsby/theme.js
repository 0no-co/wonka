import nightOwlLight from 'prism-react-renderer/themes/nightOwlLight';
import './theme.css';

const systemFonts = [
  '-apple-system',
  'BlinkMacSystemFont',
  'Segoe UI',
  'Roboto',
  'Helvetica Neue',
  'Arial',
  'Noto Sans',
  'sans-serif',
  'Apple Color Emoji',
  'Segoe UI Emoji',
  'Segoe UI Symbol',
  'Noto Color Emoji',
];

export const fonts = {
  header: ['phantom-sans', ...systemFonts],
  code: ['space-mono', 'monospace'],
  body: systemFonts,
};

export const colors = {
  bg: '#ffffff',
  bgPassive: '#f0f0f2',
  bgActive: '#fcfafe',
  fg: '#36313d',
  fgHeading: '#000000',
  fgPassive: '#78757a',
  fgActive: '#f5735f',
};

export const prismTheme = nightOwlLight;
export const fontSizes = [12, 14, 16, 20, 24, 32, 48, 64, 96];
export const fontWeights = ['300', '400', '500', '700', '800'];
export const letterSpacings = ['normal', '0.01em', '0.05em', '0.1em'];
export const borderWidths = ['1px', '0.1rem', '0.25rem'];
export const space = [0, 4, 8, 16, 32, 64];
export const sizes = [0, 64, 260, 430, 540, 650, 870, 980, 1400];
export const breakpoints = ['55em', '70em'];
export const radii = [4, 8, 16];
export const zIndices = [0, 1, 2, 3];

export const borders = [
  `${borderWidths[0]} solid ${colors.bgPassive}`,
  `${borderWidths[1]} solid ${colors.bgPassive}`,
  `${borderWidths[2]} solid ${colors.bgPassive}`,
];
