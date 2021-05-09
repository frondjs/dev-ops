const os = require('os')
const {execSync} = require('child_process')
const fs = require('fs')
const path = require('path')
const https = require('https')
const git = require('git-rev-sync')
const calver = require('calver')

function initGitFlow() {
  try {
    git.remoteUrl()
  } catch (e) {
    return;
  }

  execSync(`git add . && git commit -m "Frond codebase setup."`, {stdio: [0, 1, 2]})
  execSync(`git flow init -d`, {stdio: [0, 1, 2]})
}

function createConfigFiles(config) {
  const pkgjson = JSON.parse(fs.readFileSync('./package.json', 'utf8'))
  const name = pkgjson.name

  const dev = {
    env: config.get('env'),
    produrl: '',
    port: config.get('port'),
    versioningScheme: config.get('versioningScheme'),
    versioningFormat: config.get('versioningFormat'),
    serverConnStr: '',
    serverDistPath: '',
    serverSudoConnStr: '',
    certbotEmail: '',
    devopsLanguage: 'en',
    releaseRecipients: '',
    awsSesSender: '',
    awsSesRegion: '',
    awsSesAccessKeyId: '',
    awsSesSecretAccessKey: '',
    gmailSender: '',
    gcloudProject: '',
    gmailApplicationCredentials: ''
  }
  const devname = [name, dev.env, 'config'].join('-') + '.json'
  const devpath = path.join(os.homedir(), '.frondjs', devname)
  fs.writeFileSync(devpath, JSON.stringify(dev, null, 2))

  const prod = {
    env: 'production',
    produrl: '',
    versioningScheme: config.get('versioningScheme'),
    versioningFormat: config.get('versioningFormat'),
    serverConnStr: '',
    serverDistPath: '',
    serverSudoConnStr: '',
    certbotEmail: '',
    devopsLanguage: 'en',
    releaseRecipients: '',
    awsSesSender: '',
    awsSesRegion: '',
    awsSesAccessKeyId: '',
    awsSesSecretAccessKey: '',
    gmailSender: '',
    gcloudProject: '',
    gmailApplicationCredentials: ''
  }
  const prodname = [name, prod.env, 'config'].join('-') + '.json'
  const prodpath = path.join(os.homedir(), '.frondjs', prodname)
  fs.writeFileSync(prodpath, JSON.stringify(prod, null, 2))
}

function savePackage(obj) {
  fs.writeFileSync('./package.json', JSON.stringify(obj, null, 2))
}

function updatePackageWithRepoURL(config) {
  const pkgjson = JSON.parse(fs.readFileSync('./package.json', 'utf8'))

  // update version
  const initialVersion = calver.init(config.get('versioningFormat'))
  pkgjson.version = initialVersion

  // find project name from parent folder
  const name = path.basename(process.cwd())
  pkgjson.name = name

  // update repo urls
  let urlgitformat = null, urlhttpsformat = null, urlgithttpsformat = null,
    urlpathformat = null

  try {
    const url = git.remoteUrl()
    if (url.indexOf('git@') === 0) {
      urlgitformat = url
      urlhttpsformat = urlgitformat.replace(':', '/').replace('git@', 'https://')
    }
    else {
      urlhttpsformat = url
      urlgitformat = urlhttpsformat.replace('https://', 'git@').replace('/', ':')
    }
    urlgithttpsformat = 'git+' + urlhttpsformat
    urlpathformat = urlhttpsformat.replace('.git', '')
  } catch (e) {
    // not a git repo, exit
    delete pkgjson.repository
    delete pkgjson.bugs
    delete pkgjson.homepage
    savePackage(pkgjson)
    return;
  }

  pkgjson.repository.url = urlgithttpsformat
  pkgjson.bugs.url = urlpathformat + '/issues'
  pkgjson.homepage = urlpathformat + '#readme'

  // update name
  const namegit = urlpathformat.split('/').reverse()[0]
  pkgjson.name = namegit

  // save changes
  savePackage(pkgjson)

  return;
}

module.exports = function create(argv) {
  if (fs.existsSync('./app') || fs.existsSync('./package.json')) {
    throw new Error(`Project directory should be empty.`)
  }

  const config = require('../config')(argv)

  const baseURL = 'https://raw.githubusercontent.com/frondjs/template-zero/main/'
  const pkgjsonURL = baseURL + 'package.json'

  // fetch package.json to find latest version
  https.get(pkgjsonURL, res => {
    if (res.statusCode < 200 || res.statusCode > 400) {
      throw new Error(`Couldn't fetch template repository. ${res.statusCode} returned.`)
    }

    res.setEncoding('utf8')

    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; })
    res.on('end', () => {
      try {
        const pkgjson = JSON.parse(rawData)
        const packfile = 'template-zero-' + pkgjson.version + '.tgz'
        const packURL = baseURL + packfile

        // fetch template pack
        https.get(packURL, res => {
          if (res.statusCode < 200 || res.statusCode > 400) {
            throw new Error(`Couldn't fetch template pack. ${res.statusCode} returned.`)
          }

          const stream = res.pipe(fs.createWriteStream(packfile))

          stream.on('finish', function() {
            // exctract template
            execSync(`tar -xzf ${packfile} --strip-components=1`, {stdio: [0, 1, 2]})

            // remove devops
            execSync(`rm -rf ./devops`)

            // create .gitignore
            const gitignore = [
              '**/.DS_Store',
              '**/node_modules',
              '**/*.log',
              'build',
              'dist'
            ].join("\r\n")
            fs.writeFileSync('./.gitignore', gitignore)

            // install dependencies
            execSync(`npm install`, {stdio: [0, 1, 2]})

            // update package.json repo url, name and version
            updatePackageWithRepoURL(config)

            // create sample config files
            createConfigFiles(config)

            // remove pack
            fs.unlinkSync(packfile)

            // enable git flow if this is a git repo
            initGitFlow()
          })
        })
      } catch (e) {
        throw new Error(`Couldn't parse package.json file. ${e.message}`)
      }
    })
  })
}
