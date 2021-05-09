#!/usr/bin/env node

const os = require('os')
const {execSync} = require('child_process')
const fs = require('fs')
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
  .command('create', 'Creates a new project.', yargs => {}, function(argv) {
    require('./create')(argv)
  })
  .command('develop', 'Initiates development environment.', yargs => {}, function(argv) {
    execSync('node_modules/.bin/frond-dev-server start --publicpath build --watch true', {shell: true, stdio: [0, 1, 2]})
  })
  .command('ssr', 'Generates static html pages.', (yargs) => {}, function (argv) {
    process.env.APIFY_LOCAL_STORAGE_DIR = path.join(os.homedir(), '.frondjs/apify_storage')
    process.env.APIFY_DEFAULT_KEY_VALUE_STORE_ID = 'frondjs'
    process.env.APIFY_DEFAULT_DATASET_ID = 'frondjs'

    execSync('rm -rf ' + process.env.APIFY_LOCAL_STORAGE_DIR)

    require('./ssr')(argv)
  })
  .command('pogen', 'Generates po message catalog.', (yargs) => {}, function(argv) {
    if (!fs.existsSync('./translations')) return;
    const xgettext = path.resolve(path.dirname(require.resolve('xgettext-regex')), '..', '.bin/xgettext-regex')
    execSync('test -f translations/messages.po || touch translations/messages.po && ' + xgettext + ' ./app -o translations/messages.po')
  })
  .command('pojson', 'Converts po message catalogs to json.', (yargs) => {}, function(argv) {
    if (!fs.existsSync('./translations')) return;
    const po2json = path.resolve(path.dirname(require.resolve('po2json')), '..', '.bin/po2json')
    execSync("mkdir -p static/translations && GLOBIGNORE='*messages.po:*.mo'; for f in translations/*; do " + po2json + " ${f%%.*}.po static/${f%%.*}.json; done")
  })
  .command('cdist', 'Create a distribution.', yargs => {}, function(argv) {
    require('./cdist')(argv)
  })
  .command('git', 'Git flow wrapper commands.', yargs => {
    yargs.positional('feature', {
      type: 'string',
      default: '',
      describe: 'Creates a new feature branch. The value of this argument should be the name of the feature.'
    })
    yargs.positional('release', {
      type: 'boolean',
      default: false,
      describe: 'Creates a new release branch. The value of this argument is automatically assigned.'
    })
    yargs.positional('hotfix', {
      type: 'boolean',
      default: false,
      describe: 'Creates a new hotfix branch. The value of this argument is automatically assigned.',
    })

    yargs.positional('tag', {
      type: 'string',
      describe: 'Level of the commit.'
    })
    yargs.positional('finish', {
      type: 'boolean',
      default: false,
      describe: 'Tags and merges the release, feature or hotfix with the default branch.'
    })
    yargs.positional('message', {
      type: 'string',
      alias: 'm',
      describe: 'Commit message. It can be specified multiple times to create multiline commit messages.'
    })
  }, function(argv) {
    require('./gitflow')(argv)
  })
  .command('ideploy', 'Initial deploy. Setup project on a remote server.', yargs => {}, async function(argv) {
    await require('./ideploy')(argv)
  })
  .command('deploy', 'Deploys the project. Accepts version numbers in git projects.', yargs => {
    yargs.positional('version', {
      type: 'string',
      default: '',
      describe: 'The version number you would like to deploy, if the project based on git.'
    })
  }, function(argv) {
    require('./deploy')(argv)
  })
  .command('announce', 'Sends an email to the list of people specified in the config.', yargs => {
    yargs.positional('v', {
      type: 'string',
      default: '',
      describe: 'The version number you would like to announce.'
    })
  }, function(argv) {
    require('./announce')(argv)
  })
  .help()
  .argv
