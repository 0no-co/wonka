import React from 'react'
import { Helmet } from 'react-helmet'
import styled from 'styled-components'

import Content from '../components/Content'
import WithSidebar from '../components/WithSidebar'

const toItems = (others = [], order = []) => {
  const otherNodesById = others.reduce((acc, { node }) => {
    acc[node.frontmatter.id] = node
    return acc
  }, {});

  const orderedNodes = order.map(({ id }) => otherNodesById[id])
  return orderedNodes
};

const DocsTemplate = ({
  data: {
    content: {
      fields: { slug },
      frontmatter: { title },
      html
    },
    order: { items: itemsOrder },
    others: { edges: others } = {}
  }
}) => (
  <WithSidebar
    items={toItems(others, itemsOrder)}
    activeSlug={slug}
  >
    <Helmet>
      <title>{title} — Wonka</title>
    </Helmet>

    <Content isNarrow dangerouslySetInnerHTML={{ __html: html }} />
  </WithSidebar>
)

export default DocsTemplate

