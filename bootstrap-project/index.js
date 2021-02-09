const dns = require('dns')
const url = require('url')

module.exports = function bootstrapProject(argv) {
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
  const u = new url.URL(config.get('produrl'))
  const serverip = config.get('prodServerConnStr').split('@')[1].split(':')[0]
  const hostname = await matchHostnameWithServer(u.hostname, serverip)
  if (!hostname)
    throw new Error(`Hostname ${u.hostname} doesn't seem to be pointed to ${serverip}.
Make sure that you have configured your DNS correctly.`);

  // TODO maybe implement bootstrap project

  return;
}
