const {execSync} = require('child_process')
const fs = require('fs')
const path = require('path')
const git = require('git-rev-sync')
const colors = require('colors')

module.exports = async function deploy(argv) {
  const config = require('../config')(argv)
  const pkgjson = JSON.parse(fs.readFileSync('./package.json', 'utf8'))
  const name = pkgjson.name

  // checkout
  let hasGit = false
  try {
    git.remoteUrl()
    hasGit = true
  } catch (e) {}
  if (hasGit && argv.version) {
    execSync(`git checkout tags/${argv.version} -b master`,
      {shell: true, stdio: [0, 1, 2], encoding: 'utf8'})
  }

  // build
  execSync(`frond pojson`, {shell: true, stdio: [0, 1, 2], encoding: 'utf8'})

  try {
    execSync(`npm run build`, {shell: true, stdio: [0, 1, 2], encoding: 'utf8'})
  } catch (e) {
    console.log(e)
    console.log('Canceled deployment.'.red)
    return;
  }

  if (config.get('env') != 'development') {
    try {
      execSync(`frond ssr`, {shell: true, stdio: [0, 1, 2], encoding: 'utf8'})
    } catch (e) {
      console.log(e)
      console.log('Canceled deployment.'.red)
      return;
    }
  }

  // create a distribution
  const distpath = await require('../cdist')(argv)

  // send
  if (!config.get('serverConnStr') || !config.get('serverDistPath')) {
    throw new Error('"serverConnStr" or "serverDistPath" should be set.')
  }
  const remoteProjectPath = path.join(config.get('serverDistPath'), name)
  const remoteConnStr = config.get('serverConnStr') + ':' + remoteProjectPath
  try {
    execSync(`rsync -a --no-g --no-o --ignore-existing ${distpath} ${remoteConnStr}`,
      {shell: true, stdio:[0, 1, 2], encoding: 'utf8'})
  } catch (e) {
    console.log(e)
    console.log('Canceled deployment.'.red)
    return;
  }

  // publish
  const remoteProjectDeploymentPath = path.join(config.get('serverDistPath'), name, path.basename(distpath))
  const livePath = path.join(config.get('serverDistPath'), name, 'live')
  execSync(`ssh ${config.get('serverConnStr')} ln -sfn ${remoteProjectDeploymentPath} ${livePath} && exit`,
    {shell: true, stdio:[0, 1, 2], encoding: 'utf8'})

  console.log(`Deployed successfully.`.blue)
}
