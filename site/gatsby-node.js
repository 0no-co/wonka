const path = require('path')

exports.onCreateNode = ({ node, getNode, boundActionCreators }) => {
  const { createNodeField } = boundActionCreators
  if (node.internal.type !== 'MarkdownRemark') {
    return
  }

  const { frontmatter: { id }} = node
  const fileNode = getNode(node.parent)
  const parsedFilePath = path.parse(fileNode.relativePath)

  if (!parsedFilePath.dir || !id) {
    return
  }

  let slug
  if (parsedFilePath.dir) {
    slug = `/${parsedFilePath.dir}/${id}/`
  } else {
    slug = `/${id}/`
  }

  createNodeField({ node, name: 'slug', value: slug })
}

exports.createPages = async ({ graphql, boundActionCreators }) => {
  const { createPage, createRedirect } = boundActionCreators;

  const gettingStartedTemplate = require.resolve('./src/templates/gettingStarted')
  const guidesTemplate = require.resolve('./src/templates/guides')
  const apiTemplate = require.resolve('./src/templates/api')

  const { data: {
    gettingStartedYaml: {
      index: gettingStartedIndex
    },
    guidesYaml: {
      index: guidesIndex
    },
    apiYaml: {
      index: apiIndex
    },
    gettingStarted: { edges: gettingStartedEdges },
    guides: { edges: guidesEdges },
    api: { edges: apiEdges }
  }} = await graphql(`{
    gettingStartedYaml {
      index
    }
    guidesYaml {
      index
    }
    apiYaml {
      index
    }
    gettingStarted: allMarkdownRemark(filter: { fileAbsolutePath: { regex: "/content/docs/getting-started/" }}) {
      edges {
        node {
          frontmatter { id }
          fields { slug }
        }
      }
    }
    guides: allMarkdownRemark(filter: { fileAbsolutePath: { regex: "/content/docs/guides/" }}) {
      edges {
        node {
          frontmatter { id }
          fields { slug }
        }
      }
    }
    api: allMarkdownRemark(filter: { fileAbsolutePath: { regex: "/content/docs/api/" }}) {
      edges {
        node {
          frontmatter { id }
          fields { slug }
        }
      }
    }
  }`)

  const redirect = (from, to) => {
    createRedirect({
      fromPath: from,
      redirectInBrowser: true,
      toPath: to,
    });

    createRedirect({
      fromPath: `${from}/`,
      redirectInBrowser: true,
      toPath: to,
    });
  };

  const create = (basePath, template, edges = [], index = '') => {
    for (const edge of edges) {
      const { node: {
        frontmatter: { id },
        fields: { slug }
      }} = edge;

      createPage({
        path: slug,
        component: template,
        context: { slug }
      })

      if (id === index) {
        redirect(basePath, slug);
      }
    }
  };

  create('/docs/getting-started', gettingStartedTemplate, gettingStartedEdges, gettingStartedIndex);
  create('/docs/guides', guidesTemplate, guidesEdges, guidesIndex);
  create('/docs/api', apiTemplate, apiEdges, apiIndex);
  redirect('/docs', '/docs/getting-started/');
}
