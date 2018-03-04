import React from 'react'
import Link from 'gatsby-link'

import Hero from '../components/Hero'
import Visual from '../components/Visual'

const IndexPage = () => (
  <div>
    <Hero />
    <Visual />
    <h1>Hi beautiful people</h1>
    <p>Welcome to your new Gatsby site.</p>
    <p>Now go build something great.</p>
    <Link to="/page-2/">Go to page 2</Link>
  </div>
)

export default IndexPage
