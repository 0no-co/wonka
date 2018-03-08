import React, { Component } from 'react'
import styled, { css } from 'styled-components'
import { rem } from 'polished'
import Link from 'gatsby-link'

import { slugify } from '../../utils/slugify'
import Arrow from './Arrow'

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
  padding: ${p => p.theme.sizes.sidebarSpacing} ${rem(15)};
`

const Item = styled.div`
  display: flex;
  flex-direction: column;
`

const Title = styled(Link).attrs({
  activeClassName: 'active'
})`
  font-weight: 600;
  font-size: ${rem(20)};
  margin: ${rem(10)} ${rem(15)};
  color: ${p => p.theme.colors.textLight};
  opacity: 0.9;

  &:hover, &.active {
    color: ${p => p.theme.colors.text};
    opacity: 1;
  }
`

const Subitem = styled.a`
  color: ${p => p.theme.colors.textFaint};
  font-size: ${rem(16)};
  margin: ${rem(5)} ${rem(25)};
`

const Sidebar = ({ activeSlug, items }) => (
  <Wrapper>
    {
      items.map(node => {
        const {
          fields: { slug },
          frontmatter: { title },
          headings = []
        } = node

        return (
          <Item>
            <Title to={slug}>
              {title}
              {headings.length && <Arrow />}
            </Title>

            {
              activeSlug && headings.map(({ value }) => (
                <Subitem href={`#${slugify(value)}`}>{value}</Subitem>
              ))
            }
          </Item>
        )
      })
    }
  </Wrapper>
)

export default Sidebar
