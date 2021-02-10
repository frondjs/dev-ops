#!/usr/bin/env node

const os = require('os')
const {execSync} = require('child_process')
const path = require('path')
const pkg = require('./package.json')
const scriptName = Object.keys(pkg.bin)[0]

// context
const cwd = process.cwd()
const pkgname = pkg.name.indexOf('/') === -1 ? pkg.name : pkg.name.split('/')[1]
const ctx = {
  framework: {
    path: path.join(__dirname),
    name: pkgname
  },
  project: {
    path: cwd,
    name: cwd.split('/').reverse()[0]
  }
}

require('yargs')
  .scriptName(scriptName)
  .usage(`${scriptName} <cmd> [args]`)
  .config({ctx: ctx})
  .command('ssr', 'Generates static html pages.', (yargs) => {}, function (argv) {
    process.env.APIFY_LOCAL_STORAGE_DIR = path.join(os.homedir(), '.frondjs/apify_storage')
    process.env.APIFY_DEFAULT_KEY_VALUE_STORE_ID = 'frondjs'
    process.env.APIFY_DEFAULT_DATASET_ID = 'frondjs'

    execSync('rm -rf ' + process.env.APIFY_LOCAL_STORAGE_DIR)

    require('./ssr')(argv)
  })
  .command('pogen', 'Generates po message catalog.', (yargs) => {}, function(argv) {
    const xgettext = path.resolve(path.dirname(require.resolve('xgettext-regex')), '..', '.bin/xgettext-regex')
    execSync('test -f translations/messages.po || touch translations/messages.po && ' + xgettext + ' ./src -o translations/messages.po')
  })
  .command('pojson', 'Converts po message catalogs to json.', (yargs) => {}, function(argv) {
    const po2json = path.resolve(path.dirname(require.resolve('po2json')), '..', '.bin/po2json')
    execSync("mkdir -p static/translations && GLOBIGNORE='*messages.po:*.mo'; for f in translations/*; do " + po2json + " ${f%%.*}.po static/${f%%.*}.json; done")
  })
  .command('cdist', 'Create a distribution.', yargs => {
    yargs.positional('send', {
      type: 'boolean',
      default: false,
      describe: 'Send dist to the remote server.',
    })

    yargs.positional('publish', {
      type: 'boolean',
      default: false,
      describe: 'Publish dist.',
    })
  }, function(argv) {
    require('./cdist')(argv)
  })
  /*
  .command('bootstrap-project', '', yargs => {}, function(argv) {
    require('./bootstrap-project')(argv)
  })
  */
  /*
  .command('send', 'Sends dist to a remote server', yargs => {}, function(argv) {
    require('./send')(argv)
  })
  */
  .help()
  .argv
