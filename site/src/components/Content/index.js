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

const contentWidth = p => p.theme.sizes[p.isNarrow ? 'narrow' : 'width'];

const Content = styled.div`
  margin: 0 auto;
  width: ${contentWidth};
  max-width: 100%;
  padding: ${rem(10)} ${p => p.theme.sizes.gutter};
  color: ${p => p.theme.colors.text};

  hr {
    border: none;
    border-top: 1px solid ${p => p.theme.colors.border};
    margin: ${rem(35)} 0;
  }

  h1 {
    color: ${p => p.theme.colors.textAccent};
    font-size: 3.998rem;
    line-height: 1.4;
    margin: 0.5em 0 0.4em 0;
    letter-spacing: ${rem(-0.2)};
  }

  h2 {
    font-weight: 600;
    font-size: 2.627rem;
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
    font-size: ${rem(20)};
    line-height: 1.6;
    margin: 0.35em 0 0.6em 0;
  }

  & > h1 ~ p:nth-child(2) {
    font-size: ${rem(24)};
    line-height: 1.5;
    margin: 0.55em 0 1.2em 0;
    letter-spacing: ${rem(-0.2)};
    color: ${p => p.theme.colors.textFaint};
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

  h1 > a.anchor:after {
    top: 1.05em;
  }

  pre:not([class*="language-"]),
  code:not([class*="language-"]) {
    font-weight: 500;
    color: ${p => p.theme.colors.textLight};
    padding: 0 ${rem(3)};
    font-size: 0.9em;
  }

  pre[class*="language-"] {
    background: #25282d;
    color: ${p => p.theme.colors.bg};
    border-radius: ${rem(9)};
    font-size: 16px;
    width: 100%;
    padding: ${rem(22)} ${rem(32)};
    margin: ${rem(24)} ${rem(-30)};
  }
`

export default Content
