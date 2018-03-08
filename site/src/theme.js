import { opacify, rem } from 'polished'

export const colors = {
  text: '#1a1919',
  textLight: '#3e363c',
  textFaint: '#605e63',
  textAccent: '#f5735f',
  bg: '#ffffff',
  bgDark: '#feefea',
  bgDarkTranslucent: opacify(-1, '#feefea'),
  bgAccent: '#ff7f6a',
  sidebar: '#f9f7f8',
  border: '#efe3eb',
  secondary: '#6babff',
  tertiary: '#ffc46b'
};

export const sizes = {
  width: rem(1100),
  narrow: rem(890),
  gutter: rem(20),
  sidebar: rem(420)
};
