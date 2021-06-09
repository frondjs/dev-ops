const path = require('path')
const {execSync} = require('child_process')

function cleanupPrevBuild() {
  execSync('rm -rf build/*')
}

function copyAssets(opts={output: 'build/static'}) {
  const {output} = opts
  const outputPath = path.relative('.', path.normalize(output))
  const scriptpath = path.join(__dirname, 'gen_asset_manifest.sh')
  return execSync('bash ' + scriptpath + ' ' + outputPath)
    .toString()
    .split(/[\r\n]/)
    .filter(line => line.length > 0)
    .reduce(function(memo, item, ind) {
      if (ind % 2 == 0) memo[ind] = [item]
      else memo[ind-1].push(item)
      return memo
    }, [])
    .reduce(function(memo, pair) {
      const prop = pair[0].replace(/^static\/?/, '')
      const value = pair[1].replace(/^build\/?/, '')
      memo[prop] = value
      return memo
    }, {})
}

function shortenCSSPropertyName(name) {
  let result = ''
  for (var i = 0; i < name.length; i++) {
    if (i % 2 == 0) {
      result += name[i].toLowerCase()
    }
    if (result.length > 3) break
  }
  return result
}

function copyNginxConfig() {
  execSync(`if find nginx -mindepth 1 -maxdepth 1 | read; then cp -a nginx build/; fi`)
}

module.exports = {
  cleanupPrevBuild: cleanupPrevBuild,
  copyAssets: copyAssets,
  shortenCSSPropertyName: shortenCSSPropertyName,
  njk: require('./rollup-plugin-njk'),
  html: require('./rollup-plugin-html'),
  copyNginxConfig: copyNginxConfig
}
