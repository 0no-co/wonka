import React from 'react'
import styled, { css } from 'styled-components'
import { rem } from 'polished'
import Link from 'gatsby-link'

import wonka from '../../assets/wonka.png'

const Container = styled.div`
  position: relative;
  overflow: hidden;
  width: 100%;
  max-width: 100%;
  height: ${rem(500)};
`

const Wrapper = styled.div`
  height: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;

  max-width: ${p => p.theme.sizes.width};
  padding: 0 ${p => p.theme.sizes.gutter};
  color: ${p => p.theme.colors.text};
`

const LeftColumn = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  max-width: ${rem(600)};
  padding-right: ${rem(20)};
`

const RightColumn = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  height: 100%;
  max-width: ${rem(320)};
  padding-right: ${rem(48)};
`

const Name = styled.h1`
  color: ${p => p.theme.colors.textAccent};
  font-size: ${rem(144)};
  line-height: 1.2;
  letter-spacing: ${rem(-7.88)};
  font-weight: 600;
`

const Emphasis = styled.em`
  font-weight: 600;
  font-style: normal;
`

const Description = styled.h2`
  font-weight: 400;
  font-size: ${rem(26)};
  margin-bottom: ${rem(15)};
`

const Row = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  margin: ${rem(15)} ${rem(-12)};
`

const Button = styled(Link)`
  margin: 0 ${rem(12)};
  font-size: ${rem(22)};
  font-weight: 600;
  color: ${p => p.theme.colors.bg};
  background: ${p => p.theme.colors.bgAccent};
  border-radius: ${rem(3)};
  padding: ${rem(12)} ${rem(16)};
  transition: ease-in-out 0.2s background;

  &:hover {
    background: ${p => p.theme.colors.textAccent};
  }
`

const Item = styled.a`
  margin: 0 ${rem(12)};
  font-size: ${rem(22)};
  color: ${p => p.theme.colors.textAccent};
  text-decoration: underline;
`

const Gradient = styled.div`
  background: linear-gradient(${p => p.theme.colors.bgDarkTranslucent}, ${p => p.theme.colors.bgDark});
  position: absolute;
  left: ${rem(48)};
  width: 100vw;
  top: 0;
  bottom: 0;
  z-index: 0;
`

const Portrait = styled.img.attrs({
  alt: 'Willy Wonka — In memory of Gene Wilder (1933–2016)',
  src: wonka
})`
  width: 100%;
  z-index: 1;
`

const Hero = () => (
  <Container>
    <Wrapper>
      <LeftColumn>
        <Name>
          Wonka
        </Name>
        <Description>
          A Reason library for lightweight <Emphasis>observables</Emphasis> and <Emphasis>iterables</Emphasis> loosely based on the callbag spec.
        </Description>
        <Row>
          <Button to="/getting-started">Getting Started</Button>
          <Item href="https://github.com/kitten/wonka">Github</Item>
          <Item href="https://npmjs.com/package/wonka">npm</Item>
        </Row>
      </LeftColumn>
      <RightColumn>
        <Gradient />
        <Portrait />
      </RightColumn>
    </Wrapper>
  </Container>
)

export default Hero
