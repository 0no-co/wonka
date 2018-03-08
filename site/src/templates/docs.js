import React from 'react'
import { Helmet } from 'react-helmet'
import styled from 'styled-components'

import Content from '../components/Content'
import WithSidebar from '../components/WithSidebar'

const getTitle = (headings = []) => {
  if (!headings[0]) {
    return `Documentation – Wonka`
  }

  return `${headings[0].value} – Wonka`
}

const DocsTemplate = ({
  data: {
    content: {
      headings,
      html
    }
  }
}) => (
  <WithSidebar>
    <Helmet>
      <title>{getTitle(headings)}</title>
    </Helmet>

    <Content isNarrow dangerouslySetInnerHTML={{ __html: html }} />
  </WithSidebar>
)

export default DocsTemplate

export const pageQuery = graphql`
  query DocContentBySlug($slug: String!) {
    content: markdownRemark(fields: { slug: { eq: $slug } }) {
      headings(depth: h1) { value }
      html
    }
  }
`
