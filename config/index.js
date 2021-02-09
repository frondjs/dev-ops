const os = require('os')
const path = require('path')
const convict = require('convict')
const schema = require('./schema')

module.exports = function(argv) {
  const config = convict(schema)

  const userConfigName = argv.ctx.project.name + '-' + config.get('env') + '-config.json'
  const userConfig = path.join(os.homedir(), '.frondjs', userConfigName)
  try {
    config.loadFile(userConfig);
  } catch (e) {}

  config.validate({allowed: 'strict'})

  return config
}
