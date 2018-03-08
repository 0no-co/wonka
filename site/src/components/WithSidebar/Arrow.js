import React from 'react'
import styled, { css } from 'styled-components'

const ArrowSvg = styled.svg.attrs({
  viewBox: '0 0 926.23699 573.74994',
  x: '0px',
  y: '0px',
  width: 10,
  height: 10
})`
  margin-left: 7px;
  transform: rotateX(0deg);
  transition: transform 0.2s ease;

  .active > & {
    transform: rotateX(180deg);
  }
`

const Arrow = () => (
  <ArrowSvg>
    <g transform="translate(904.92214,-879.1482)">
      <path
        d="
            m -673.67664,1221.6502 -231.2455,-231.24803 55.6165,
            -55.627 c 30.5891,-30.59485 56.1806,-55.627 56.8701,-55.627 0.6894,
            0 79.8637,78.60862 175.9427,174.68583 l 174.6892,174.6858 174.6892,
            -174.6858 c 96.079,-96.07721 175.253196,-174.68583 175.942696,
            -174.68583 0.6895,0 26.281,25.03215 56.8701,
            55.627 l 55.6165,55.627 -231.245496,231.24803 c -127.185,127.1864
            -231.5279,231.248 -231.873,231.248 -0.3451,0 -104.688,
            -104.0616 -231.873,-231.248 z
          "
        fill="currentColor"
      />
    </g>
  </ArrowSvg>
);

export default Arrow;
