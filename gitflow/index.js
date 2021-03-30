const {execSync} = require('child_process')
const fs = require('fs')
const semver = require('semver')
const calver = require('calver')

function updatepkgjson(version, json) {
  json.version = version
  fs.writeFileSync('./package.json', JSON.stringify(json, null, 2))
}

module.exports = function gitflow(argv) {
  const tag = argv.tag || undefined
  const message = argv.m
  const config = require('../config')(argv)
  const scheme = config.get('versioningScheme')
  const format = config.get('versioningFormat')

  const pkgjson = JSON.parse(fs.readFileSync('./package.json', 'utf8'))
  const currentVersion = pkgjson.version

  if (argv.release) {
    if (argv.start) {
      const nextVersion = scheme == 'calver'
        ? calver.inc(format, currentVersion, tag)
        : semver.inc(currentVersion, tag)
      execSync(`git flow release start ${nextVersion}`, {shell: true, stdio:[0, 1, 2]})
      execSync(`git flow release publish ${nextVersion}`, {shell: true, stdio:[0, 1, 2]})
      updatepkgjson(nextVersion, pkgjson)
    }
    else if (argv.finish) {
      execSync(`git push origin release/${currentVersion}`, {shell: true, stdio:[0, 1, 2]})
      execSync(`git flow release finish -p ${currentVersion}`, {shell: true, stdio:[0, 1, 2]})
    }
    else {
      throw new Error('Specify --start or --finish argument.')
    }

    return;
  }

  if (argv.hotfix) {
    if (argv.start) {
      const nextVersion = scheme == 'calver'
        ? calver.inc(format, currentVersion, (tag || 'micro'))
        : semver.inc(currentVersion, (tag || 'patch'))
      execSync(`git flow hotfix start ${nextVersion}`, {shell: true, stdio:[0, 1, 2]})
      updatepkgjson(nextVersion, pkgjson)
    }
    else if (argv.finish) {
      execSync(`git flow hotfix finish -p ${currentVersion}`, {shell: true, stdio:[0, 1, 2]})
    }
    else {
      throw new Error('Specify --start or --finish argument.')
    }

    return;
  }

  if (argv.feature) {
    const feature = argv.name
    if (argv.start) {
      execSync(`git flow feature start ${feature}`, {shell: true, stdio:[0, 1, 2]})
      execSync(`git flow feature publish ${feature}`, {shell: true, stdio:[0, 1, 2]})
    }
    else if (argv.finish) {
      execSync(`git push origin feature/${feature}`, {shell: true, stdio:[0, 1, 2]})
      execSync(`git flow feature finish -p ${feature}`, {shell: true, stdio:[0, 1, 2]})
    }
    else {
      throw new Error('Specify --start or --finish argument.')
    }

    return;
  }
}
