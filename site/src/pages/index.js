import React from 'react'
import { Helmet } from 'react-helmet'
import Link from 'gatsby-link'

import Hero from '../components/Hero'
import Visual from '../components/Visual'
import Content from '../components/Content'
import Footer from '../components/Footer'

const IndexPage = ({ data: { content: { html } } }) => (
  <div>
    <Helmet>
      <title>Wonka for Reason</title>
      <meta name="description" content="A Reason library for lightweight observables and iterables loosely based on the callbag spec" />
    </Helmet>
    <Hero />
    <Visual />
    <Content dangerouslySetInnerHTML={{ __html: html }} />
    <Footer />
  </div>
)

export const pageQuery = graphql`
  query IndexMarkdown {
    content: markdownRemark(fileAbsolutePath: { regex: "/content/index.md/" }) {
      html
    }
  }
`

export default IndexPage
