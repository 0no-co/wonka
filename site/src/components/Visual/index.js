import React from 'react'
import styled, { css } from 'styled-components'
import { rem } from 'polished'
import Link from 'gatsby-link'

import wonka from '../../assets/wonka.png'

const Container = styled.div`
  position: relative;
  width: 100%;
  height: ${rem(150)};
  margin: ${rem(50)} 0 ${rem(70)} 0;
`

const Row = styled.div`
  position: relative;
  padding: ${rem(20)} 0;
  color: ${p => p.theme.colors[p.color]};

  &:before {
    content: "";
    position: absolute;
    height: ${rem(5)};
    left: 0;
    right: 0;
    top: 50%;
    margin-top: ${rem(-2.5)};
    background: ${p => p.theme.colors.bgDark};
  }
`

const InnerRow = styled.div`
  margin: 0 auto;
  position: relative;
  height: ${rem(23)};
  min-height: ${rem(23)};
  max-width: ${p => p.theme.sizes.width};
  padding: 0 ${p => p.theme.sizes.gutter};
`

const Emission = styled.div`
  width: ${rem(23)};
  height: ${rem(23)};
  background: currentColor;
  border-radius: ${rem(2)};
  border: 1px solid ${p => p.theme.colors.border};

  position: absolute;
  left: ${p => p.left * 100}%;
`

const Visual = () => (
  <Container>
    <Row color="bgAccent">
      <InnerRow>
        <Emission left={0.05} />
        <Emission left={0.17} />
        <Emission left={0.28} />
        <Emission left={0.58} />
        <Emission left={0.81} />
      </InnerRow>
    </Row>
    <Row color="secondary">
      <InnerRow>
        <Emission left={0.28} />
        <Emission left={0.81} />
      </InnerRow>
    </Row>
    <Row color="tertiary">
      <InnerRow>
        <Emission left={0.35} />
        <Emission left={0.88} />
      </InnerRow>
    </Row>
  </Container>
)

export default Visual
