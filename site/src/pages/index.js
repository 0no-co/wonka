import React from 'react'
import Link from 'gatsby-link'

import Hero from '../components/Hero'
import Visual from '../components/Visual'
import Content from '../components/Content'

const IndexPage = () => (
  <div>
    <Hero />
    <Visual />
    <Content>
      <h1>Hi beautiful people</h1>
      <h2>Welcome to your new Gatsby site.</h2>
      <h3>Hope you like it :)</h3>
      <p>Now go build something great.</p>
      <p>
        <Link to="/page-2/">Go to page 2</Link>
      </p>
    </Content>
  </div>
)

export default IndexPage
