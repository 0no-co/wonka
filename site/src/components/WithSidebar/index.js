import React from 'react'
import styled from 'styled-components'

const Container = styled.div`
  padding-right: ${p => p.theme.sizes.sidebar};
`

const Wrapper = styled.nav`
  position: fixed;
  display: block;
  z-index: 5;
  right: 0;
  top: 0;
  bottom: 0;
  overflow-y: auto;
  background: ${p => p.theme.colors.sidebar};
  width: ${p => p.theme.sizes.sidebar};
  border-left: 1px solid ${p => p.theme.colors.border};
`

const WithSidebar = ({ children }) => (
  <Container>
    <Wrapper />
    {children}
  </Container>
)

export default WithSidebar
