const {execSync} = require('child_process')
const fs = require('fs')
const path = require('path')
const readline = require('readline')
const git = require('git-rev-sync')
const calver = require('calver')
const {stringkit} = require('basekits')
const madmiral = require('madmiral')
const colors = require('colors')

module.exports = async function announce(argv) {
  const shellopts = {shell: true, stdio: [0, 1, 2], encoding: 'utf8'}
  const config = require('../config')(argv)
  const pkgjson = JSON.parse(fs.readFileSync('./package.json', 'utf8'))
  const language = config.get('devopsLanguage') || 'en'

  try {
    git.remoteUrl()
  } catch (e) {
    throw new Error(`Nothing to announce since this is not a git repository.`)
  }

  const currentBranch = git.branch(argv.ctx.project.path)

  let version = null
  // checkout to specified version
  if (argv.v) {
    version = argv.v
  }
  // or the latest tag
  else {
    const output = execSync('git describe --tags `git rev-list --tags --max-count=1`', {encoding: 'utf8'})
    version = output.split(/[\r\n]/).filter(o => o)[0]
  }

  console.log(colors.blue('Checking version ' + version))

  const commitMessage = execSync(`git tag -l --format='%(contents)' ${version}`, {encoding: 'utf8'})

  console.log('Writing an announcement'.blue)

  let versionLong = version
  if (config.get('versioningScheme') == 'calver') {
    versionLong = calver.pretty(config.get('versioningFormat'), version.slice(0, 1) == 'v' ? version.slice(1) : version, language)
  }
  const templatePath = path.join(argv.ctx.framework.path, `announce/templates/${language}.html`)
  const template = fs.readFileSync(templatePath, 'utf8')
  const content = stringkit.template(template, {
    versionFancy: versionLong,
    projectName: pkgjson.name,
    url: config.get('produrl'),
    releaseNotes: commitMessage.split(/[\r\n]/).map(msg => msg + "<br>").join('')
  })

  let sender = null
  const opts = {}
  if (config.get('awsSesRegion') && config.get('awsSesAccessKeyId') && config.get('awsSesSecretAccessKey')) {
    sender = config.get('awsSesSender')
    opts.awsses = {region: config.get('awsSesRegion')}
    process.env['AWS_ACCESS_KEY_ID'] = config.get('awsSesAccessKeyId')
    process.env['AWS_SECRET_ACCESS_KEY'] = config.get('awsSesSecretAccessKey')
  }
  if (config.get('gmailSender') && config.get('gcloudProject') && config.get('gmailApplicationCredentials')) {
    sender = config.get('gmailSender')
    opts.gmail = {subject: config.get('gmailSender')}
    process.env['GCLOUD_PROJECT'] = config.get('gcloudProject')
    process.env['GOOGLE_APPLICATION_CREDENTIALS'] = config.get('gmailApplicationCredentials')
  }
  if (!sender || !config.get('releaseRecipients')) {
    throw new Error(`Either "releaseRecipients" or awsSesSender or gmailSender is missing.`)
  }

  madmiral.configure(opts)

  const msg = madmiral.createEmailMessage({
    sender: sender,
    recipients: config.get('releaseRecipients').split(','),
    subject: `🚀 ${pkgjson.name} ${version}`,
    message: content
  })

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  rl.question(`
${colors.bold('Email content:')}
${content}---

${colors.blue('The email above will be sent to "' + config.get('releaseRecipients') + '".')}

${colors.red('Are you sure? (y/n):')} `, async (answer) => {
  if (answer == 'y') {
    console.log(colors.blue(`Sending...`))

    const resp = await madmiral.send(msg)
    if (resp.success) {
      console.log(colors.green('Sent.'))
    }
    else {
      console.log(colors.red(`Couldn't send.`))
      console.log('Debug:', resp.responses)
    }

    rl.close()
  }
  else {
    console.log(colors.blue(`Dind't send. Bye.`))

    rl.close()
  }
  })
}
