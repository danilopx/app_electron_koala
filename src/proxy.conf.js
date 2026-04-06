var PROXY_CONFIG = [
 
  {
    context: [
      '/api-edi'
    ],
    target: 'https://ingestionlayer.neogrid.com',
    secure: false,
    changeOrigin: true,
    pathRewrite: {
      '^/api-edi': ''
    }
  },
  {
    context: [
      '/proxy-edi'
    ],
    target: 'https://ingestionlayer.neogrid.com/rest/sidecar-rest',
    secure: false,
    changeOrigin: true,
    pathRewrite: {
      '^/proxy-edi': ''
    }
  }
];

module.exports = PROXY_CONFIG;