import styled from 'styled-components'
import { rem } from 'polished'

const Footer = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
  height: ${rem(80)};
  background: linear-gradient(${p => p.theme.colors.bgDarkTranslucent}, ${p => p.theme.colors.bgDark});
`

export default Footer
