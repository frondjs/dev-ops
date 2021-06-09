const {execSync} = require('child_process')
const path = require('path')
const dns = require('dns')
const url = require('url')

module.exports = async function ideploy(argv) {
  async function matchHostnameWithServer(urlstr, ip) {
    return new Promise(function(resolve, reject) {
      const u = new url.URL('http://' + urlstr)
      dns.lookup(u.hostname, {all: true}, function(err, addresses) {
        if (err) throw err
        const matches = addresses.filter(o => o.address == ip)
        return resolve(matches && matches.length > 0 ? u.hostname : null)
      })
    })
  }

  const config = require('../config')(argv)
  if (!config.get('produrl') || !config.get('serverConnStr')) {
    throw new Error(`Set "produrl" and "serverConnStr" first in your config file.`)
  }
  let remoteConnStr = config.get('serverSudoConnStr')
  if (!remoteConnStr) remoteConnStr = config.get('serverConnStr')

  try {
    remoteConnStr.split('@')[1].split(':')[0]
  } catch (e) {
    throw new Error(`"serverSudoConnStr" should be in the following format: user@ip:/home/user/somefolder`)
  }

  const u = new url.URL(config.get('produrl'))
  const serverip = remoteConnStr.split('@')[1].split(':')[0]
  const hostname = await matchHostnameWithServer(u.hostname, serverip)
  if (!hostname) {
    throw new Error(`You should point ${u.hostname} to ${serverip} in your dns hosting. Just create an A record and wait for the update to be active.`)
  }

  // start initial deploy
  const protocol = u.protocol
  const sudouser = remoteConnStr.split('@')[0]
  const webuser = config.get('serverConnStr').split('@')[0]
  const cmdOsUser = sudouser == webuser ? '' : ' --osuser ' + webuser

  const certbotEmail = config.get('certbotEmail')
  const envstr = 'LANGUAGE=en_US.UTF-8 LC_ALL=en_US.UTF-8 LC_CTYPE=en_US.UTF-8 LANG=en_US.UTF-8'
  const script = path.resolve(__dirname, 'bootstrap.sh')
  const cmd = `ssh ${remoteConnStr} ${envstr} "bash -s -- " < ${script} --hostname ${hostname} --protocol ${protocol} --project ${argv.ctx.project.name} --certbotemail ${certbotEmail} --puid ${argv.puid}${cmdOsUser}`
  execSync(cmd, {shell: true, encoding: 'utf8', stdio: [0, 1, 2]})

  return;
}
