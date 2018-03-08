import React from 'react'
import styled, { css } from 'styled-components'
import { rem } from 'polished'
import Link from 'gatsby-link'

import tophat from '../../assets/tophat.png'
import github from '../../assets/github.png'
import npm from '../../assets/npm.png'

const Container = styled.div`
  position: relative;
`

const Placeholder = styled.div`
  height ${p => p.theme.sizes.navbar};
  width: 100%;
`

const Wrapper = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;

  width: 100%;
  height ${rem(60)};
  background: rgba(255, 255, 255, 0.97);
  border-bottom: 1px solid ${p => p.theme.colors.border};
`

const Inner = styled.div`
  margin: 0 auto;
  height: 100%;

  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;

  max-width: ${p => p.theme.sizes.width};
  padding: 0 ${p => p.theme.sizes.gutter};
  color: ${p => p.theme.colors.text};
`

const Logo = styled.img.attrs({
  src: tophat
})`
  width: ${rem(20)};
  height: ${rem(17)};
  margin-right: ${rem(10)};
`

const Title = styled(Link)`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
`

const hoverLine = css`
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  border-bottom: 1px solid ${p => p.theme.colors.border};
  opacity: 0;
  transition: ease-in-out 0.2s opacity;
`

const Name = styled.h3`
  position: relative;
  font-size: ${rem(18)};
  font-weight: 600;

  &:after {
    ${hoverLine}
  }

  ${Title}:hover &:after {
    opacity: 1;
  }
`

const Menu = styled.nav`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
  margin: 0 ${rem(-12)};
`

const Item = styled(Link)`
  position: relative;
  margin: 0 ${rem(12)};
  font-size: ${rem(16)};

  &:after {
    ${hoverLine}
  }

  &:hover:after {
    opacity: 1;
  }
`

const ExternalItem = Item.withComponent('a')

const Pill = styled(Link)`
  margin: 0 ${rem(12)};
  font-size: ${rem(16)};
  font-weight: 600;
  color: ${p => p.theme.colors.bg};
  background: ${p => p.theme.colors.bgAccent};
  border-radius: 1000px;
  padding: ${rem(5.5)} ${rem(14)};
  transition: ease-in-out 0.2s background;

  &:hover {
    background: ${p => p.theme.colors.textAccent};
  }
`

const Github = styled.img.attrs({
  alt: 'Github',
  src: github
})`
  height: ${rem(14)};
  margin: ${rem(8)} 0;
`

const Npm = styled.img.attrs({
  alt: 'npm',
  src: npm
})`
  height: ${rem(12)};
  margin: ${rem(10)} 0 ${rem(8)} 0;
`

const Header = ({ gettingStartedIndex }) => (
  <Container>
    <Placeholder />
    <Wrapper>
      <Inner>
        <Title to="/">
          <Logo />
          <Name>Wonka</Name>
        </Title>
        <Menu>
          <Pill to="/docs/getting-started">Getting Started</Pill>
          <Item to="/docs/guides">Guides</Item>
          <Item to="/docs/api">API</Item>

          <ExternalItem href="https://github.com/kitten/wonka">
            <Github />
          </ExternalItem>
          <ExternalItem href="https://npmjs.com/package/wonka">
            <Npm />
          </ExternalItem>
        </Menu>
      </Inner>
    </Wrapper>
  </Container>
)

export default Header
