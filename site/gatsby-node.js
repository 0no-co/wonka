const path = require('path')

exports.onCreateNode = ({ node, boundActionCreators, getNode }) => {
  const { createNodeField } = boundActionCreators

  if (node.internal.type !== 'MarkdownRemark') {
    return
  }

  const fileNode = getNode(node.parent)
  const parsedFilePath = path.parse(fileNode.relativePath)

  let slug
  if (parsedFilePath.name !== 'index' && parsedFilePath.dir) {
    slug = `/${parsedFilePath.dir}/${parsedFilePath.name}/`
  } else if (parsedFilePath.dir === "") {
    slug = `/${parsedFilePath.name}/`
  } else {
    slug = `/${parsedFilePath.dir}/`
  }

  createNodeField({ node, name: 'slug', value: slug })
}

exports.createPages = async ({ graphql, boundActionCreators }) => {
  const { createPage } = boundActionCreators;
  const docsTemplate = require.resolve('./src/templates/docs')

  const { data: { docs: { edges }}} = await graphql(`{
    docs: allMarkdownRemark(filter: { fileAbsolutePath: { regex: "/content/docs//" }}) {
      edges {
        node {
          fields {
            slug
          }
        }
      }
    }
  }`)

  for (const edge of edges) {
    const { node: { fields: { slug }}} = edge;
    createPage({
      path: slug,
      component: docsTemplate,
      context: { slug }
    })
  }
}
