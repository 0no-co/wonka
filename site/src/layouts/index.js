import React from 'react'
import styled, { ThemeProvider } from 'styled-components'
import { rem } from 'polished'

import * as theme from '../theme'
import Header from '../components/Header'
import '../css/reset.css'
import '../css/prism.css'

const Footer = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
  height: ${rem(80)};
  background: linear-gradient(${p => p.theme.colors.bgDarkTranslucent}, ${p => p.theme.colors.bgDark});
`

const Container = styled.div`
  position: relative;
  min-height: 100vh;
  width: 100%;
  padding-bottom: ${rem(105)};
`;

const Content = styled.div`
  width: 100%;
  color: ${p => p.theme.colors.text};
`;

const TemplateWrapper = ({ children }) => (
  <ThemeProvider theme={theme}>
    <Container>
      <Header />
      <Content>
        {children()}
      </Content>
      <Footer />
    </Container>
  </ThemeProvider>
)

export default TemplateWrapper
