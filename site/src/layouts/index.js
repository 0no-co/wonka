import React from 'react'
import styled, { ThemeProvider } from 'styled-components'
import { rem } from 'polished'

import * as theme from '../theme'
import Header from '../components/Header'
import '../css/reset.css'
import '../css/prism.css'

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

const MainLayout = ({ children }) => (
  <ThemeProvider theme={theme}>
    <Container>
      <Header />
      <Content>
        {children()}
      </Content>
    </Container>
  </ThemeProvider>
)

export default MainLayout
