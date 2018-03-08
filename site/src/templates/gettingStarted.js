export default from './docs';

export const pageQuery = graphql`
  query GettingStartedContentBySlug($slug: String!) {
    content: markdownRemark(fields: { slug: { eq: $slug } }) {
      fields { slug }
      frontmatter { title }
      html
    }
    others: allMarkdownRemark(filter: { fileAbsolutePath: { regex: "/content/docs/getting-started//" }}) {
      edges {
        node {
          frontmatter {
            id
            title
          }
          fields { slug }
          headings(depth: h2) { value }
        }
      }
    }
    order: gettingStartedYaml {
      items { id }
    }
  }
`
