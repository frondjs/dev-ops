const {execSync} = require('child_process')
const path = require('path')
const fs = require('fs')
const compressing = require('compressing')
const git = require('git-rev-sync')

module.exports = async function(argv) {
  const config = require('../config')(argv)

  let hasGit = false
  try {
    git.remoteUrl()
    hasGit = true
  } catch (e) {}

  // dist name
  let env = config.get('env')
  if (env == 'production') env = 'prod'
  if (env == 'development') env = 'dev'
  let nameSuffix = ''
  if (hasGit) {
    const pkgjson = JSON.parse(fs.readFileSync('./package.json', 'utf8'))

    nameSuffix = pkgjson.version
  }
  else {
    const timestamp = parseInt(Date.now()/1000)
    const buildhashcmdout = execSync(
      'cd build && find . | LC_ALL=C sort | tar -cf - -T - --no-recursion | md5sum'
    ).toString()
    const buildhash = buildhashcmdout.trim().replace('-', '').trim()

    nameSuffix = buildhash.slice(0, 12)
  }
  const distname = argv.ctx.project.name + '-' + env + '-' + nameSuffix
  const distpath = path.join('dist', distname)

  if (!fs.existsSync(distpath)) {
    // create a distributable folder
    execSync('mkdir -p ' + distpath, {shell: true, stdio:[0, 1, 2]})
    execSync('cp -a build/* ' + distpath, {shell: true, stdio:[0, 1, 2]})
  }

  // create a compressed version of dist folder
  await compressing.tar.compressDir(distpath, path.join('dist', distname + '.tar'))

  return distpath;
};
