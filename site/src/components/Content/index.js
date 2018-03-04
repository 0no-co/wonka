import React from 'react'
import styled, { css } from 'styled-components'
import { rem } from 'polished'

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

const Content = styled.div`
  margin: 0 auto;
  max-width: ${p => p.theme.sizes.width};
  padding: ${rem(10)} ${p => p.theme.sizes.gutter};
  color: ${p => p.theme.colors.text};

  h1 {
    color: ${p => p.theme.colors.textAccent};
    font-size: 3.998rem;
    line-height: 1.4;
    margin: 0.5em 0 0.4em 0;
  }

  h2 {
    font-weight: 400;
    font-size: 2.827rem;
    line-height: 1.4;
    margin: 0.45em 0 0.35em;
  }

  h3 {
    font-weight: 400;
    font-size: 1.999rem;
    line-height: 1.4;
    margin: 0.45em 0 0.35em;
  }

  p {
    font-size: 20px;
    line-height: 1.6;
    margin: 0.35em 0 0.6em 0;
  }

  a {
    color: ${p => p.theme.colors.textAccent};
    font-weight: 600;
    position: relative;
  }
  a:after { ${hoverLine} }
  a:hover:after { opacity: 1; }

  a.anchor > svg {
    fill: ${p => p.theme.colors.textLight};
  }

  a.anchor:after {
    bottom: auto;
    top: 1.1em;
  }

  pre:not([class*="language-"]),
  code:not([class*="language-"]) {
    font-weight: 500;
    color: ${p => p.theme.colors.textLight};
    padding: 0 ${rem(3)};
    font-size: 0.9em;
  }

  pre[class*="language-"] {
    background: #2a2734;
    color: #9a86fd;
    border-radius: 0.3rem;
    font-size: 16px;
    padding: ${rem(12)} ${rem(18)};
    max-width: ${rem(900)};
    margin: ${rem(35)} auto;
  }
`

export default Content
