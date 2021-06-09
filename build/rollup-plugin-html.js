const fs = require('fs')
const path = require('path')

const defaultOpts = {
  filename: 'index.html',
  title: 'FrondJS App',
  meta: ['<meta charset="utf-8">'],
  body: '<div id="frondapp"></div>'
}

module.exports = function html(options={}) {
  const {title, meta, body, filename} = Object.assign({}, defaultOpts, options)

  return {
    generateBundle(output, bundle) {
      const bundleFilenames = Object.keys(bundle)
      const cssBundles = bundleFilenames.filter(n => path.extname(n) == '.css')
      const jsBundles = bundleFilenames.filter(n => path.extname(n) == '.js')

      const template = `<!DOCTYPE html>
<html>
  <head>
    <title>${title}</title>
    ${meta.join('')}
    ${cssBundles.map(
      b => `<link rel="stylesheet" type="text/css" href="/${b}">`
    ).join('')}
  </head>
  <body>
    ${body}
    ${jsBundles.map(
      b => `<script type="text/javascript" src="/${b}"></script>`
    ).join('')}
  </body>
</html>`

      this.emitFile({
        type: 'asset',
        source: template,
        fileName: filename
      });

      return;
    }
  }
}
