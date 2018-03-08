import React from 'react'
import styled from 'styled-components'

import Sidebar from './Sidebar'

const Container = styled.div`
  padding-right: ${p => p.theme.sizes.sidebar};
`

const WithSidebar = ({
  children,
  activeSlug,
  items
}) => (
  <Container>
    <Sidebar items={items} activeSlug={activeSlug} />
    {children}
  </Container>
)

export default WithSidebar
