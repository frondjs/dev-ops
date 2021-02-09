const path = require('path')
const {createFilter, dataToEsm} = require('@rollup/pluginutils')
const nunjucks = require('nunjucks')

module.exports = function njkPlugin (options={}) {
  const filter = createFilter(options.include, options.exclude)
  const env = new nunjucks.Environment()

  return {
    transform(code, id) {
      if (!filter( id )) return;

      if (id.endsWith('.njk')) {
        const arr = path.relative(__dirname, id).split('/')
        arr.shift()
        const name = arr.join('/')

        const templateFunctionData = nunjucks.precompileString(code, {
          env: env,
          name: name
        })

        const esModuleSource = dataToEsm(
          {
            name: name,
          },
          {
            compact: false,
            indent: '\t',
            preferConst: false,
            objectShorthand: false,
            namedExports: true,
          }
        );

        return {
          code: esModuleSource + ` ${templateFunctionData};`,
          map: { mappings: '' }
        };
      }

      return;
    }
  };
}
