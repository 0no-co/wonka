import React from 'react'
import styled, { ThemeProvider } from 'styled-components'

import * as theme from '../theme'
import Header from '../components/Header'
import '../css/reset.css'

const Container = styled.div`
  min-height: 100vh;
  width: 100%;
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
    </Container>
  </ThemeProvider>
)

export default TemplateWrapper
