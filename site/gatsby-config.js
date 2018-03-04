module.exports = {
  siteMetadata: {
    title: 'Wonka',
  },
  plugins: [
    'gatsby-plugin-preact',
    'gatsby-plugin-react-helmet',
    'gatsby-plugin-styled-components',
    'gatsby-plugin-manifest',
    'gatsby-plugin-offline',
    {
      resolve: 'gatsby-plugin-favicon',
      options: {
        logo: './src/assets/tophat.png',
        injectHTML: true,
        icons: {
          android: true,
          appleIcon: true,
          appleStartup: true,
          coast: false,
          favicons: true,
          firefox: true,
          twitter: false,
          yandex: false,
          windows: false
        }
      }
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/content`,
        name: 'markdown-pages',
      },
    },
    {
      resolve: 'gatsby-transformer-remark',
      options: {
        plugins: [
          'gatsby-remark-prismjs',
          'gatsby-remark-smartypants',
          'gatsby-remark-external-links',
          'gatsby-remark-autolink-headers',
          'gatsby-plugin-sharp',
          {
            resolve: 'gatsby-remark-images',
            options: {
              maxWidth: 1090
            },
          },
        ]
      }
    },
    {
      resolve: 'gatsby-plugin-netlify',
      options: {
        headers: {
          '/static/*': [
            'cache-control: public,max-age=31536000,immutable'
          ]
        },
        mergeLinkHeaders: true,
        mergeCachingHeaders: true,
        generateMatchPathRewrites: true
      },
    },
  ],
};
