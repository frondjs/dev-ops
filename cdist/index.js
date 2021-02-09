const {execSync} = require('child_process')
const path = require('path')
const fs = require('fs')
const compressing = require('compressing')

module.exports = async function(argv) {
  const config = require('../config')(argv)

  // dist name
  let env = config.get('env')
  if (env == 'production') env = 'prod'
  if (env == 'development') env = 'dev'
  const buildhashcmdout = execSync(
    'cd build && find . | LC_ALL=C sort | tar -cf - -T - --no-recursion | md5sum'
  ).toString()
  const buildhash = buildhashcmdout.trim().replace('-', '').trim()
  const timestamp = parseInt(Date.now()/1000)
  const distname = argv.ctx.project.name + '-' + env + '-' + buildhash.slice(0, 12)
  const distpath = path.join('dist', distname)

  if (!fs.existsSync(distpath)) {
    // create a distributable folder
    execSync('mkdir -p ' + distpath)
    execSync('cp -a build/* ' + distpath)
  }

  // create a compressed version of dist folder
  await compressing.tar.compressDir(distpath, path.join('dist', distname + '.tar'))

  if (!argv.send) return;

  // send dist to the remote server
  const remoteConnStr = config.get('prodServerConnStr')
  if (!remoteConnStr)
    throw new Error('Invalid remote server connection strin.');
  execSync(`rsync -a --no-g --no-o --ignore-existing ${distpath} ${remoteConnStr}`,
    {stdio: 'inherit', encoding: 'utf8'})

  if (!argv.publish) return;

  // publish dist in the remote server
  const [hoststr, remotepath] = remoteConnStr.split(':')
  const remotedistpath = path.join(remotepath, distname)
  const livepath = path.join(remotepath, argv.ctx.project.name + '-' + env + '-live')
  execSync(`ssh ${hoststr} ln -sfn ${remotedistpath} ${livepath} && exit`)
};
