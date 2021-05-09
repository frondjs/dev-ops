const os = require('os')
const {execSync} = require('child_process')
const fs = require('fs')
const path = require('path')
const semver = require('semver')
const calver = require('calver')

function updatepkgjson(version, json) {
  json.version = version
  fs.writeFileSync('./package.json', JSON.stringify(json, null, 2))
}

module.exports = function gitflow(argv) {
  const execopts = {shell: true, stdio:[0, 1, 2]}
  const config = require('../config')(argv)
  const scheme = config.get('versioningScheme')
  const format = config.get('versioningFormat')
  const isStarting = argv.finish === true ? false : true
  const isFinishing = !isStarting
  const pkgjson = JSON.parse(fs.readFileSync('./package.json', 'utf8'))
  const version = pkgjson.version

  // detect tag and pre generate the next version
  let tag = argv.tag, nextVersion = null
  if (isStarting && (argv.release || argv.hotfix)) {
    if (!tag) {
      const possibleTag = format.split('.').reverse()[0]
      const tagType = calver.getTagType(possibleTag)
      if (tagType == 'semantic' || tagType == 'modifier') {
        tag = possibleTag
      }
    }

    if (!tag) {
      throw new Error('Invalid tag. No possible tag found also.')
    }

    nextVersion = scheme == 'calver' ? calver.inc(format, version, tag) : semver.inc(version, tag)
  }

  // create a temporary file for commit message
  const commitMsgFile = path.join(os.homedir(), 'COMMIT_MESSAGE.txt')
  if (!argv.message && !fs.existsSync(commitMsgFile)) {
    throw new Error(`Either no -m flag specified and no ${commitMsgFile} file found for commit message.`)
  }
  if (argv.message) {
    const commitMessages = Array.isArray(argv.m) ? argv.m : [argv.m]
    const commitMsgFileContent = commitMessages.reduce(function(memo, msg) {
      memo += msg + "\r\n"
      return memo
    }, '')
    fs.writeFileSync(commitMsgFile, commitMsgFileContent)
  }

  if (argv.release) {
    if (isStarting) {
      execSync(`git flow release start ${nextVersion}`, execopts)
      execSync(`git flow release publish ${nextVersion}`, execopts)
      updatepkgjson(nextVersion, pkgjson)
    }

    if (isFinishing) {
      execSync(`git add . && git commit -F ${commitMsgFile}`, execopts)
      execSync(`git push origin release/${version}`, execopts)
      execSync(`GIT_MERGE_AUTOEDIT=no git flow release finish -f ${commitMsgFile} -p ${version}`, execopts)
    }
  }

  if (argv.hotfix) {
    if (isStarting) {
      execSync(`git flow hotfix start ${nextVersion}`, execopts)
      updatepkgjson(nextVersion, pkgjson)
    }

    if (isFinishing) {
      execSync(`git add . && git commit -F ${commitMsgFile}`, execopts)
      execSync(`GIT_MERGE_AUTOEDIT=no git flow hotfix finish -f ${commitMsgFile} -p ${version}`, execopts)
    }
  }

  if (argv.feature) {
    if (isStarting) {
      execSync(`git flow feature start ${feature}`, execopts)
      execSync(`git flow feature publish ${feature}`, execopts)
    }

    if (isFinishing) {
      execSync(`git add . && git commit -F ${commitMsgFile}`, execopts)
      execSync(`git push origin feature/${feature}`, execopts)
      execSync(`GIT_MERGE_AUTOEDIT=no git flow feature finish -f ${commitMsgFile} -p ${feature}`, execopts)
    }
  }

  execSync(`rm ${commitMsgFile}`)
}
