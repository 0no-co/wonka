import React from 'react'
import Link from 'gatsby-link'

import Hero from '../components/Hero'
import Visual from '../components/Visual'
import Content from '../components/Content'

const IndexPage = ({ data: { content: { edges } } }) => (
  <div>
    <Hero />
    <Visual />
    <Content dangerouslySetInnerHTML={{ __html: edges[0].node.html }} />
  </div>
)

export const pageQuery = graphql`
  query IndexMarkdown {
    content: allMarkdownRemark(filter: {id: {regex: "//index.md/"}}) {
      edges {
        node {
          html
        }
      }
    }
  }
`;

export default IndexPage
